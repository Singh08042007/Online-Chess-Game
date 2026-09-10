'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase, GameRecord } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  History,
  Trophy,
  Play,
  Calendar,
  Clock,
  Swords,
  Loader2,
  Award,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { user, profile } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('games')
          .select('*')
          .in('status', ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'abandoned'])
          .order('finished_at', { ascending: false })
          .limit(30);

        if (user?.id) {
          // Fetch games where user participated
          query = supabase
            .from('games')
            .select('*')
            .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
            .in('status', ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'abandoned'])
            .order('finished_at', { ascending: false })
            .limit(30);
        }

        const { data, error } = await query;
        if (data && !error) {
          setGames(data as GameRecord[]);
        }
      } catch (err) {
        console.error('Fetch game history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user?.id]);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-emerald-400" />
            Game History & Archive
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review completed matches, inspect move logs, and launch step-by-step game replays.
          </p>
        </div>

        <Link href="/play">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            <Swords className="w-4 h-4 mr-2" />
            Play New Match
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-slate-400 text-sm">Loading match history...</p>
        </div>
      ) : games.length === 0 ? (
        <Card className="bg-slate-900/80 border-slate-800 p-12 text-center">
          <span className="text-4xl mb-3 block">📜</span>
          <h3 className="text-lg font-bold text-white mb-1">No Completed Matches Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
            Play rated multiplayer matches to build up your history and inspect interactive replays.
          </p>
          <Link href="/play">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              Find a Match
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map((g) => {
            const isUserWhite = user && g.white_player_id === user.id;
            const isUserBlack = user && g.black_player_id === user.id;
            const isUserInGame = isUserWhite || isUserBlack;

            let outcome: 'Victory' | 'Defeat' | 'Draw' = 'Draw';
            let outcomeColor = 'bg-slate-800 text-slate-300 border-slate-700';

            if (g.winner_color === 'draw' || g.status === 'stalemate' || g.status === 'draw') {
              outcome = 'Draw';
              outcomeColor = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
            } else if (isUserInGame) {
              const won = (isUserWhite && g.winner_color === 'white') || (isUserBlack && g.winner_color === 'black');
              outcome = won ? 'Victory' : 'Defeat';
              outcomeColor = won
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                : 'bg-red-950/80 text-red-300 border-red-800/80';
            } else {
              outcome = g.winner_color === 'white' ? 'Victory' : 'Victory';
              outcomeColor = 'bg-slate-800 text-slate-300 border-slate-700';
            }

            const ratingChange = isUserWhite ? g.white_rating_change : isUserBlack ? g.black_rating_change : 0;

            const opponentName = isUserWhite
              ? g.black_player_name || 'Anonymous'
              : g.white_player_name || 'Anonymous';

            return (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm"
              >
                {/* Left: Result & Match info */}
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${outcomeColor}`}>
                    {outcome}
                  </span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-200">
                        {isUserInGame ? `vs ${opponentName}` : `${g.white_player_name || 'White'} vs ${g.black_player_name || 'Black'}`}
                      </span>
                      {g.is_rated && isUserInGame && ratingChange !== 0 && (
                        <span
                          className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            ratingChange > 0 ? 'text-emerald-400 bg-emerald-950' : 'text-red-400 bg-red-950'
                          }`}
                        >
                          {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="capitalize">{g.termination || g.status}</span>
                      <span>•</span>
                      <span>{g.time_control_minutes} min</span>
                      <span>•</span>
                      <span>{g.created_at ? format(new Date(g.created_at), 'MMM dd, yyyy') : 'Recent'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Replay Button */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link href={`/game/${g.room_code}/replay`}>
                    <Button size="sm" variant="outline" className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200 gap-1.5">
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      Replay Game
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
