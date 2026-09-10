import { Chess, Square, PieceSymbol, Color } from 'chess.js';

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Piece value mapping for material calculation
export const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

// Convert Chess.js board into 8x8 matrix string[][] where uppercase = White, lowercase = Black
export const chessJsToMatrix = (chess: Chess): string[][] => {
  const board = chess.board();
  return board.map((row) =>
    row.map((sq) => {
      if (!sq) return '';
      return sq.color === 'w' ? sq.type.toUpperCase() : sq.type.toLowerCase();
    })
  );
};

// Calculate captured pieces for both sides by comparing current board to 16 initial pieces
export const calculateCapturedPieces = (chess: Chess) => {
  const initialCounts = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 },
  };

  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  const board = chess.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.type !== 'k') {
        currentCounts[piece.color][piece.type]++;
      }
    }
  }

  const capturedByWhite: string[] = [];
  const capturedByBlack: string[] = [];

  let whiteScore = 0;
  let blackScore = 0;

  // Pawns, Knights, Bishops, Rooks, Queens
  const pieceOrder: ('q' | 'r' | 'b' | 'n' | 'p')[] = ['q', 'r', 'b', 'n', 'p'];

  pieceOrder.forEach((type) => {
    const blackLost = Math.max(0, initialCounts.b[type] - currentCounts.b[type]);
    for (let i = 0; i < blackLost; i++) {
      capturedByWhite.push(type.toLowerCase());
      whiteScore += PIECE_VALUES[type];
    }

    const whiteLost = Math.max(0, initialCounts.w[type] - currentCounts.w[type]);
    for (let i = 0; i < whiteLost; i++) {
      capturedByBlack.push(type.toUpperCase());
      blackScore += PIECE_VALUES[type];
    }
  });

  return {
    capturedByWhite,
    capturedByBlack,
    whiteMaterialDiff: Math.max(0, whiteScore - blackScore),
    blackMaterialDiff: Math.max(0, blackScore - whiteScore),
  };
};

export const formatClock = (totalSeconds: number): string => {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getTurnColorName = (turn: 'w' | 'b' | 'white' | 'black'): 'White' | 'Black' => {
  if (turn === 'w' || turn === 'white') return 'White';
  return 'Black';
};
