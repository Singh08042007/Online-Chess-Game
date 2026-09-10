/**
 * Standard FIDE ELO Rating calculation system
 */

export interface EloResult {
  whiteRatingChange: number;
  blackRatingChange: number;
  newWhiteRating: number;
  newBlackRating: number;
}

export const calculateEloChange = (
  whiteRating: number,
  blackRating: number,
  result: '1-0' | '0-1' | '1/2-1/2',
  kFactor: number = 32
): EloResult => {
  // Expected scores
  const expectedWhite = 1.0 / (1.0 + Math.pow(10, (blackRating - whiteRating) / 400.0));
  const expectedBlack = 1.0 / (1.0 + Math.pow(10, (whiteRating - blackRating) / 400.0));

  let actualWhite: number;
  let actualBlack: number;

  if (result === '1-0') {
    actualWhite = 1.0;
    actualBlack = 0.0;
  } else if (result === '0-1') {
    actualWhite = 0.0;
    actualBlack = 1.0;
  } else {
    actualWhite = 0.5;
    actualBlack = 0.5;
  }

  const whiteRatingChange = Math.round(kFactor * (actualWhite - expectedWhite));
  const blackRatingChange = Math.round(kFactor * (actualBlack - expectedBlack));

  return {
    whiteRatingChange,
    blackRatingChange,
    newWhiteRating: Math.max(100, whiteRating + whiteRatingChange),
    newBlackRating: Math.max(100, blackRating + blackRatingChange),
  };
};
