export const ELO_K_FACTOR = 32;

/**
 * Calculates expected score E = 1 / (1 + 10^((R_opp - R_player) / 400))
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Calculates updated ELO rating: R_new = R_old + 32 * (S - E)
 * @param playerRating Current ELO rating of the player
 * @param opponentRating Current ELO rating of the opponent
 * @param actualScore 1 for win, 0.5 for draw, 0 for loss
 */
export function calculateNewElo(
  playerRating: number,
  opponentRating: number,
  actualScore: 0 | 0.5 | 1
): { newRating: number; delta: number } {
  const expected = calculateExpectedScore(playerRating, opponentRating);
  const delta = Math.round(ELO_K_FACTOR * (actualScore - expected));
  return {
    newRating: playerRating + delta,
    delta,
  };
}
