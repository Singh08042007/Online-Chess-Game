import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../lib/firebase';

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

interface GameState {
  board: string[][];
  currentPlayer: 'white' | 'black';
  whiteTime: number;
  blackTime: number;
  moves: string[];
  status: 'waiting' | 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  players: {
    white: { id: string; name: string } | null;
    black: { id: string; name: string } | null;
  };
  winner: 'white' | 'black' | null;
  castlingRights: {
    white: { kingSide: boolean; queenSide: boolean };
    black: { kingSide: boolean; queenSide: boolean };
  };
  enPassantTarget: string | null;
  halfMoveClock: number;
  fullMoveNumber: number;
  isCheck: boolean;
  promotionPending: boolean;
  promotionSquare: string | null;
}

const initialGameState: GameState = {
  board: initialBoard,
  currentPlayer: 'white',
  whiteTime: 600,
  blackTime: 600,
  moves: [],
  status: 'waiting',
  players: {
    white: null,
    black: null
  },
  winner: null,
  castlingRights: {
    white: { kingSide: true, queenSide: true },
    black: { kingSide: true, queenSide: true }
  },
  enPassantTarget: null,
  halfMoveClock: 0,
  fullMoveNumber: 1,
  isCheck: false,
  promotionPending: false,
  promotionSquare: null,
};

export const useChessGame = (gameId: string, playerId: string, playerName: string) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [messages, setMessages] = useState<{ playerId: string; playerName: string; text: string }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribeGame = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState((prevState) => ({
          ...initialGameState,
          ...data,
          players: data.players || initialGameState.players,
          whiteTime: data.whiteTime ?? prevState.whiteTime,
          blackTime: data.blackTime ?? prevState.blackTime,
        }));
      }
    });

    const messagesRef = ref(database, `messages/${gameId}`);
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });

    return () => {
      unsubscribeGame();
      unsubscribeMessages();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameId]);

  useEffect(() => {
    if (gameState.status === 'active' && gameState.players.white && gameState.players.black) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setGameState((prevState) => {
          const newState = { ...prevState };
          if (prevState.currentPlayer === 'white') {
            newState.whiteTime = Math.max(0, prevState.whiteTime - 1);
          } else {
            newState.blackTime = Math.max(0, prevState.blackTime - 1);
          }
          return newState;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.status, gameState.players.white, gameState.players.black, gameState.currentPlayer]);

  const createGame = useCallback((playerName: string) => {
    const gameRef = ref(database, `games/${gameId}`);
    set(gameRef, {
      ...initialGameState,
      players: {
        white: { id: playerId, name: playerName },
        black: null
      },
      status: 'waiting'
    });
  }, [gameId, playerId]);

  const joinGame = useCallback((playerName: string) => {
    const gameRef = ref(database, `games/${gameId}`);
    
    if (!gameState.players.white) {
      set(gameRef, {
        ...gameState,
        players: {
          ...gameState.players,
          white: { id: playerId, name: playerName }
        },
        status: 'waiting'
      });
    } else if (!gameState.players.black && gameState.players.white.id !== playerId) {
      set(gameRef, {
        ...gameState,
        players: {
          ...gameState.players,
          black: { id: playerId, name: playerName }
        },
        status: 'active'
      });
    }
  }, [gameId, gameState, playerId]);

  const isKingInCheck = (board: string[][], player: 'white' | 'black'): boolean => {
    const kingPiece = player === 'white' ? 'K' : 'k';
    let kingPosition: [number, number] | null = null;

    // Find the king's position
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === kingPiece) {
          kingPosition = [i, j];
          break;
        }
      }
      if (kingPosition) break;
    }

    if (!kingPosition) return false; // King not found (shouldn't happen in a valid game)

    // Check if any opponent's piece can attack the king
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && ((player === 'white' && piece === piece.toLowerCase()) ||
                      (player === 'black' && piece === piece.toUpperCase()))) {
          if (isValidMove(board, `${String.fromCharCode(97 + j)}${8 - i}`, 
                          `${String.fromCharCode(97 + kingPosition[1])}${8 - kingPosition[0]}`, player === 'white' ? 'black' : 'white')) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const isCheckmate = (board: string[][], player: 'white' | 'black'): boolean => {
    if (!isKingInCheck(board, player)) return false;

    // Check if any move can get the king out of check
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && ((player === 'white' && piece === piece.toUpperCase()) ||
                      (player === 'black' && piece === piece.toLowerCase()))) {
          for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
              if (isValidMove(board, `${String.fromCharCode(97 + j)}${8 - i}`, 
                               `${String.fromCharCode(97 + y)}${8 - x}`, player)) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[x][y] = newBoard[i][j];
                newBoard[i][j] = '';
                if (!isKingInCheck(newBoard, player)) {
                  return false;
                }
              }
            }
          }
        }
      }
    }

    return true;
  };

  const isStalemate = (board: string[][], player: 'white' | 'black'): boolean => {
    if (isKingInCheck(board, player)) return false;

    // Check if any legal move is available
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && ((player === 'white' && piece === piece.toUpperCase()) ||
                      (player === 'black' && piece === piece.toLowerCase()))) {
          for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
              if (isValidMove(board, `${String.fromCharCode(97 + j)}${8 - i}`, 
                               `${String.fromCharCode(97 + y)}${8 - x}`, player)) {
                const newBoard = JSON.parse(JSON.stringify(board));
                newBoard[x][y] = newBoard[i][j];
                newBoard[i][j] = '';
                if (!isKingInCheck(newBoard, player)) {
                  return false;
                }
              }
            }
          }
        }
      }
    }

    return true;
  };

  const isCastlingMove = (from: string, to: string, piece: string): boolean => {
    if (piece.toLowerCase() !== 'k') return false;
    const [fromCol, fromRow] = from.split('');
    const [toCol, toRow] = to.split('');
    return Math.abs(toCol.charCodeAt(0) - fromCol.charCodeAt(0)) === 2 && fromRow === toRow;
  };

  const isEnPassantMove = (from: string, to: string, piece: string): boolean => {
    if (piece.toLowerCase() !== 'p') return false;
    const [fromCol, fromRow] = from.split('');
    const [toCol, toRow] = to.split('');
    return to === gameState.enPassantTarget && Math.abs(toCol.charCodeAt(0) - fromCol.charCodeAt(0)) === 1;
  };

  const isPawnPromotion = (to: string, piece: string): boolean => {
    if (piece.toLowerCase() !== 'p') return false;
    const [, toRow] = to.split('');
    return toRow === '1' || toRow === '8';
  };

  const isValidMove = (board: string[][], from: string, to: string, currentPlayer: 'white' | 'black'): boolean => {
    console.log('Checking move validity:', { from, to, currentPlayer });
    const [fromCol, fromRow] = from.split('');
    const [toCol, toRow] = to.split('');
    const fromIndex = [8 - parseInt(fromRow), fromCol.charCodeAt(0) - 97];
    const toIndex = [8 - parseInt(toRow), toCol.charCodeAt(0) - 97];
    
    // Check if indices are valid
    if (fromIndex[0] < 0 || fromIndex[0] > 7 || fromIndex[1] < 0 || fromIndex[1] > 7 ||
        toIndex[0] < 0 || toIndex[0] > 7 || toIndex[1] < 0 || toIndex[1] > 7) {
      console.log('Invalid move: Out of bounds');
      return false;
    }
    
    const piece = board[fromIndex[0]][fromIndex[1]];
    const toPiece = board[toIndex[0]][toIndex[1]];

    console.log('Piece details:', { piece, toPiece });

    if (!piece) {
      console.log('Invalid move: No piece at start position');
      return false;
    }

    // Check if the piece belongs to the current player
    if ((currentPlayer === 'white' && piece !== piece.toUpperCase()) ||
        (currentPlayer === 'black' && piece !== piece.toLowerCase())) {
      console.log('Invalid move: Wrong player');
      return false;
    }

    // Check if the destination square is occupied by a piece of the same color
    if (toPiece !== '' && 
        ((currentPlayer === 'white' && toPiece === toPiece.toUpperCase()) ||
         (currentPlayer === 'black' && toPiece === toPiece.toLowerCase()))) {
      console.log('Invalid move: Destination occupied by same color');
      return false;
    }

    const dx = toIndex[1] - fromIndex[1];
    const dy = fromIndex[0] - toIndex[0];  // Note: dy is inverted because array indices increase downwards

    console.log('Move delta:', { dx, dy });

    let isValid = false;

    switch (piece.toLowerCase()) {
      case 'p': // Pawn
        if (currentPlayer === 'white') {
          if (dx === 0 && toPiece === '') {
            if (dy === 1) isValid = true; // Regular one-square move
            else if (dy === 2 && fromRow === '2' && board[fromIndex[0] - 1][fromIndex[1]] === '') isValid = true; // Initial two-square move
          } else if (Math.abs(dx) === 1 && dy === 1 && (toPiece !== '' || isEnPassantMove(from, to, piece))) isValid = true; // Capture or en passant
        } else {
          if (dx === 0 && toPiece === '') {
            if (dy === -1) isValid = true; // Regular one-square move
            else if (dy === -2 && fromRow === '7' && board[fromIndex[0] + 1][fromIndex[1]] === '') isValid = true; // Initial two-square move
          } else if (Math.abs(dx) === 1 && dy === -1 && (toPiece !== '' || isEnPassantMove(from, to, piece))) isValid = true; // Capture or en passant
        }
        break;
      case 'r': // Rook
        isValid = dx === 0 || dy === 0;
        if (isValid) {
          // Check if path is clear
          const xStep = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
          const yStep = dy === 0 ? 0 : (dy > 0 ? -1 : 1);
          let x = fromIndex[1] + xStep;
          let y = fromIndex[0] + yStep;
          while (x !== toIndex[1] || y !== toIndex[0]) {
            if (board[y][x] !== '') {
              isValid = false;
              break;
            }
            x += xStep;
            y += yStep;
          }
        }
        break;
      case 'n': // Knight
        isValid = (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);
        break;
      case 'b': // Bishop
        isValid = Math.abs(dx) === Math.abs(dy);
        if (isValid) {
          // Check if path is clear
          const xStep = dx > 0 ? 1 : -1;
          const yStep = dy > 0 ? -1 : 1;
          let x = fromIndex[1] + xStep;
          let y = fromIndex[0] + yStep;
          while (x !== toIndex[1] && y !== toIndex[0]) {
            if (board[y][x] !== '') {
              isValid = false;
              break;
            }
            x += xStep;
            y += yStep;
          }
        }
        break;
      case 'q': // Queen
        isValid = dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy);
        if (isValid) {
          // Check if path is clear
          const xStep = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
          const yStep = dy === 0 ? 0 : (dy > 0 ? -1 : 1);
          let x = fromIndex[1] + xStep;
          let y = fromIndex[0] + yStep;
          while (x !== toIndex[1] || y !== toIndex[0]) {
            if (board[y][x] !== '') {
              isValid = false;
              break;
            }
            x += xStep;
            y += yStep;
          }
        }
        break;
      case 'k': // King
        isValid = Math.abs(dx) <= 1 && Math.abs(dy) <= 1 || isCastlingMove(from, to, piece);
        break;
    }

    if (isValid) {
      // Check if the move puts or leaves the player's king in check
      const newBoard = JSON.parse(JSON.stringify(board));
      newBoard[toIndex[0]][toIndex[1]] = piece;
      newBoard[fromIndex[0]][fromIndex[1]] = '';
      if (isKingInCheck(newBoard, currentPlayer)) {
        console.log('Invalid move: Puts or leaves own king in check');
        isValid = false;
      }
    }

    console.log('Move validity result:', isValid);
    return isValid;
  };

  const makeMove = useCallback((from: string, to: string) => {
    console.log('makeMove called:', { from, to });
    const [fromCol, fromRow] = from.split('');
    const [toCol, toRow] = to.split('');
    const newBoard = JSON.parse(JSON.stringify(gameState.board));
    const piece = newBoard[8 - parseInt(fromRow)][fromCol.charCodeAt(0) - 97];
    
    if (!isValidMove(newBoard, from, to, gameState.currentPlayer)) {
      console.log('Invalid move');
      return;
    }

    newBoard[8 - parseInt(fromRow)][fromCol.charCodeAt(0) - 97] = '';
    newBoard[8 - parseInt(toRow)][toCol.charCodeAt(0) - 97] = piece;

    // Handle pawn promotion
    if (isPawnPromotion(to, piece)) {
      setGameState({
        ...gameState,
        board: newBoard,
        promotionPending: true,
        promotionSquare: to,
        currentPlayer: gameState.currentPlayer, // Preserve the current player during promotion
      });
      return;
    }

    // Handle castling
    if (isCastlingMove(from, to, piece)) {
      if (to === 'g1') {
        newBoard[7][5] = 'R';
        newBoard[7][7] = '';
      } else if (to === 'c1') {
        newBoard[7][3] = 'R';
        newBoard[7][0] = '';
      } else if (to === 'g8') {
        newBoard[0][5] = 'r';
        newBoard[0][7] = '';
      } else if (to === 'c8') {
        newBoard[0][3] = 'r';
        newBoard[0][0] = '';
      }
    }

    // Handle en passant
    if (isEnPassantMove(from, to, piece)) {
      newBoard[8 - parseInt(fromRow)][toCol.charCodeAt(0) - 97] = '';
    }

    // Set en passant target
    let enPassantTarget = null;
    if (piece.toLowerCase() === 'p' && Math.abs(parseInt(toRow) - parseInt(fromRow)) === 2) {
      enPassantTarget = `${fromCol}${(parseInt(fromRow) + parseInt(toRow)) / 2}`;
    }

    const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    const newGameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer,
      moves: [...gameState.moves, `${from}-${to}`],
      enPassantTarget,
      halfMoveClock: piece.toLowerCase() === 'p' || newBoard[8 - parseInt(toRow)][toCol.charCodeAt(0) - 97] !== ''
        ? 0
        : gameState.halfMoveClock + 1,
      fullMoveNumber: gameState.currentPlayer === 'black' ? gameState.fullMoveNumber + 1 : gameState.fullMoveNumber,
    };

    // Check for checkmate or stalemate
    if (isCheckmate(newBoard, nextPlayer)) {
      newGameState.status = 'checkmate';
      newGameState.winner = gameState.currentPlayer;
    } else if (isStalemate(newBoard, nextPlayer)) {
      newGameState.status = 'stalemate';
    } else {
      newGameState.status = 'active';
    }

    // Add a property to indicate if the next player is in check
    newGameState.isCheck = isKingInCheck(newBoard, nextPlayer);

    console.log('New game state:', newGameState);

    // Update local state immediately
    setGameState(newGameState);

    // Update Firebase
    const gameRef = ref(database, `games/${gameId}`);
    set(gameRef, newGameState)
      .then(() => console.log('Move successfully updated in Firebase'))
      .catch((error) => console.error('Error updating move in Firebase:', error));
  }, [gameId, gameState, isValidMove, isCheckmate, isStalemate, isKingInCheck, isEnPassantMove, isCastlingMove, isPawnPromotion]);

  const handlePromotion = useCallback((promotionPiece: string) => {
    if (gameState.promotionPending && gameState.promotionSquare) {
      const [col, row] = gameState.promotionSquare.split('');
      const newBoard = JSON.parse(JSON.stringify(gameState.board));
      // Ensure the promotion piece is the correct color
      const promotedPiece = gameState.currentPlayer === 'white' ? promotionPiece.toUpperCase() : promotionPiece.toLowerCase();
      newBoard[8 - parseInt(row)][col.charCodeAt(0) - 97] = promotedPiece;

      const newGameState = {
        ...gameState,
        board: newBoard,
        promotionPending: false,
        promotionSquare: null,
        currentPlayer: gameState.currentPlayer === 'white' ? 'black' : 'white',
      };

      // Check for checkmate or stalemate after promotion
      if (isCheckmate(newBoard, newGameState.currentPlayer)) {
        newGameState.status = 'checkmate';
        newGameState.winner = gameState.currentPlayer;
      } else if (isStalemate(newBoard, newGameState.currentPlayer)) {
        newGameState.status = 'stalemate';
      } else {
        newGameState.status = 'active';
      }

      // Add a property to indicate if the next player is in check
      newGameState.isCheck = isKingInCheck(newBoard, newGameState.currentPlayer);

      setGameState(newGameState);

      // Update Firebase
      const gameRef = ref(database, `games/${gameId}`);
      set(gameRef, newGameState)
        .then(() => console.log('Promotion successfully updated in Firebase'))
        .catch((error) => console.error('Error updating promotion in Firebase:', error));
    }
  }, [gameState, gameId, isCheckmate, isStalemate, isKingInCheck]);

  const resignGame = useCallback((color: 'white' | 'black') => {
    const gameRef = ref(database, `games/${gameId}`);
    set(gameRef, {
      ...gameState,
      status: 'resigned',
      winner: color === 'white' ? 'black' : 'white',
    });
  }, [gameId, gameState]);

  const sendMessage = useCallback((text: string) => {
    const messagesRef = ref(database, `messages/${gameId}`);
    push(messagesRef, { playerId, playerName, text });
  }, [gameId, playerId, playerName]);

  const canMakeMove = useCallback((playerColor: 'white' | 'black' | 'spectator'): boolean => {
    console.log('Checking if player can make move:', {
      playerColor,
      currentPlayer: gameState.currentPlayer,
      gameStatus: gameState.status,
      playerId,
      whitePlayerId: gameState.players.white?.id,
      blackPlayerId: gameState.players.black?.id
    });

    const isActiveGame = gameState.status === 'active';
    const isCurrentPlayer = playerColor === gameState.currentPlayer;
    const isCorrectPlayer = (
      (playerColor === 'white' && gameState.players.white?.id === playerId) ||
      (playerColor === 'black' && gameState.players.black?.id === playerId)
    );

    const canMove = isActiveGame && isCurrentPlayer && isCorrectPlayer;
    console.log('Can make move:', canMove);
    return canMove;
  }, [gameState.status, gameState.currentPlayer, gameState.players, playerId]);

  const getPlayerRole = useCallback((): 'white' | 'black' | 'spectator' => {
    if (gameState.players.white?.id === playerId) return 'white';
    if (gameState.players.black?.id === playerId) return 'black';
    return 'spectator';
  }, [gameState.players, playerId]);

  const isPlayerInGame = useCallback((state: GameState = gameState): boolean => {
    return (
      (state.players.white && state.players.white.id === playerId) ||
      (state.players.black && state.players.black.id === playerId)
    );
  }, [gameState.players, playerId]);

  const isCurrentPlayerTurn = useCallback(() => {
    const playerRole = getPlayerRole();
    return playerRole === gameState.currentPlayer;
  }, [gameState.currentPlayer, getPlayerRole]);

  const calculatePossibleMoves = (board: string[][], from: string): string[] => {
    const possibleMoves: string[] = [];
    const [fromCol, fromRow] = from.split('');
    const fromIndex = [8 - parseInt(fromRow), fromCol.charCodeAt(0) - 97];
    const piece = board[fromIndex[0]][fromIndex[1]];
    const currentPlayer = piece === piece.toUpperCase() ? 'white' : 'black';

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const to = `${String.fromCharCode(97 + j)}${8 - i}`;
        if (isValidMove(board, from, to, currentPlayer)) {
          possibleMoves.push(to);
        }
      }
    }

    return possibleMoves;
  };

  return { 
    gameState, 
    messages,
    createGame, 
    joinGame, 
    makeMove, 
    sendMessage,
    resignGame, 
    canMakeMove, 
    getPlayerRole, 
    isPlayerInGame,
    isValidMove,
    isKingInCheck,
    isPawnPromotion,
    isCurrentPlayerTurn,
    calculatePossibleMoves,
    handlePromotion
  };
};

