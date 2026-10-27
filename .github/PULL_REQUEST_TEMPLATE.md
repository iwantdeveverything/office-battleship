## Outcome

<!-- One concise paragraph: what changed, who it helps, and why it matters. -->

## Review Path

- **Review first:** <!-- Entry point file or domain contract -->
- **Intentionally out of scope:** <!-- What this PR deliberately does NOT touch -->
- **Related PR / Issue:** <!-- Link to issue or chained PR if applicable -->

## Changes by Work Unit

| Area | Decision / Change |
| :--- | :--- |
| Domain / Engine | |
| UI / Disguise | |
| Tests / Docs | |

## Verification Checklist (`AGENTS.md`)

- [ ] **Zero-Game Aesthetics:** Only corporate accounting terminology used (`Ledger`, `Account`, `Audit`, `Discrepancy`, `Liquidated`).
- [ ] **Fog of War (Anti-Cheat):** `/api/audit` never leaks un-audited opponent coordinates or raw player `uid` tokens.
- [ ] **Panic Mode (`<16ms`, `CLS = 0`):** `Esc` mutates DOM in-place with deterministic currency values and zero layout shift.
- [ ] **Bilingual Parity (`en` & `es`):** Both `en` and `es` dictionary entries and formula aliases are updated in lockstep.
- [ ] **Quality Gates Passed:** `npm run typecheck`, `npm test`, and `npm run build` succeed cleanly.
