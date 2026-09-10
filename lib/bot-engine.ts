import { Chess, Move } from 'chess.js';

// Piece base values (in centipawns)
const PIECE_VALS: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional bonuses for center control (8x8 from rank 8 to 1)
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

/**
 * Static board evaluation in centipawns from the perspective of botColor
 */
export const evaluateBoard = (chess: Chess, botColor: 'w' | 'b'): number => {
  if (chess.isCheckmate()) {
    // If the side whose turn it is is checkmated, the other side wins
    return chess.turn() === botColor ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALS[piece.type] || 0;
      let posBonus = 0;

      if (piece.type === 'p') {
        posBonus = piece.color === 'w' ? PAWN_PST[r][c] : PAWN_PST[7 - r][c];
      } else if (piece.type === 'n') {
        posBonus = piece.color === 'w' ? KNIGHT_PST[r][c] : KNIGHT_PST[7 - r][c];
      }

      const totalVal = baseVal + posBonus;
      if (piece.color === botColor) {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
};

/**
 * Minimax algorithm with Alpha-Beta pruning for depth-2 or depth-3 search
 */
const minimax = (
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: 'w' | 'b'
): number => {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, botColor);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, botColor);
      chess.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, botColor);
      chess.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

/**
 * Main function to select best bot move
 */
export const getBestBotMove = (
  chess: Chess,
  difficulty: 'beginner' | 'intermediate' | 'grandmaster',
  botColor: 'w' | 'b' = 'b'
): Move | null => {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // 1. CRITICAL: Check if ANY move delivers immediate checkmate (#)
  for (const move of legalMoves) {
    chess.move(move);
    const isMate = chess.isCheckmate();
    chess.undo();
    if (isMate) {
      return move; // ALWAYS deliver checkmate if available!
    }
  }

  // 2. Beginner mode: Random move, but promotes to Queen if promoting
  if (difficulty === 'beginner') {
    // 20% chance to pick best capture, otherwise random
    const captures = legalMoves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.25) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 3. Intermediate mode: 1-ply search + capture priority
  if (difficulty === 'intermediate') {
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    // Shuffle moves to avoid predictable play
    const shuffledMoves = [...legalMoves].sort(() => Math.random() - 0.5);

    for (const move of shuffledMoves) {
      chess.move(move);
      // Check if this move avoids opponent immediate checkmate
      let score = evaluateBoard(chess, botColor);

      // Check if opponent can immediately capture our queen or checkmate us
      const opponentResponses = chess.moves({ verbose: true });
      for (const oppMove of opponentResponses) {
        if (oppMove.san.includes('#')) {
          score -= 50000; // heavily penalize walking into opponent mate
        }
      }

      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // 4. Grandmaster mode: 2-ply Minimax with Alpha-Beta pruning
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  // Order moves: Checkmates -> Captures -> Checks -> Others
  const orderedMoves = [...legalMoves].sort((a, b) => {
    let aVal = a.captured ? PIECE_VALS[a.captured] : 0;
    let bVal = b.captured ? PIECE_VALS[b.captured] : 0;
    if (a.san.includes('#')) aVal += 100000;
    if (b.san.includes('#')) bVal += 100000;
    if (a.san.includes('+')) aVal += 50;
    if (b.san.includes('+')) bVal += 50;
    return bVal - aVal;
  });

  for (const move of orderedMoves) {
    chess.move(move);
    // Depth 2 search
    const moveScore = minimax(chess, 2, -Infinity, Infinity, false, botColor);
    chess.undo();

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMove = move;
    }
  }

  return bestMove;
};
