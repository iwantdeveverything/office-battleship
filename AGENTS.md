# RECON-Q4 — Gentleman Guardian Angel Review Rules

Outcome: Enforce strict corporate stealth disguise, server-side Fog-of-War anti-cheat, bilingual (`en`/`es`) parity, and zero layout shift (`CLS = 0`).

## Critical Rules

| Domain | Rule |
|--------|------|
| **Zero-Game Aesthetics** | Never use gaming fonts, canvas sprites, explosions, sound effects, or gaming terminology (`ship`, `bomb`, `torpedo`, `enemy`) in user-facing UI strings. Use corporate accounting terminology only (`Ledger`, `Account`, `Audit`, `Discrepancy`, `Liquidated`). |
| **Fog of War (Anti-Cheat)** | In multiplayer mode (`/api/audit`), never return un-audited opponent ship coordinates in plain text to the client before the match is `FINISHED` or that cell is shot. |
| **Panic Mode (`<16ms`, `CLS = 0`)** | Pressing `Escape` must mutate DOM state in place without page navigation or layout shift. Deterministic currency strings must be used so re-renders never jitter. |
| **Bilingual Parity (`en` & `es`)** | All user-facing UI copy must resolve through the `Locale` (`en` / `es`) dictionary, and `formulaParser.ts` must accept both English (`=AUDIT`, `=SCAN_3X3`, `=BARRAGE_ROW`) and Spanish (`=AUDITAR`, `=ESCANEAR_3X3`, `=BARRIDO_FILA`) aliases regardless of active UI locale. |
| **Type Safety** | Strict TypeScript (`strict: true`), no `any` casts in domain contracts (`src/types/game.ts`). |
