'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chess } from 'chess.js';
import { supabase, GameRecord, MoveRecord } from '@/lib/supabase';
import { ChessBoard } from '@/components/ChessBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chessJsToMatrix, STARTING_FEN } from '@/lib/chess-utils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Trophy,
} from 'lucide-react';

export default function GameReplayPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.id as string)?.toUpperCase();

  const [game, setGame] = useState<GameRecord | null>(null);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // States at each move: index 0 = start position, index n = after move n
  const [positions, setPositions] = useState<{ fen: string; board: string[][]; lastMove: { from: string; to: string } | null }[]>([]);

  useEffect(() => {
    const fetchGameAndMoves = async () => {
      try {
        setLoading(true);
        const { data: gData, error: gErr } = await supabase
          .from('games')
          .select('*')
          .eq('room_code', roomCode)
          .single();

        if (gErr || !gData) {
          setLoading(false);
          return;
        }

        setGame(gData as GameRecord);

        const { data: mData } = await supabase
          .from('moves')
          .select('*')
          .eq('game_id', gData.id)
          .order('move_number', { ascending: true });

        const moveList = (mData as MoveRecord[]) || [];
        setMoves(moveList);

        // Reconstruct positions from beginning
        const c = new Chess();
        const posArray: { fen: string; board: string[][]; lastMove: { from: string; to: string } | null }[] = [
          {
            fen: STARTING_FEN,
            board: chessJsToMatrix(c),
            lastMove: null,
          },
        ];

        for (const m of moveList) {
          try {
            c.move({
              from: m.from_square,
              to: m.to_square,
              promotion: m.promotion_piece?.toLowerCase() as 'q' | 'r' | 'b' | 'n' | undefined,
            });
            posArray.push({
              fen: c.fen(),
              board: chessJsToMatrix(c),
              lastMove: { from: m.from_square, to: m.to_square },
            });
          } catch (err) {
            console.error('Replay move reconstruction error:', err);
          }
        }

        setPositions(posArray);
        setCurrentStep(posArray.length - 1); // Start at final position
      } catch (err) {
        console.error('Replay error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameAndMoves();
  }, [roomCode]);

  // Autoplay timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= positions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, positions.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentStep((prev) => Math.min(positions.length - 1, prev + 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [positions.length]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-slate-400 text-sm">Preparing interactive game replay...</p>
      </div>
    );
  }

  if (!game || positions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Replay Not Available</h2>
        <p className="text-slate-400 text-xs mb-4">The game could not be found or has no recorded moves.</p>
        <Link href="/history">
          <Button variant="outline" className="text-xs">Back to History</Button>
        </Link>
      </div>
    );
  }

  const currentPos = positions[currentStep] || positions[0];

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button and title */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link href="/history" className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span>{game.white_player_name || 'White'}</span>
          <span className="text-slate-600">vs</span>
          <span>{game.black_player_name || 'Black'}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 ml-2">
            Result: {game.result || '*'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Board & Step Controls */}
        <div className="lg:col-span-8 flex flex-col items-center gap-4 max-w-[560px] mx-auto w-full">
          <div className="w-full flex justify-center py-1">
            <ChessBoard
              board={currentPos.board}
              onMove={() => {}}
              canMakeMove={false}
              calculatePossibleMoves={() => []}
              lastMove={currentPos.lastMove}
              orientation="white"
            />
          </div>

          {/* Replay Controls Panel */}
          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
                disabled={currentStep === 0}
                size="sm"
                variant="outline"
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800 text-slate-300"
                title="Beginning (Home)"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => { setIsPlaying(false); setCurrentStep((p) => Math.max(0, p - 1)); }}
                disabled={currentStep === 0}
                size="sm"
                variant="outline"
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800 text-slate-300"
                title="Previous Move (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                size="sm"
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                {isPlaying ? 'Pause' : 'Autoplay'}
              </Button>

              <Button
                onClick={() => { setIsPlaying(false); setCurrentStep((p) => Math.min(positions.length - 1, p + 1)); }}
                disabled={currentStep >= positions.length - 1}
                size="sm"
                variant="outline"
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800 text-slate-300"
                title="Next Move (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => { setIsPlaying(false); setCurrentStep(positions.length - 1); }}
                disabled={currentStep >= positions.length - 1}
                size="sm"
                variant="outline"
                className="h-9 px-2.5 border-slate-800 hover:bg-slate-800 text-slate-300"
                title="End (End)"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs font-mono font-bold text-slate-400">
              Move <span className="text-emerald-400">{currentStep}</span> / {positions.length - 1}
            </div>
          </div>
        </div>

        {/* Right Column: Move Table List */}
        <div className="lg:col-span-4 w-full">
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-800 bg-slate-950/40">
              <CardTitle className="text-base font-bold text-white">
                Move List ({moves.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[420px] pr-2">
                <div className="grid grid-cols-1 gap-1 text-xs font-mono">
                  {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                    const whiteIdx = i * 2 + 1;
                    const blackIdx = i * 2 + 2;
                    const whiteMove = moves[i * 2];
                    const blackMove = moves[i * 2 + 1];

                    const isWhiteActive = currentStep === whiteIdx;
                    const isBlackActive = currentStep === blackIdx;

                    return (
                      <div key={i} className="flex items-center p-1.5 rounded bg-slate-950/40">
                        <span className="w-8 text-slate-500 font-bold">{i + 1}.</span>
                        <button
                          onClick={() => { setIsPlaying(false); setCurrentStep(whiteIdx); }}
                          className={`w-20 text-left font-bold rounded px-1.5 py-0.5 transition-colors ${
                            isWhiteActive ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:text-white'
                          }`}
                        >
                          {whiteMove?.san}
                        </button>
                        {blackMove && (
                          <button
                            onClick={() => { setIsPlaying(false); setCurrentStep(blackIdx); }}
                            className={`w-20 text-left font-bold rounded px-1.5 py-0.5 transition-colors ${
                              isBlackActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {blackMove.san}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
