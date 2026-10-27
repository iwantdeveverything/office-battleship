import type { Locale } from '@/types/game';

export interface I18nDictionary {
  appName: string;
  fileMenu: string[];
  turnBadgeYourTurn: string;
  turnBadgeOpponentTurn: string;
  turnBadgeSetup: string;
  turnBadgeWaiting: string;
  turnBadgeFinished: string;
  panicButtonLabel: string;
  panicActiveBanner: string;
  panicStatusBarVerified: string;
  panicFilterVerified: string;
  panicFilterCurrency: string;
  panicFilterAuditTrail: string;
  multiplayerLobbyBtn: string;
  leaderboardBtn: string;
  notesDrawerBtn: string;
  modeSinglePlayer: string;
  modeMultiplayer: string;
  rotateAxisBtn: string;
  autoAllocateBtn: string;
  clearLedgerBtn: string;
  confirmAllocationBtn: string;
  newExerciseBtn: string;
  formulaPlaceholder: string;
  formulaExecuteBtn: string;
  macroScanBtn: string;
  macroBarrageBtn: string;
  kpiDiscrepanciesFound: string;
  kpiAccountsLiquidated: string;
  kpiAuditAccuracy: string;
  leftGridTitle: string;
  leftGridSubtitle: string;
  rightGridTitle: string;
  rightGridSubtitle: string;
  fleetSummaryTitle: string;
  statusIntact: string;
  statusDamaged: string;
  statusLiquidated: string;
  cellPending: string;
  cellVerifiedZero: string;
  cellRefImpact: string;
  cellLiquidatedPrefix: string;
  cellScanPrefix: string;
  footerTabReconciliation: string;
  footerTabConsolidated: string;
  footerTabVariance: string;
  footerSumLabel: string;
  footerAvgLabel: string;
  footerCountLabel: string;
  chatHeaderTitle: string;
  chatHeaderSubtitle: string;
  chatInputPlaceholder: string;
  chatSendBtn: string;
  chatEmptyState: string;
  lobbyTitle: string;
  lobbySubtitle: string;
  lobbyAliasLabel: string;
  lobbyCreateRoomBtn: string;
  lobbyQuickMatchBtn: string;
  lobbyShareUrlLabel: string;
  lobbyCopyBtn: string;
  lobbyCopiedBtn: string;
  lobbyOpenRoomsTitle: string;
  lobbyNoOpenRooms: string;
  lobbyJoinBtn: string;
  lobbyCloseBtn: string;
  leaderboardTitle: string;
  leaderboardSubtitle: string;
  leaderboardColAuditor: string;
  leaderboardColDept: string;
  leaderboardColElo: string;
  leaderboardColRecord: string;
  leaderboardRefreshTitle: string;
  leaderboardFooterStandard: string;
  leaderboardWinsShort: string;
  leaderboardLossesShort: string;
  formulaErrorUnknown: string;
  formulaErrorCoord: string;
  formulaErrorRow: string;
  logSetupReady: string;
  logPlacedAccount: (code: string, coord: string) => string;
  logAuditMiss: (actor: string, coord: string) => string;
  logAuditHit: (actor: string, coord: string) => string;
  logAuditSunk: (actor: string, code: string) => string;
  logScanResult: (coord: string, count: number) => string;
  logBarrageResult: (rowNum: number, hits: number) => string;
  logMatchWon: (winner: string, eloDelta: number) => string;
}

export const DICTIONARY: Record<Locale, I18nDictionary> = {
  es: {
    appName: 'Conciliación Bancaria Q4 — Sistema de Control Interno',
    fileMenu: ['Archivo', 'Editar', 'Ver', 'Insertar', 'Formato', 'Datos', 'Auditoría', 'Ayuda'],
    turnBadgeYourTurn: 'TURNO DE AUDITORÍA ACTIVO',
    turnBadgeOpponentTurn: 'ESPERANDO CONTRAPARTE...',
    turnBadgeSetup: 'ASIGNACIÓN DE PARTIDAS (5 CUENTAS)',
    turnBadgeWaiting: 'SALA ABIERTA — ESPERANDO AUDITOR',
    turnBadgeFinished: 'EJERCICIO FISCAL CERRADO',
    panicButtonLabel: 'Vista Ejecutiva (Esc)',
    panicActiveBanner: 'MODO LECTURA: BALANCE CONSOLIDADO',
    panicStatusBarVerified: 'Conciliación bancaria trimestral verificada sin diferencias.',
    panicFilterVerified: 'Filtro: Q4_Verificado',
    panicFilterCurrency: 'Divisa: USD ($)',
    panicFilterAuditTrail: 'Pista de Auditoría: Bloqueada',
    multiplayerLobbyBtn: 'Compartir / Multijugador',
    leaderboardBtn: 'Ranking de Auditores (ELO)',
    notesDrawerBtn: 'Notas de Celda',
    modeSinglePlayer: 'Simulación IA',
    modeMultiplayer: 'Contraparte en Vivo',
    rotateAxisBtn: 'Rotar Eje (R)',
    autoAllocateBtn: 'Asignación Automática',
    clearLedgerBtn: 'Limpiar Anexo',
    confirmAllocationBtn: 'Iniciar Conciliación',
    newExerciseBtn: 'Nuevo Ejercicio Q4',
    formulaPlaceholder: '=AUDITAR(E5), =ESCANEAR_3X3(C4) o =BARRIDO_FILA(3)',
    formulaExecuteBtn: 'Ejecutar',
    macroScanBtn: '=ESCANEAR_3X3',
    macroBarrageBtn: '=BARRIDO_FILA',
    kpiDiscrepanciesFound: 'Impactos Detectados',
    kpiAccountsLiquidated: 'Partidas Liquidadas',
    kpiAuditAccuracy: 'Precisión de Muestreo',
    leftGridTitle: 'Anexo A: Libro Mayor Interno',
    leftGridSubtitle: 'Cuentas Reservadas Propia Cartera (A1:J10)',
    rightGridTitle: 'Anexo B: Balance de Contraparte',
    rightGridSubtitle: 'Muestreo de Discrepancias Externas (Clic o Fórmula fx)',
    fleetSummaryTitle: 'Desglose de Partidas Extraordinarias (Cuentas Reservadas)',
    statusIntact: 'CONCILIADO',
    statusDamaged: 'OBSERVADO',
    statusLiquidated: 'LIQUIDADO',
    cellPending: 'PEND',
    cellVerifiedZero: '$0.00 [OK]',
    cellRefImpact: '#REF! -IMP',
    cellLiquidatedPrefix: '#LIQ!',
    cellScanPrefix: 'SCAN:',
    footerTabReconciliation: 'Conciliacion_Q4',
    footerTabConsolidated: 'Mayor_Consolidado',
    footerTabVariance: 'Anexo_Variaciones',
    footerSumLabel: 'SUMA: $252,400.00',
    footerAvgLabel: 'PROMEDIO: $2,524.00',
    footerCountLabel: 'RECUENTO: 100 celdas',
    chatHeaderTitle: 'Comentarios de Auditoría',
    chatHeaderSubtitle: 'Hilo de revisión sobre celdas observadas',
    chatInputPlaceholder: 'Añadir nota técnica para la contraparte...',
    chatSendBtn: 'Publicar',
    chatEmptyState: 'Sin observaciones registradas en este libro.',
    lobbyTitle: 'Compartir Hoja de Conciliación (Multijugador 1v1)',
    lobbySubtitle: 'Envía el enlace corporativo por Slack o Teams para auditar en tiempo real.',
    lobbyAliasLabel: 'Credencial de Auditor (Alias):',
    lobbyCreateRoomBtn: 'Generar Nuevo Expediente',
    lobbyQuickMatchBtn: 'Emparejamiento Rápido',
    lobbyShareUrlLabel: 'Enlace de documento compartido (Camuflado):',
    lobbyCopyBtn: 'Copiar Enlace',
    lobbyCopiedBtn: 'Copiado',
    lobbyOpenRoomsTitle: 'Expedientes Abiertos en Espera de Contraparte',
    lobbyNoOpenRooms: 'No hay expedientes en espera. Genera uno nuevo para compartir.',
    lobbyJoinBtn: 'Auditar',
    lobbyCloseBtn: 'Cerrar',
    leaderboardTitle: 'Escalafón Global de Auditores Senior (ELO K=32)',
    leaderboardSubtitle: 'Clasificación trimestral según eficiencia en detección de partidas.',
    leaderboardColAuditor: 'Auditor',
    leaderboardColDept: 'Unidad',
    leaderboardColElo: 'Índice ELO',
    leaderboardColRecord: 'Expedientes (V-D)',
    leaderboardRefreshTitle: 'Actualizar Escalafón',
    leaderboardFooterStandard: 'Estándar Corporativo / FIDE ELO (K = 32)',
    leaderboardWinsShort: 'V',
    leaderboardLossesShort: 'D',
    formulaErrorUnknown: '#¿NOMBRE? — Use =AUDITAR(E5), =ESCANEAR_3X3(C4) o =BARRIDO_FILA(1..10)',
    formulaErrorCoord: '#¡REF! — Coordenada fuera de rango (A1 a J10)',
    formulaErrorRow: '#¡VALOR! — El número de fila debe estar entre 1 y 10',
    logSetupReady: 'Asigne las 5 partidas extraordinarias en el Anexo A o use Asignación Automática.',
    logPlacedAccount: (code, coord) => `Partida ${code} registrada desde la celda ${coord}.`,
    logAuditMiss: (actor, coord) => `[${actor}] Celda ${coord} verificada sin saldo ($0.00 [OK]).`,
    logAuditHit: (actor, coord) => `[${actor}] ¡Discrepancia detectada en ${coord} (#REF! -IMP)!`,
    logAuditSunk: (actor, code) => `[${actor}] Partida ${code} completamente liquidada (#LIQ!).`,
    logScanResult: (coord, count) => `Auditoría forense 3x3 en ${coord}: ${count}/9 celdas con saldo activo.`,
    logBarrageResult: (rowNum, hits) => `Barrido fiscal en fila ${rowNum}: ${hits} discrepancia(s) en 3 muestras.`,
    logMatchWon: (winner, delta) =>
      `Cierre de ejercicio: ${winner} completó la conciliación (${delta >= 0 ? `+${delta}` : delta} ELO).`,
  },
  en: {
    appName: 'Q4 Bank Reconciliation — Internal Control System',
    fileMenu: ['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Audit', 'Help'],
    turnBadgeYourTurn: 'ACTIVE AUDIT TURN',
    turnBadgeOpponentTurn: 'AWAITING COUNTERPARTY...',
    turnBadgeSetup: 'ACCOUNT ALLOCATION (5 ACCOUNTS)',
    turnBadgeWaiting: 'ROOM OPEN — AWAITING AUDITOR',
    turnBadgeFinished: 'FISCAL EXERCISE CLOSED',
    panicButtonLabel: 'Executive View (Esc)',
    panicActiveBanner: 'READ-ONLY MODE: CONSOLIDATED LEDGER',
    panicStatusBarVerified: 'Quarterly bank reconciliation verified with zero discrepancies.',
    panicFilterVerified: 'Filter: Q4_Verified',
    panicFilterCurrency: 'Currency: USD ($)',
    panicFilterAuditTrail: 'Audit Trail: Locked',
    multiplayerLobbyBtn: 'Share / Multiplayer',
    leaderboardBtn: 'Auditor Ranking (ELO)',
    notesDrawerBtn: 'Cell Notes',
    modeSinglePlayer: 'AI Simulation',
    modeMultiplayer: 'Live Counterparty',
    rotateAxisBtn: 'Rotate Axis (R)',
    autoAllocateBtn: 'Auto-Allocate',
    clearLedgerBtn: 'Clear Annex',
    confirmAllocationBtn: 'Start Reconciliation',
    newExerciseBtn: 'New Q4 Exercise',
    formulaPlaceholder: '=AUDIT(E5), =SCAN_3X3(C4) or =BARRAGE_ROW(3)',
    formulaExecuteBtn: 'Execute',
    macroScanBtn: '=SCAN_3X3',
    macroBarrageBtn: '=BARRAGE_ROW',
    kpiDiscrepanciesFound: 'Impacts Detected',
    kpiAccountsLiquidated: 'Accounts Liquidated',
    kpiAuditAccuracy: 'Sampling Accuracy',
    leftGridTitle: 'Annex A: Internal General Ledger',
    leftGridSubtitle: 'Allocated Reserved Accounts (A1:J10)',
    rightGridTitle: 'Annex B: Counterparty Balance Sheet',
    rightGridSubtitle: 'External Discrepancy Sampling (Click or fx Formula)',
    fleetSummaryTitle: 'Extraordinary Items Breakdown (Reserved Financial Accounts)',
    statusIntact: 'RECONCILED',
    statusDamaged: 'FLAGGED',
    statusLiquidated: 'LIQUIDATED',
    cellPending: 'PEND',
    cellVerifiedZero: '$0.00 [OK]',
    cellRefImpact: '#REF! -IMP',
    cellLiquidatedPrefix: '#LIQ!',
    cellScanPrefix: 'SCAN:',
    footerTabReconciliation: 'Reconciliation_Q4',
    footerTabConsolidated: 'Consolidated_Ledger',
    footerTabVariance: 'Variance_Schedule',
    footerSumLabel: 'SUM: $252,400.00',
    footerAvgLabel: 'AVERAGE: $2,524.00',
    footerCountLabel: 'COUNT: 100 cells',
    chatHeaderTitle: 'Audit Cell Notes',
    chatHeaderSubtitle: 'Review thread for flagged ledger entries',
    chatInputPlaceholder: 'Add technical note for counterparty...',
    chatSendBtn: 'Post Note',
    chatEmptyState: 'No audit notes recorded in this workbook.',
    lobbyTitle: 'Share Reconciliation Workbook (1v1 Multiplayer)',
    lobbySubtitle: 'Drop the disguised corporate link in Slack or Teams to audit in real time.',
    lobbyAliasLabel: 'Auditor Credential (Alias):',
    lobbyCreateRoomBtn: 'Generate New Workbook',
    lobbyQuickMatchBtn: 'Quick Matchmaking',
    lobbyShareUrlLabel: 'Shared corporate document URL (Disguised):',
    lobbyCopyBtn: 'Copy Link',
    lobbyCopiedBtn: 'Copied',
    lobbyOpenRoomsTitle: 'Open Workbooks Awaiting Counterparty',
    lobbyNoOpenRooms: 'No open workbooks waiting. Generate a new one to share.',
    lobbyJoinBtn: 'Audit',
    lobbyCloseBtn: 'Close',
    leaderboardTitle: 'Global Senior Auditor Leaderboard (ELO K=32)',
    leaderboardSubtitle: 'Quarterly ranking by extraordinary account detection efficiency.',
    leaderboardColAuditor: 'Auditor',
    leaderboardColDept: 'Department',
    leaderboardColElo: 'ELO Rating',
    leaderboardColRecord: 'Workbooks (W-L)',
    leaderboardRefreshTitle: 'Refresh Leaderboard',
    leaderboardFooterStandard: 'FIDE / Corporate Standard ELO (K = 32)',
    leaderboardWinsShort: 'W',
    leaderboardLossesShort: 'L',
    formulaErrorUnknown: '#NAME? — Use =AUDIT(E5), =SCAN_3X3(C4) or =BARRAGE_ROW(1..10)',
    formulaErrorCoord: '#REF! — Coordinate out of range (A1 to J10)',
    formulaErrorRow: '#VALUE! — Row number must be between 1 and 10',
    logSetupReady: 'Allocate all 5 reserved accounts in Annex A or click Auto-Allocate.',
    logPlacedAccount: (code, coord) => `Account ${code} allocated starting at cell ${coord}.`,
    logAuditMiss: (actor, coord) => `[${actor}] Cell ${coord} verified with zero variance ($0.00 [OK]).`,
    logAuditHit: (actor, coord) => `[${actor}] Discrepancy detected at ${coord} (#REF! -IMP)!`,
    logAuditSunk: (actor, code) => `[${actor}] Account ${code} fully liquidated (#LIQ!).`,
    logScanResult: (coord, count) => `Forensic 3x3 scan at ${coord}: ${count}/9 cells carry active balance.`,
    logBarrageResult: (rowNum, hits) => `Fiscal sweep on row ${rowNum}: ${hits} discrepancy(ies) across 3 samples.`,
    logMatchWon: (winner, delta) =>
      `Fiscal close: ${winner} completed reconciliation (${delta >= 0 ? `+${delta}` : delta} ELO).`,
  },
};
