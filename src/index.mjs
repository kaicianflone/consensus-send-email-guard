import crypto from 'node:crypto';
import { handler as generatePersonaSet } from 'consensus-persona-generator/src/index.mjs';
import { generatePersonaVotes, generateRewritePatch } from './llm.mjs';
import { validateInput } from './validate.mjs';
import {
  aggregateVotes,
  updateReputations,
  makeIdempotencyKey,
  readBoardPolicy,
  getLatestPersonaSet,
  getPersonaSet,
  getDecisionByIdempotency,
  writeArtifact,
  writeDecision,
  resolveStatePath,
} from 'consensus-guard-core/src/index.mjs';

const DEFAULT_POLICY = {
  method: 'WEIGHTED_APPROVAL_VOTE',
  approve_threshold: 0.7
};

function err(board_id, code, message, details = {}) {
  return { board_id, error: { code, message, details } };
}

function summarize(email_draft, constraints) {
  let risk_level = 'low';
  const text = `${email_draft.subject || ''}\n${email_draft.body || ''}`.toLowerCase();
  if (/guarantee|promise|lawsuit|ssn|social security|dob|confidential/.test(text)) risk_level = 'high';
  else if (/urgent|immediately|escalate/.test(text)) risk_level = 'medium';
  return {
    to_count: (email_draft.to || []).length,
    subject: email_draft.subject || '',
    risk_level,
    constraints_snapshot: constraints
  };
}

export async function handler(input, opts = {}) {
  const board_id = input?.board_id;
  const statePath = resolveStatePath(opts);

  try {
    const validationError = validateInput(input);
    if (validationError) return err(board_id || '', 'INVALID_INPUT', validationError);

    const policy = (await readBoardPolicy(board_id, statePath)) || DEFAULT_POLICY;

    const idempotency_key = makeIdempotencyKey({ board_id, email_draft: input.email_draft, constraints: input.constraints || {}, sender_profile: input.sender_profile || {}, persona_set_id: input.persona_set_id || null });

    const prior = await getDecisionByIdempotency(board_id, idempotency_key, statePath);
    if (prior?.response) {
      return prior.response;
    }

    const externalMode = input.mode === 'external_agent';
    let personaSet = null;
    if (!externalMode) {
      if (input.persona_set_id) {
        personaSet = await getPersonaSet(board_id, input.persona_set_id, statePath);
      }
      if (!personaSet) {
        personaSet = await getLatestPersonaSet(board_id, statePath);
      }
    }
    if (!personaSet && !externalMode) {
      const generated = await generatePersonaSet({
        board_id,
        task_context: {
          goal: 'Email governance',
          audience: input.sender_profile?.relationship || 'external',
          risk_tolerance: input.sender_profile?.risk_tolerance || 'medium',
          constraints: Object.entries(input.constraints || {}).filter(([, v]) => !!v).map(([k]) => k),
          domain: 'email'
        },
        n_personas: 5,
        persona_pack: 'comms'
      }, { statePath });
      if (generated.error) return err(board_id, 'PERSONA_GENERATION_FAILED', generated.error.message, generated.error.details);
      personaSet = {
        board_id,
        persona_set_id: generated.persona_set_id,
        created_at: generated.created_at,
        personas: generated.personas
      };
    }

    const votes = externalMode
      ? input.external_votes
      : await generatePersonaVotes(personaSet, input.email_draft, input.constraints || {});
    const aggregation = aggregateVotes(votes, policy);

    let rewrite_patch = {};
    if (aggregation.final_decision === 'REWRITE') {
      rewrite_patch = await generateRewritePatch(input.email_draft);
    }

    const decision_id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const email_summary = summarize(input.email_draft, input.constraints || {});

    const decisionPayload = {
      board_id,
      decision_id,
      timestamp,
      idempotency_key,
      email_summary,
      persona_set_id: personaSet?.persona_set_id || input.persona_set_id || null,
      votes,
      aggregation: {
        method: aggregation.method,
        weighted_yes: aggregation.weighted_yes,
        weighted_no: aggregation.weighted_no,
        weighted_rewrite: aggregation.weighted_rewrite,
        hard_block: aggregation.hard_block,
        rationale: aggregation.rationale
      },
      final_decision: aggregation.final_decision,
      rewrite_patch,
      policy_snapshot: policy
    };

    const rep = externalMode
      ? { personas: [], updates: [] }
      : updateReputations(personaSet.personas, votes, aggregation.final_decision);
    const updatedPersonaSet = externalMode
      ? null
      : {
          ...personaSet,
          persona_set_id: crypto.randomUUID(),
          updated_at: timestamp,
          lineage: { parent_persona_set_id: personaSet.persona_set_id },
          personas: rep.personas
        };

    const response = {
      board_id,
      decision_id,
      timestamp,
      email_summary: {
        to_count: email_summary.to_count,
        subject: email_summary.subject,
        risk_level: email_summary.risk_level
      },
      persona_set_id: personaSet?.persona_set_id || input.persona_set_id || null,
      votes,
      aggregation: {
        method: aggregation.method,
        weighted_yes: aggregation.weighted_yes,
        weighted_no: aggregation.weighted_no,
        weighted_rewrite: aggregation.weighted_rewrite,
        hard_block: aggregation.hard_block,
        rationale: aggregation.rationale
      },
      final_decision: aggregation.final_decision,
      rewrite_patch,
      persona_updates: rep.updates,
      board_writes: []
    };

    const decisionWrite = await writeDecision(board_id, { ...decisionPayload, response }, statePath);

    const personaWrite = updatedPersonaSet
      ? await writeArtifact(board_id, 'persona_set', updatedPersonaSet, statePath)
      : null;

    response.board_writes = [
      { type: 'decision', success: true, ref: decisionWrite.ref },
      ...(personaWrite ? [{ type: 'persona_set', success: true, ref: personaWrite.ref }] : [])
    ];

    return response;
  } catch (e) {
    return err(board_id || '', 'SEND_EMAIL_GUARD_FAILED', e.message || 'unknown error', { statePath });
  }
}

export async function invoke(input, opts = {}) {
  return handler(input, opts);
}
