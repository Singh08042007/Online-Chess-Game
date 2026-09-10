'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { ChessBoard } from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Chess } from 'chess.js';
import { chessJsToMatrix } from '@/lib/chess-utils';
import {
  Swords,
  Users,
  Bot,
  Trophy,
  History,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Animated demonstration chess board in hero
  const [demoChess] = useState(() => new Chess());
  const [demoBoard, setDemoBoard] = useState(() => chessJsToMatrix(demoChess));
  const [demoLastMove, setDemoLastMove] = useState<{ from: string; to: string } | null>(null);

  // Auto-play famous demo opening moves in loop
  useEffect(() => {
    const famousMoves = [
      { from: 'e2', to: 'e4' },
      { from: 'e7', to: 'e5' },
      { from: 'g1', to: 'f3' },
      { from: 'b8', to: 'c6' },
      { from: 'f1', to: 'c4' },
      { from: 'g8', to: 'f6' },
      { from: 'd2', to: 'd4' },
      { from: 'e5', to: 'd4' },
    ];

    let moveIdx = 0;
    const interval = setInterval(() => {
      if (moveIdx >= famousMoves.length) {
        demoChess.reset();
        moveIdx = 0;
      } else {
        const m = famousMoves[moveIdx];
        demoChess.move(m);
        setDemoLastMove(m);
        moveIdx++;
      }
      setDemoBoard(chessJsToMatrix(demoChess));
    }, 2400);

    return () => clearInterval(interval);
  }, [demoChess]);

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-950 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left: Hero Headline & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              Tournament-Grade Real-Time Chess
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Play Chess.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                Compete.
              </span>{' '}
              Improve.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Step into the modern online chess arena. Challenge opponents in real-time rated matches,
              track your FIDE ELO rating, replay classic matches, or train against adaptive chess engines.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link href="/play" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-12 px-7 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-950/60 transition-all hover:scale-[1.02]">
                  <Swords className="w-5 h-5 mr-2" />
                  Play Online Now
                </Button>
              </Link>

              <Link href="/local?mode=hand" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-base shadow-xl shadow-teal-950/60 transition-all hover:scale-[1.02]">
                  <span className="text-lg mr-1.5">🖐️</span>
                  Play with Hand Gestures
                </Button>
              </Link>

              <Link href="/local" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-6 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold text-base">
                  <Bot className="w-5 h-5 mr-2 text-teal-400" />
                  Practice vs Bot
                </Button>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Latency Supabase Realtime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>🖐️ Webcam Hand-Gesture Control</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>FIDE Authoritative Rules</span>
              </div>
            </div>
          </div>

          {/* Right: Live Interactive Demo Board */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-3xl blur-md opacity-25 group-hover:opacity-40 transition duration-500" />
              <div className="relative w-full max-w-[320px] sm:max-w-[420px] aspect-square">
                <ChessBoard
                  board={demoBoard}
                  onMove={() => {}}
                  canMakeMove={false}
                  calculatePossibleMoves={() => []}
                  lastMove={demoLastMove}
                  orientation="white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Demonstration Board</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK GAME MODES CARDS */}
      <section className="py-12 bg-slate-900/40 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Choose Your Game Mode
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Select how you want to play today. Whether competing for ELO, training with AI, or using touchless hand tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Mode 1: Hand Gestures AI */}
            <Card
              onClick={() => router.push('/local?mode=hand')}
              className="bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-900 border-emerald-500/50 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/50 group relative overflow-hidden ring-1 ring-emerald-500/30"
            >
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                New Mode
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-2xl shadow-inner">
                🖐️
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Hand Gestures AI
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Control pieces touchless with your webcam! Point ☝️ to aim, fist ✊ to grab, open 🖐️ to drop.
              </p>
              <div className="mt-3 flex items-center text-xs font-bold text-emerald-400 gap-1">
                Play Hand Mode <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Mode 2: Multiplayer */}
            <Card
              onClick={() => router.push('/play')}
              className="bg-slate-900/80 border-slate-800 hover:border-emerald-500/60 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/20 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Swords className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Play Online
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Create a room or match with open players. Real-time board sync with countdown chess clocks.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-emerald-400 gap-1">
                Enter Lobby <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Mode 3: Play vs AI */}
            <Card
              onClick={() => router.push('/local')}
              className="bg-slate-900/80 border-slate-800 hover:border-teal-500/60 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-950/20 group"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">
                Play vs Bot
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Train your tactics against 3 difficulty levels: Casual, Club Player, and Master engine.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-teal-400 gap-1">
                Start Training <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Mode 4: Pass & Play */}
            <Card
              onClick={() => router.push('/local')}
              className="bg-slate-900/80 border-slate-800 hover:border-amber-500/60 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/20 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                Pass & Play
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Play side-by-side with a friend on one computer or tablet with full legal move validation.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-amber-400 gap-1">
                Play Local <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Mode 5: Leaderboard */}
            <Card
              onClick={() => router.push('/leaderboard')}
              className="bg-slate-900/80 border-slate-800 hover:border-yellow-500/60 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-950/20 group"
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">
                Leaderboards
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Compete for the top rankings, view grandmaster profiles, win rates, and career ratings.
              </p>
              <div className="mt-3 flex items-center text-xs font-semibold text-yellow-400 gap-1">
                View Rankings <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES SPOTLIGHT */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Instant Move Synchronization</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Powered by Supabase Realtime channels. Every piece slide, capture, promotion, and check is broadcast authoritative to both screens in milliseconds.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">FIDE Standard Elo Calculation</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every completed rated match dynamically adjusts your chess rating using standard K-factor=32 Elo mathematics, stored authoritatively in PostgreSQL.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center border border-teal-800">
              <History className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Step-by-Step Replay Engine</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Inspect any completed match move-by-move. Step through opening decisions, tactical blunders, and brilliant endgames with keyboard arrow controls.
            </p>
          </div>
        </div>
      </section>

      {/* MODERN FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">♞</span>
            <span className="font-bold text-slate-300">Chess Arena</span>
            <span>— Full-Stack Online Chess Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/play" className="hover:text-slate-300">Play Online</Link>
            <Link href="/local" className="hover:text-slate-300">Pass & Play</Link>
            <Link href="/history" className="hover:text-slate-300">Archive</Link>
            <Link href="/leaderboard" className="hover:text-slate-300">Leaderboard</Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
