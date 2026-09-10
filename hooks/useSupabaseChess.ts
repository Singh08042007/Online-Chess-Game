'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { supabase, GameRecord, MoveRecord, GameMessageRecord } from '@/lib/supabase';
import { chessJsToMatrix, calculateCapturedPieces, STARTING_FEN } from '@/lib/chess-utils';
import { soundManager } from '@/lib/audio';

export interface UseSupabaseChessProps {
  roomCode: string;
  userId?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
}

export const useSupabaseChess = ({
  roomCode,
  userId,
  userName = 'Anonymous Player',
  userAvatar,
}: UseSupabaseChessProps) => {
  const chessRef = useRef<Chess>(new Chess());
  const [board, setBoard] = useState<string[][]>(chessJsToMatrix(chessRef.current));
  const [game, setGame] = useState<GameRecord | null>(null);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [messages, setMessages] = useState<GameMessageRecord[]>([]);
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [promotionPending, setPromotionPending] = useState<boolean>(false);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Persistent identifier so guests and authenticated users can both participate
  const [effectiveUserId, setEffectiveUserId] = useState<string>(userId || '');

  useEffect(() => {
    if (userId) {
      setEffectiveUserId(userId);
    } else if (typeof window !== 'undefined') {
      let stored = localStorage.getItem('chess_player_guid');
      if (!stored) {
        stored = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('chess_player_guid', stored);
      }
      setEffectiveUserId(stored);
    }
  }, [userId]);

  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync board matrix and check state from chessRef
  const syncFromChess = useCallback(() => {
    const c = chessRef.current;
    setBoard(chessJsToMatrix(c));
    setIsCheck(c.inCheck());
  }, []);

  // Determine player role: 'white' | 'black' | 'spectator'
  const playerRole: 'white' | 'black' | 'spectator' = (() => {
    if (!game || !effectiveUserId) return 'spectator';
    if (game.white_player_id === effectiveUserId) return 'white';
    if (game.black_player_id === effectiveUserId) return 'black';
    // Fallback: if username matches
    if (userName && game.white_player_name === userName) return 'white';
    if (userName && game.black_player_name === userName) return 'black';
    return 'spectator';
  })();

  const currentTurn = game?.current_turn ?? 'white';
  const isGamePlayable = game?.status === 'active' || (game?.status === 'waiting' && playerRole === 'white');
  const isMyTurn = (playerRole === 'white' || playerRole === 'black') && playerRole === currentTurn && isGamePlayable;

  // Load Game by Room Code
  const loadGame = useCallback(async () => {
    if (!roomCode) return;
    try {
      setLoading(true);
      setError(null);

      const { data: existingGame, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (gameError || !existingGame) {
        setError('Game room not found. Please verify the room code.');
        setLoading(false);
        return;
      }

      setGame(existingGame as GameRecord);
      setWhiteTime(existingGame.white_time_seconds ?? 600);
      setBlackTime(existingGame.black_time_seconds ?? 600);

      // Load FEN into chess engine
      if (existingGame.fen) {
        try {
          chessRef.current.load(existingGame.fen);
          syncFromChess();
        } catch {
          chessRef.current.load(STARTING_FEN);
          syncFromChess();
        }
      }

      // Load Moves
      const { data: movesData } = await supabase
        .from('moves')
        .select('*')
        .eq('game_id', existingGame.id)
        .order('move_number', { ascending: true });

      if (movesData) {
        setMoves(movesData as MoveRecord[]);
        if (movesData.length > 0) {
          const last = movesData[movesData.length - 1];
          setLastMove({ from: last.from_square, to: last.to_square });
        }
      }

      // Load Messages
      const { data: messagesData } = await supabase
        .from('game_messages')
        .select('*')
        .eq('game_id', existingGame.id)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as GameMessageRecord[]);
      }

      // Auto join as black if game is waiting and white is someone else
      if (
        effectiveUserId &&
        existingGame.status === 'waiting' &&
        !existingGame.black_player_id &&
        existingGame.white_player_id !== effectiveUserId
      ) {
        const { data: updatedGame } = await supabase
          .from('games')
          .update({
            black_player_id: effectiveUserId,
            black_player_name: userName,
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', existingGame.id)
          .select('*')
          .single();

        if (updatedGame) {
          setGame(updatedGame as GameRecord);
        }
      }
    } catch (err) {
      console.error('Failed to load game:', err);
      setError('An error occurred while connecting to the game room.');
    } finally {
      setLoading(false);
    }
  }, [roomCode, effectiveUserId, userName, syncFromChess]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Realtime Subscriptions via Supabase Postgres Changes
  useEffect(() => {
    if (!game?.id) return;

    const gameChannel = supabase
      .channel(`game_room_${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          const newGame = payload.new as GameRecord;
          setGame(newGame);
          setWhiteTime(newGame.white_time_seconds);
          setBlackTime(newGame.black_time_seconds);

          if (newGame.fen && newGame.fen !== chessRef.current.fen()) {
            chessRef.current.load(newGame.fen);
            syncFromChess();
          }

          if (['checkmate', 'resigned', 'timeout'].includes(newGame.status)) {
            soundManager.playVictory();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moves',
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          const newMove = payload.new as MoveRecord;
          setMoves((prev) => {
            if (prev.some((m) => m.id === newMove.id)) return prev;
            return [...prev, newMove];
          });
          setLastMove({ from: newMove.from_square, to: newMove.to_square });

          if (newMove.captured_piece) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }

          if (chessRef.current.inCheck()) {
            soundManager.playCheck();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_messages',
          filter: `game_id=eq.${game.id}`,
        },
        (payload) => {
          const newMsg = payload.new as GameMessageRecord;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
    };
  }, [game?.id, syncFromChess]);

  // Handle Timeout
  const handleTimeout = useCallback(async (timedOutColor: 'white' | 'black') => {
    if (!game) return;
    const winnerColor = timedOutColor === 'white' ? 'black' : 'white';
    try {
      await supabase.rpc('finish_game', {
        p_game_id: game.id,
        p_winner_color: winnerColor,
        p_termination: 'timeout',
      });
    } catch {
      await supabase
        .from('games')
        .update({
          status: 'timeout',
          winner_color: winnerColor,
          termination: 'timeout',
          finished_at: new Date().toISOString(),
        })
        .eq('id', game.id);
    }
  }, [game]);

  // Active Clock Interval Countdown
  useEffect(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);

    const isRunning =
      (game?.status === 'active' || (moves.length > 0 && game?.status !== 'checkmate' && game?.status !== 'resigned' && game?.status !== 'stalemate' && game?.status !== 'draw' && game?.status !== 'timeout'));

    if (isRunning && game) {
      clockIntervalRef.current = setInterval(() => {
        if (game.current_turn === 'white') {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              clearInterval(clockIntervalRef.current!);
              handleTimeout('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              clearInterval(clockIntervalRef.current!);
              handleTimeout('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [game?.status, game?.current_turn, moves.length, handleTimeout, game]);

  // Authoritative Game Finish caller
  const finishGame = async (winnerColor: 'white' | 'black' | 'draw', termination: string) => {
    if (!game) return;
    try {
      await supabase.rpc('finish_game', {
        p_game_id: game.id,
        p_winner_color: winnerColor,
        p_termination: termination,
      });
    } catch {
      await supabase
        .from('games')
        .update({
          status: termination === 'checkmate' ? 'checkmate' : termination === 'resignation' ? 'resigned' : 'draw',
          winner_color: winnerColor,
          termination,
          finished_at: new Date().toISOString(),
        })
        .eq('id', game.id);
    }
  };

  // Legal moves calculator for a given square
  const calculatePossibleMoves = useCallback((fromSquare: string): string[] => {
    try {
      const legalMoves = chessRef.current.moves({
        square: fromSquare as Square,
        verbose: true,
      });
      return legalMoves.map((m) => m.to);
    } catch {
      return [];
    }
  }, []);

  // Execute Move
  const executeMove = async (from: string, to: string, promotionPiece?: string) => {
    if (!game) return;

    const chess = chessRef.current;
    let moveResult;
    try {
      moveResult = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotionPiece ? (promotionPiece.toLowerCase() as 'q' | 'r' | 'b' | 'n') : undefined,
      });
    } catch (err) {
      console.error('Invalid move attempt:', err);
      return;
    }

    if (!moveResult) return;

    syncFromChess();
    setLastMove({ from, to });

    if (moveResult.captured) {
      soundManager.playCapture();
    } else {
      soundManager.playMove();
    }

    if (chess.inCheck()) {
      soundManager.playCheck();
    }

    const nextTurn = chess.turn() === 'w' ? 'white' : 'black';
    const isGameOver = chess.isGameOver();
    let newStatus = game.status === 'waiting' ? 'active' : game.status;
    let winnerColor: 'white' | 'black' | 'draw' | null = null;
    let termination: string | null = null;

    if (chess.isCheckmate()) {
      newStatus = 'checkmate';
      winnerColor = currentTurn;
      termination = 'checkmate';
      soundManager.playVictory();
    } else if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
      newStatus = 'draw';
      winnerColor = 'draw';
      termination = chess.isStalemate() ? 'stalemate' : 'draw';
    }

    // Insert move into database
    await supabase.from('moves').insert({
      game_id: game.id,
      player_id: userId || null,
      move_number: moves.length + 1,
      player_color: playerRole,
      from_square: from,
      to_square: to,
      piece: moveResult.piece,
      captured_piece: moveResult.captured || null,
      promotion_piece: promotionPiece || null,
      san: moveResult.san,
      fen_after: chess.fen(),
    });

    // Update game record with current clock times
    await supabase
      .from('games')
      .update({
        fen: chess.fen(),
        pgn: chess.pgn(),
        current_turn: nextTurn,
        status: newStatus,
        white_time_seconds: whiteTime,
        black_time_seconds: blackTime,
        last_move_at: new Date().toISOString(),
        draw_offered_by: null,
      })
      .eq('id', game.id);

    if (isGameOver && winnerColor && termination) {
      await finishGame(winnerColor, termination);
    }
  };

  // Attempt move (checks for pawn promotion first)
  const makeMove = useCallback(
    (from: string, to: string) => {
      const chess = chessRef.current;
      const piece = chess.get(from as Square);

      // Check if this is a pawn promotion move
      const isPawn = piece && piece.type === 'p';
      const isPromotionRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');

      if (isPawn && isPromotionRank) {
        setPendingMove({ from, to });
        setPromotionPending(true);
        return;
      }

      executeMove(from, to);
    },
    [executeMove]
  );

  const handlePromotion = useCallback(
    (pieceSymbol: string) => {
      if (pendingMove) {
        setPromotionPending(false);
        executeMove(pendingMove.from, pendingMove.to, pieceSymbol);
        setPendingMove(null);
      }
    },
    [pendingMove, executeMove]
  );

  // Resignation
  const resignGame = useCallback(async () => {
    if (!game || playerRole === 'spectator' || game.status !== 'active') return;
    const winnerColor = playerRole === 'white' ? 'black' : 'white';
    soundManager.playDefeat();
    await finishGame(winnerColor, 'resignation');
  }, [game, playerRole, finishGame]);

  // Draw Offer & Acceptance
  const offerDraw = useCallback(async () => {
    if (!game || playerRole === 'spectator' || game.status !== 'active') return;
    await supabase.from('games').update({ draw_offered_by: playerRole }).eq('id', game.id);
  }, [game, playerRole]);

  const acceptDraw = useCallback(async () => {
    if (!game || playerRole === 'spectator' || game.status !== 'active') return;
    await finishGame('draw', 'agreement');
  }, [game, playerRole, finishGame]);

  const declineDraw = useCallback(async () => {
    if (!game) return;
    await supabase.from('games').update({ draw_offered_by: null }).eq('id', game.id);
  }, [game]);

  // Send In-Game Chat Message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!game || !text.trim()) return;
      await supabase.from('game_messages').insert({
        game_id: game.id,
        sender_id: userId || null,
        sender_name: userName,
        message: text.trim(),
      });
    },
    [game, userId, userName]
  );

  // Material & captured piece calculations
  const capturedStats = calculateCapturedPieces(chessRef.current);

  return {
    game,
    board,
    moves,
    messages,
    whiteTime,
    blackTime,
    playerRole,
    currentTurn,
    isMyTurn,
    isCheck,
    lastMove,
    promotionPending,
    promotionSquare: pendingMove?.to ?? null,
    loading,
    error,
    capturedStats,
    makeMove,
    handlePromotion,
    calculatePossibleMoves,
    resignGame,
    offerDraw,
    acceptDraw,
    declineDraw,
    sendMessage,
    reloadGame: loadGame,
  };
};
