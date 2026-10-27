# Contributing to RECON-Q4 (`office-battleship`)

Thank you for helping keep **RECON-Q4** fast, undetectable, and architecturally clean. Every contribution is evaluated against [`AGENTS.md`](./AGENTS.md) and our automated quality gates.

## Quick Path for Contributors

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/iwantdeveverything/office-battleship.git
   cd office-battleship
   npm ci
   ```
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feat/your-work-unit
   ```
3. **Verify Before Committing:**
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

## Architectural & Commit Standards

| Standard | Requirement |
| :--- | :--- |
| **Work-Unit Commits** | Commit by deliverable behavior unit (including its tests and documentation in the same commit), never by file type. Keep each PR slice under ~400 changed lines. |
| **Conventional Commits** | Use `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `test(scope): ...`, or `refactor(scope): ...`. **Never** include `Co-Authored-By` or AI attribution trailers. |
| **Zero-Game Aesthetics** | Never introduce gaming nouns (`ship`, `bomb`, `torpedo`, `enemy`), canvas sprites, or arcade fonts in user-facing UI strings. Use corporate accounting terminology (`Ledger`, `Account`, `Audit`, `Discrepancy`, `Liquidated`). |
| **Bilingual Parity (`en` & `es`)** | All user-facing strings must be added to both `es` and `en` dictionaries in [`src/lib/i18n.ts`](src/lib/i18n.ts). Spreadsheet formulas in [`src/lib/formulaParser.ts`](src/lib/formulaParser.ts) must support both English and Spanish aliases simultaneously. |
| **Fog-of-War Anti-Cheat** | Never expose un-audited opponent coordinates or raw player `uid` secrets from [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts). |
| **Panic Mode (`<16ms`, `CLS = 0`)** | Any UI change must preserve zero Cumulative Layout Shift when toggling `Esc` Panic Mode. |

## Pull Request Checklist

- [ ] `npm run typecheck` passes with `strict: true` and zero `any` casts in domain contracts.
- [ ] `npm test` passes all unit and Fog-of-War sanitization suites.
- [ ] `npm run build` succeeds cleanly.
- [ ] Both `es` and `en` locales are updated in lockstep.
