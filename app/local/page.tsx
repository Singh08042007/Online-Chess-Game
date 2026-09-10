'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess, Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard';
import { PlayerCard } from '@/components/chess/PlayerCard';
import { GameOverModal } from '@/components/chess/GameOverModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chessJsToMatrix, calculateCapturedPieces, PIECE_VALUES } from '@/lib/chess-utils';
import { soundManager } from '@/lib/audio';
import { getBestBotMove } from '@/lib/bot-engine';
import { useHandChess } from '@/hooks/useHandChess';
import { HandCameraPreview } from '@/components/hand-gesture/HandCameraPreview';
import { HandBoardOverlay } from '@/components/hand-gesture/HandBoardOverlay';
import { CameraModal } from '@/components/hand-gesture/CameraModal';
import { HandTutorialModal } from '@/components/hand-gesture/HandTutorialModal';
import { Bot, Users, RotateCcw, Clock, MousePointer, Camera, Sparkles, Hand } from 'lucide-react';

function LocalGameContent() {
  const [gameMode, setGameMode] = useState<'pass_and_play' | 'vs_bot'>('vs_bot');
  const [controlMode, setControlMode] = useState<'mouse' | 'hand'>('mouse');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);

  const [botDifficulty, setBotDifficulty] = useState<'beginner' | 'intermediate' | 'grandmaster'>('intermediate');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [timeControlMinutes, setTimeControlMinutes] = useState<number>(10);

  const chessRef = useRef<Chess>(new Chess());
  const [board, setBoard] = useState<string[][]>(chessJsToMatrix(chessRef.current));
  const [moveHistory, setMoveHistory] = useState<{ san: string; from: string; to: string }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winnerColor, setWinnerColor] = useState<'white' | 'black' | 'draw' | null>(null);
  const [termination, setTermination] = useState<string | null>(null);

  // Active countdown timers
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [promotionPending, setPromotionPending] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);

  const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';
  const isHumanTurn = gameMode === 'pass_and_play' || (gameMode === 'vs_bot' && currentTurn === playerColor && !gameOver);

  const resetGame = useCallback((newMinutes?: number) => {
    const mins = newMinutes ?? timeControlMinutes;
    chessRef.current = new Chess();
    setBoard(chessJsToMatrix(chessRef.current));
    setMoveHistory([]);
    setLastMove(null);
    setIsCheck(false);
    setGameOver(false);
    setWinnerColor(null);
    setTermination(null);
    setWhiteTime(mins * 60);
    setBlackTime(mins * 60);
  }, [timeControlMinutes]);

  // Handle Timeout
  const handleTimeout = useCallback((timedOutPlayer: 'white' | 'black') => {
    setGameOver(true);
    setWinnerColor(timedOutPlayer === 'white' ? 'black' : 'white');
    setTermination('timeout');
    soundManager.playVictory();
  }, []);

  // Clock interval countdown
  useEffect(() => {
    if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);

    // Timer starts after the first move has been made and game is active
    if (!gameOver && moveHistory.length > 0) {
      clockIntervalRef.current = setInterval(() => {
        if (currentTurn === 'white') {
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
  }, [currentTurn, gameOver, moveHistory.length, handleTimeout]);

  const syncState = useCallback(() => {
    const c = chessRef.current;
    setBoard(chessJsToMatrix(c));
    setIsCheck(c.inCheck());

    if (c.isCheckmate()) {
      setGameOver(true);
      setWinnerColor(c.turn() === 'w' ? 'black' : 'white');
      setTermination('checkmate');
      soundManager.playVictory();
    } else if (c.isDraw() || c.isStalemate() || c.isThreefoldRepetition() || c.isInsufficientMaterial()) {
      setGameOver(true);
      setWinnerColor('draw');
      setTermination(c.isStalemate() ? 'stalemate' : 'draw');
    }
  }, []);

  // Bot move evaluator with immediate checkmate detection
  const makeBotMove = useCallback(() => {
    const chess = chessRef.current;
    if (chess.isGameOver()) return;

    const botColor = playerColor === 'white' ? 'b' : 'w';
    const selectedMove = getBestBotMove(chess, botDifficulty, botColor);
    if (!selectedMove) return;

    setTimeout(() => {
      try {
        const result = chess.move(selectedMove);
        if (result) {
          if (result.captured) soundManager.playCapture();
          else soundManager.playMove();

          if (chess.isCheckmate()) {
            soundManager.playVictory();
          } else if (chess.inCheck()) {
            soundManager.playCheck();
          }

          setLastMove({ from: result.from, to: result.to });
          setMoveHistory((prev) => [...prev, { san: result.san, from: result.from, to: result.to }]);
          syncState();
        }
      } catch (err) {
        console.error('Bot move error:', err);
      }
    }, 450);
  }, [botDifficulty, playerColor, syncState]);

  // Handle human move
  const executeMove = useCallback((from: string, to: string, promo?: string) => {
    const chess = chessRef.current;
    try {
      const result = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: (promo?.toLowerCase() as 'q' | 'r' | 'b' | 'n') || 'q',
      });

      if (!result) return;

      if (result.captured) soundManager.playCapture();
      else soundManager.playMove();

      if (chess.inCheck()) soundManager.playCheck();

      setLastMove({ from, to });
      setMoveHistory((prev) => [...prev, { san: result.san, from, to }]);
      syncState();

      if (gameMode === 'vs_bot' && !chess.isGameOver()) {
        makeBotMove();
      }
    } catch (err) {
      console.error('Move attempt error:', err);
    }
  }, [gameMode, makeBotMove, syncState]);

  const handleMove = useCallback((from: string, to: string) => {
    const chess = chessRef.current;
    const piece = chess.get(from as Square);

    const isPawn = piece && piece.type === 'p';
    const isPromoRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');

    if (isPawn && isPromoRank) {
      setPendingMove({ from, to });
      setPromotionPending(true);
      return;
    }

    executeMove(from, to);
  }, [executeMove]);

  const handlePromotion = (piece: string) => {
    if (pendingMove) {
      setPromotionPending(false);
      executeMove(pendingMove.from, pendingMove.to, piece);
      setPendingMove(null);
    }
  };

  const calculateMoves = useCallback((pos: string) => {
    try {
      const moves = chessRef.current.moves({ square: pos as Square, verbose: true });
      return moves.map((m) => m.to);
    } catch (err) {
      return [];
    }
  }, []);

  // Hand gesture chess controller hook (isolated strictly to vs_bot mode)
  const isHandModeActive = gameMode === 'vs_bot' && controlMode === 'hand';

  const {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    permissionDenied,
    permissionPending,
    trackingResult,
    grabbedSquare,
    legalTargetSquares,
    showSkeleton,
    setShowSkeleton,
    calibrationBounds,
    setCalibrationBounds,
    startCamera,
    stopCamera,
  } = useHandChess({
    enabled: isHandModeActive,
    isMyTurn: isHumanTurn,
    playerColor,
    boardMatrix: board,
    calculateMoves,
    onExecuteMove: (from, to) => handleMove(from, to),
    orientation: playerColor,
  });

  // Detect whether device is mobile (smartphones / tablets)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkIsMobile = () => {
      if (typeof window === 'undefined') return false;
      const ua = navigator.userAgent || '';
      // Guarantee that Windows, Mac, Linux laptops/desktops are recognized as computers
      const isDesktopOS = /Windows NT|Macintosh|Linux x86_64|CrOS/i.test(ua);
      if (isDesktopOS) return false;
      return /iPhone|iPad|iPod|Android.*Mobile|Mobile.*Firefox|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    };

    const mobile = checkIsMobile();
    setIsMobile(mobile);
  }, []);

  const hasAutoPromptedRef = useRef(false);

  // Handle URL query param: ?mode=hand or ?control=hand
  useEffect(() => {
    const mode = searchParams.get('mode');
    const control = searchParams.get('control');
    if ((mode === 'hand' || control === 'hand') && !isMobile && !hasAutoPromptedRef.current) {
      hasAutoPromptedRef.current = true;
      setGameMode('vs_bot');
      setControlMode('hand');
      if (!cameraActive) {
        setCameraModalOpen(true);
      }
    }
  }, [searchParams, isMobile, cameraActive]);

  // Switch control modes (computer devices only)
  const handleSelectHandMode = () => {
    if (isMobile) return;
    setGameMode('vs_bot');
    setControlMode('hand');
    if (cameraActive) return;
    setCameraModalOpen(true);
  };

  const handleEnableCameraFromModal = async () => {
    setControlMode('hand');
    try {
      await startCamera();
      setCameraModalOpen(false);
    } catch {
      // Keep modal open so error message is displayed
    }
  };

  const handleSelectMouseMode = () => {
    setControlMode('mouse');
    stopCamera();
    setCameraModalOpen(false);
  };

  // When leaving vs_bot mode, always stop camera and reset to mouse
  useEffect(() => {
    if (gameMode !== 'vs_bot' && controlMode === 'hand') {
      handleSelectMouseMode();
    }
  }, [gameMode]);

  const canMove = !gameOver && (gameMode === 'pass_and_play' || (gameMode === 'vs_bot' && currentTurn === playerColor));
  const captured = calculateCapturedPieces(chessRef.current);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Mode Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2 sm:gap-2.5">
            {gameMode === 'vs_bot' ? (
              controlMode === 'hand' ? (
                <>
                  <span className="text-emerald-400">🖐️</span> Play vs Computer AI (Hand Gestures)
                </>
              ) : (
                <>
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" /> Play vs Computer AI
                </>
              )
            ) : (
              <>
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400" /> Pass & Play (Local 2P)
              </>
            )}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {gameMode === 'vs_bot'
              ? controlMode === 'hand'
                ? '🖐️ Camera tracking active: Move hand over pieces, close fist to grab, open hand to drop.'
                : 'Train against adaptive chess engine difficulty bots with active clocks or switch to Hand Gestures.'
              : 'Play on one screen with a friend with turn-by-turn timers and move tracking.'}
          </p>
        </div>

        {/* Mode Switch Buttons: 3 Distinct Choices */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
          {/* Choice 1: Standard Bot (Mouse) */}
          <button
            onClick={() => {
              setGameMode('vs_bot');
              handleSelectMouseMode();
              resetGame();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              gameMode === 'vs_bot' && controlMode === 'mouse'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            Play AI (Mouse)
          </button>

          {/* Choice 2: Hand Gestures AI (Computer Devices) */}
          {!isMobile && (
            <button
              onClick={() => {
                setGameMode('vs_bot');
                handleSelectHandMode();
                resetGame();
              }}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                gameMode === 'vs_bot' && controlMode === 'hand'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/60'
                  : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/70 border border-emerald-700/60'
              }`}
            >
              <span className="text-base">🖐️</span>
              <span>Hand Gestures AI</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 ml-0.5">
                Camera
              </span>
            </button>
          )}

          {/* Choice 3: Pass & Play */}
          <button
            onClick={() => {
              setGameMode('pass_and_play');
              handleSelectMouseMode();
              resetGame();
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              gameMode === 'pass_and_play'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4 text-teal-400" />
            Pass & Play (2P)
          </button>
        </div>
      </div>

      {/* Control Method Selector (Only for vs_bot mode on Computer Devices) */}
      {gameMode === 'vs_bot' && !isMobile && (
        <div
          className={`mb-4 p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md transition-all ${
            controlMode === 'hand' && cameraActive
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-emerald-950/40'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                controlMode === 'hand' && cameraActive
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {controlMode === 'hand' ? '🖐️' : '🖱️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {controlMode === 'hand' ? 'Camera Hand-Gesture Mode' : 'Standard Mouse Controls'}
                </span>
                {controlMode === 'hand' && cameraActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Tracking Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {controlMode === 'hand' && cameraActive
                  ? 'Point ☝️ to aim • Close fist ✊ to grab • Open hand 🖐️ to drop piece'
                  : 'Play using mouse clicks. Or switch to Camera Hand Gestures to control pieces in mid-air!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {controlMode === 'hand' && (
              <button
                onClick={() => setTutorialModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
              >
                <span>📖</span> Tutorial & Calibration
              </button>
            )}

            <button
              onClick={controlMode === 'hand' ? handleSelectMouseMode : handleSelectHandMode}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                controlMode === 'hand'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/40'
              }`}
            >
              {controlMode === 'hand' ? (
                <>
                  <MousePointer className="w-3.5 h-3.5" />
                  Switch to Mouse
                </>
              ) : (
                <>
                  <span className="text-sm">🖐️</span>
                  Enable Hand Gestures
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Notice (Touch Controls) */}
      {gameMode === 'vs_bot' && isMobile && (
        <div className="mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Control: <strong>Touch & Tap</strong>
          </span>
          <span className="text-slate-500 text-[11px]">
            🖐️ Camera hand gestures available on computer / laptop
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board & Cards */}
        <div className="lg:col-span-8 flex flex-col items-center gap-2 max-w-[560px] mx-auto w-full">
          {/* Top Player (Black or Bot) */}
          <div className="w-full">
            <PlayerCard
              name={gameMode === 'vs_bot' ? `ChessBot (${botDifficulty.toUpperCase()})` : 'Player 2 (Black)'}
              color="black"
              timeSeconds={blackTime}
              isActiveTurn={currentTurn === 'black' && !gameOver && moveHistory.length > 0}
              capturedPieces={captured.capturedByBlack}
              materialDifference={captured.blackMaterialDiff}
            />
          </div>

          {/* Interactive Board with Hand Gesture Overlay */}
          <div className="w-full flex justify-center py-1 relative">
            <div className="relative w-full max-w-[min(100vw-24px,560px)] aspect-square">
              <ChessBoard
                board={board}
                onMove={handleMove}
                canMakeMove={canMove}
                calculatePossibleMoves={calculateMoves}
                promotionPending={promotionPending}
                promotionSquare={pendingMove?.to ?? null}
                onPromotion={handlePromotion}
                isCheck={isCheck}
                currentTurn={currentTurn}
                lastMove={lastMove}
                orientation={playerColor}
              />

              {/* Hand Board Overlay (Only visible when Hand Control is active) */}
              {isHandModeActive && cameraActive && (
                <div className="absolute inset-0 p-1 sm:p-3.5 pointer-events-none">
                  <HandBoardOverlay
                    hoveredSquare={trackingResult?.hoveredSquare ?? null}
                    grabbedSquare={grabbedSquare}
                    legalMoves={legalTargetSquares}
                    gesture={trackingResult?.gesture ?? 'UNKNOWN'}
                    smoothedPosition={trackingResult?.smoothedPosition ?? null}
                    boardPosition={trackingResult?.boardPosition ?? null}
                    boardMatrix={board}
                    orientation={playerColor}
                    isHandPresent={trackingResult?.isHandPresent ?? false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Player (White) */}
          <div className="w-full">
            <PlayerCard
              name={gameMode === 'vs_bot' ? 'You (White)' : 'Player 1 (White)'}
              color="white"
              timeSeconds={whiteTime}
              isActiveTurn={currentTurn === 'white' && !gameOver && moveHistory.length > 0}
              capturedPieces={captured.capturedByWhite}
              materialDifference={captured.whiteMaterialDiff}
              isCurrentUser
            />
          </div>

          {/* Bottom controls */}
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                Turn: <strong className="capitalize text-slate-200">{currentTurn}</strong>
              </span>
              {moveHistory.length === 0 && (
                <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Make 1st move to start timer
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isHandModeActive && cameraActive && (
                <Button
                  onClick={() => setTutorialModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="text-xs border-emerald-800/80 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 h-8 gap-1"
                >
                  <Hand className="w-3.5 h-3.5" />
                  Hand Help
                </Button>
              )}

              <Button
                onClick={() => resetGame()}
                size="sm"
                variant="outline"
                className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200 h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Board
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Hand Preview Panel & Settings */}
        <div className="lg:col-span-4 space-y-4 w-full">
          {/* Hand Tracking Camera Preview (Always mounted in DOM to keep video/canvas refs attached) */}
          <div className={isHandModeActive ? 'block' : 'hidden'}>
            <HandCameraPreview
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraActive={cameraActive}
              gesture={trackingResult?.gesture ?? 'UNKNOWN'}
              hoveredSquare={trackingResult?.hoveredSquare ?? null}
              grabbedSquare={grabbedSquare}
              confidence={trackingResult?.confidence ?? 0}
              isHandPresent={trackingResult?.isHandPresent ?? false}
              showSkeleton={showSkeleton}
              onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
              onOpenCalibration={() => setTutorialModalOpen(true)}
              onOpenTutorial={() => setTutorialModalOpen(true)}
            />
          </div>

          {/* Time Control selection */}
          <Card className="bg-slate-900/90 border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Time Control
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setTimeControlMinutes(mins);
                    resetGame(mins);
                  }}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    timeControlMinutes === mins
                      ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </Card>

          {/* Difficulty selector (if vs Bot) */}
          {gameMode === 'vs_bot' && (
            <Card className="bg-slate-900/90 border-slate-800 p-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Bot Difficulty
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'beginner', label: 'Casual', rating: 900 },
                  { key: 'intermediate', label: 'Club', rating: 1400 },
                  { key: 'grandmaster', label: 'Master', rating: 2000 },
                ].map((diff) => (
                  <button
                    key={diff.key}
                    onClick={() => {
                      setBotDifficulty(diff.key as 'beginner' | 'intermediate' | 'grandmaster');
                      resetGame();
                    }}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      botDifficulty === diff.key
                        ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{diff.label}</div>
                    <div className="text-[10px] text-amber-400 font-mono">~{diff.rating}</div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Moves History */}
          <Card className="bg-slate-900/90 border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Move History ({moveHistory.length})
            </h3>
            <ScrollArea className="h-[220px] pr-3">
              {moveHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                  <p className="text-xs">No moves yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                    const white = moveHistory[i * 2];
                    const black = moveHistory[i * 2 + 1];
                    return (
                      <div key={i} className="flex items-center p-1 rounded bg-slate-950/40">
                        <span className="w-8 text-slate-500 font-bold">{i + 1}.</span>
                        <span className="w-20 font-bold text-slate-200">{white?.san}</span>
                        <span className="w-20 font-bold text-slate-400">{black?.san}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Camera Permission Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onEnableCamera={handleEnableCameraFromModal}
        onPlayWithMouse={handleSelectMouseMode}
        permissionDenied={permissionDenied}
        errorMessage={cameraError}
        isLoading={permissionPending}
      />

      {/* Hand Gesture Tutorial & Practice Modal */}
      <HandTutorialModal
        isOpen={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
        currentGesture={trackingResult?.gesture ?? 'UNKNOWN'}
        currentSquare={trackingResult?.hoveredSquare ?? null}
        calibrationBounds={calibrationBounds}
        onUpdateCalibration={setCalibrationBounds}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver}
        onClose={() => setGameOver(false)}
        winnerColor={winnerColor}
        termination={termination}
        userColor="white"
        onRematch={() => resetGame()}
        onBackToLobby={() => resetGame()}
      />
    </div>
  );
}

export default function LocalGamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Loading Chess Arena...</p>
        </div>
      }
    >
      <LocalGameContent />
    </Suspense>
  );
}
