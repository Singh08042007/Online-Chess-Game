import { CalibrationBounds } from './types';

export const DEFAULT_CALIBRATION: CalibrationBounds = {
  minX: 0.12, // 12% margin from left
  maxX: 0.88, // 12% margin from right
  minY: 0.08, // 8% margin from top (upper board fine)
  maxY: 0.65, // 35% generous margin from bottom so hand has plenty of space below
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/**
 * Maps normalized camera coordinates (mirrored X, Y in 0..1) to a chessboard square.
 * @param x Mirrored horizontal coordinate (0 = left of board, 1 = right of board)
 * @param y Vertical coordinate (0 = top of board, 1 = bottom of board)
 * @param bounds Calibration bounding box
 * @param orientation Board orientation ('white' or 'black')
 */
export function mapCoordsToSquare(
  x: number,
  y: number,
  bounds: CalibrationBounds = DEFAULT_CALIBRATION,
  orientation: 'white' | 'black' = 'white'
): {
  square: string;
  fileIndex: number;
  rankIndex: number;
  clampedX: number;
  clampedY: number;
  boardX: number;
  boardY: number;
} | null {
  // Normalize into bounds
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;

  if (spanX <= 0.05 || spanY <= 0.05) return null;

  const normalizedX = (x - bounds.minX) / spanX;
  const normalizedY = (y - bounds.minY) / spanY;

  // Clamped in 0..0.999 to cleanly index 8 columns & rows
  const clampedX = Math.max(0, Math.min(0.999, normalizedX));
  const clampedY = Math.max(0, Math.min(0.999, normalizedY));

  let fileIndex = Math.floor(clampedX * 8);
  let rankIndex = Math.floor(clampedY * 8);

  let boardX = clampedX;
  let boardY = clampedY;

  // If board is flipped for black perspective
  if (orientation === 'black') {
    fileIndex = 7 - fileIndex;
    rankIndex = 7 - rankIndex;
    boardX = 1 - clampedX;
    boardY = 1 - clampedY;
  }

  const file = FILES[fileIndex];
  const rank = RANKS[rankIndex];

  return {
    square: `${file}${rank}`,
    fileIndex,
    rankIndex,
    clampedX,
    clampedY,
    boardX,
    boardY,
  };
}
