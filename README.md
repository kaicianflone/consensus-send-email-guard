# consensus-send-email-guard

Pre-send governance for outbound email automation.

`consensus-send-email-guard` evaluates a draft email before delivery and returns:

- `APPROVE`
- `BLOCK`
- `REWRITE`

with structured reasoning and board-native artifacts.

## Why this matters

Email is high-impact and hard to undo. This guard helps teams prevent accidental policy violations, risky claims, and low-quality messaging in automated outbound flows.

## Core capabilities

- strict input schema validation
- persona-weighted voting with deterministic aggregation
- rewrite guidance for fixable drafts
- idempotent retries (same draft/context = same decision)
- board-native decision + persona update writes

## Output shape (high level)

- decision metadata (`decision_id`, `timestamp`)
- vote details + aggregation rationale
- `final_decision`
- optional `rewrite_patch`
- `board_writes[]`

## Quick start

```bash
npm i
node --import tsx run.js --input ./examples/email-input.json
```

## Test

```bash
npm test
```

## Continuous improvement

See `AI-SELF-IMPROVEMENT.md` for ongoing policy and workflow refinement.
