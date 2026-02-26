const TOP_LEVEL = new Set(['board_id', 'email_draft', 'sender_profile', 'constraints', 'persona_set_id']);
const EMAIL_KEYS = new Set(['to', 'subject', 'body', 'attachments']);
const SENDER_KEYS = new Set(['role', 'relationship', 'risk_tolerance']);
const CONSTRAINT_KEYS = new Set(['tone', 'no_legal_claims', 'no_pricing_promises', 'no_sensitive_data']);

export function validateInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'input must be object';
  for (const k of Object.keys(input)) if (!TOP_LEVEL.has(k)) return `unknown field: ${k}`;
  if (typeof input.board_id !== 'string' || !input.board_id.trim()) return 'board_id is required';

  const e = input.email_draft;
  if (!e || typeof e !== 'object' || Array.isArray(e)) return 'email_draft is required';
  for (const k of Object.keys(e)) if (!EMAIL_KEYS.has(k)) return `unknown email_draft field: ${k}`;
  if (!Array.isArray(e.to) || e.to.some((x) => typeof x !== 'string')) return 'email_draft.to must be string[]';
  if (typeof e.subject !== 'string') return 'email_draft.subject is required';
  if (typeof e.body !== 'string') return 'email_draft.body is required';
  if (e.attachments !== undefined && (!Array.isArray(e.attachments) || e.attachments.some((x) => typeof x !== 'string'))) return 'email_draft.attachments must be string[]';

  if (input.sender_profile !== undefined) {
    if (!input.sender_profile || typeof input.sender_profile !== 'object' || Array.isArray(input.sender_profile)) return 'sender_profile must be object';
    for (const k of Object.keys(input.sender_profile)) if (!SENDER_KEYS.has(k)) return `unknown sender_profile field: ${k}`;
    if (input.sender_profile.risk_tolerance !== undefined && !['low', 'medium', 'high'].includes(input.sender_profile.risk_tolerance)) return 'sender_profile.risk_tolerance must be low|medium|high';
  }

  if (input.constraints !== undefined) {
    if (!input.constraints || typeof input.constraints !== 'object' || Array.isArray(input.constraints)) return 'constraints must be object';
    for (const k of Object.keys(input.constraints)) if (!CONSTRAINT_KEYS.has(k)) return `unknown constraints field: ${k}`;
  }

  if (input.persona_set_id !== undefined && typeof input.persona_set_id !== 'string') return 'persona_set_id must be string';
  return null;
}
