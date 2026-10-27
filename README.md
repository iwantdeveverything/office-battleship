# RECON-Q4 — Cloud Spreadsheet Reconciliation Tool

Bilingual (`es` / `en`) real-time tactical Battleship disguised 100% as an enterprise corporate spreadsheet (Google Sheets, Microsoft Excel 365, and JetBrains DataGrip SQL Dark Mode), complete with server-side Fog-of-War anti-cheat (`/api/audit`), `<16ms` zero-layout-shift (`CLS = 0`) Panic Mode, and formula-bar execution.

## Quick Path

1. **Install & Run Dev Server:**
   ```bash
   npm install
   npm run dev
   ```
2. **Run Unit & Anti-Cheat Tests:**
   ```bash
   npm test
   ```
3. **Production Build Verification:**
   ```bash
   npm run build
   ```

## Core Architecture & Features

| Domain | Implementation |
| :--- | :--- |
| **Bilingual Disguise (`es` / `en`)** | Toggle in [`SpreadsheetHeader.tsx`](src/components/layout/SpreadsheetHeader.tsx) switches all spreadsheet chrome, financial account names (`Fideicomiso Offshore` / `Offshore Trust`), status logs, and panic mode copy via [`src/lib/i18n.ts`](src/lib/i18n.ts). |
| **Dual-Language Formula Bar (`fx`)** | [`src/lib/formulaParser.ts`](src/lib/formulaParser.ts) accepts both English (`=AUDIT(E5)`, `=SCAN_3X3(C4)`, `=BARRAGE_ROW(3)`) and Spanish (`=AUDITAR(E5)`, `=ESCANEAR_3X3(C4)`, `=BARRIDO_FILA(3)`) formulas regardless of active UI locale. |
| **Panic Mode (`<16ms`, `CLS = 0`)** | Pressing `Esc` in [`src/hooks/useStealthMode.ts`](src/hooks/useStealthMode.ts) mutates the DOM in place without page navigation. Every cell renders deterministic currency strings (`getDeterministicCurrency` in [`src/lib/constants.ts`](src/lib/constants.ts)). |
| **Server-Side Fog-of-War (`/api/audit`)** | [`src/app/api/audit/route.ts`](src/app/api/audit/route.ts) validates collinear/contiguous fleet placement, masks opponent `uid` tokens (`REDACTED_P1` / `REDACTED_P2`), and strips un-audited opponent `shipId`/`shipCode` before returning `radarGrid`. |
| **Viral Disguised Multiplayer URL** | [`src/app/spreadsheets/d/[roomId]/edit/page.tsx`](src/app/spreadsheets/d/[roomId]/edit/page.tsx) auto-joins or creates rooms using realistic URLs (`/spreadsheets/d/Q4-8492-RECON/edit?usp=sharing`). |
| **Single-Player Hunt & Target AI** | [`src/hooks/useAIController.ts`](src/hooks/useAIController.ts) uses checkerboard parity `(row + col) % 2 === 0` in Hunt mode and axis-aligned orthogonal queues in Target mode. |

## Verification Checklist

- [x] `Esc` toggles Panic Mode in `<16ms` with deterministic currency values and `CLS = 0`.
- [x] `R` rotates account placement orientation (`H` / `V`) during setup.
- [x] `Enter` in the `fx` formula bar executes `=AUDIT` / `=AUDITAR`, `=SCAN_3X3` / `=ESCANEAR_3X3`, and `=BARRAGE_ROW` / `=BARRIDO_FILA`.
- [x] `/api/audit` enforces strict Fog-of-War and `K = 32` ELO rating updates.
