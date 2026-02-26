# consensus-send-email-guard

Evaluate an email draft through persona voting, produce APPROVE/BLOCK/REWRITE, write decision + updated persona_set artifacts to a consensus-tools local JSON board.

## 60-second quickstart

```bash
cd repos/send-email-guard
npm i
node --import tsx run.js --input ./examples/email-input.json
```

Output JSON is written to `./out` and summary is printed.

## Input contract

See `examples/email-input.json`.

## Output contract

Strict JSON object:
- `board_id`
- `decision_id`
- `timestamp`
- `email_summary`
- `persona_set_id`
- `votes[]`
- `aggregation`
- `final_decision`
- `rewrite_patch`
- `persona_updates[]`
- `board_writes[]`

Error output:
- `board_id`
- `error { code, message, details }`

## Notes

- Uses board-native job/submission persistence (`artifact:decision`, `artifact:persona_set`).
- Reputation updates follow deterministic clamp rules.
- Strict input schema validation is enforced (unknown fields are rejected).
- Idempotency key is computed from board+draft+constraints+persona_set+policy; retries return the prior decision result.
- Artifact indexing helpers are included (in-memory index built from board state, then O(1) lookups for latest/by-id/idempotency access).
