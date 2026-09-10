'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase, Profile } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Trophy, Medal, Search, Crown, Sparkles, Loader2 } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('rating', { ascending: false })
          .limit(100);

        if (data && !error) {
          setProfiles(data as Profile[]);
        }
      } catch (err) {
        console.error('Fetch leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredProfiles = profiles.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = filteredProfiles.slice(0, 3);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Global Grandmaster Rankings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Top competitive chess players ranked by standard FIDE Elo rating.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-slate-100 focus:border-emerald-500 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-slate-400 text-sm">Fetching global rankings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {topThree.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* 2nd Place */}
              <Card className="order-2 md:order-1 bg-slate-900/80 border-slate-800 flex flex-col items-center p-6 text-center shadow-lg relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 font-bold flex items-center justify-center mb-3">
                  #2
                </div>
                <Avatar className="w-16 h-16 border-2 border-slate-400 mb-2">
                  <AvatarImage src={topThree[1].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${topThree[1].username}`} />
                  <AvatarFallback>{topThree[1].username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h4 className="font-bold text-slate-100">{topThree[1].display_name || topThree[1].username}</h4>
                <span className="text-xs text-slate-400">@{topThree[1].username}</span>
                <span className="text-xl font-black text-amber-400 mt-2 font-mono">{topThree[1].rating} ELO</span>
              </Card>

              {/* 1st Place Champion */}
              <Card className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 flex flex-col items-center p-6 text-center shadow-xl relative overflow-hidden ring-1 ring-amber-500/50 md:-translate-y-2">
                <div className="absolute top-2 right-2 text-amber-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center mb-3">
                  #1
                </div>
                <Avatar className="w-20 h-20 border-4 border-amber-400 mb-2 shadow-lg shadow-amber-950/50">
                  <AvatarImage src={topThree[0].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${topThree[0].username}`} />
                  <AvatarFallback>{topThree[0].username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h4 className="font-bold text-lg text-white">{topThree[0].display_name || topThree[0].username}</h4>
                <span className="text-xs text-amber-300">Champion Grandmaster</span>
                <span className="text-2xl font-black text-amber-400 mt-2 font-mono">{topThree[0].rating} ELO</span>
              </Card>

              {/* 3rd Place */}
              <Card className="order-3 bg-slate-900/80 border-slate-800 flex flex-col items-center p-6 text-center shadow-lg relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-amber-800/20 text-amber-600 font-bold flex items-center justify-center mb-3">
                  #3
                </div>
                <Avatar className="w-16 h-16 border-2 border-amber-700 mb-2">
                  <AvatarImage src={topThree[2].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${topThree[2].username}`} />
                  <AvatarFallback>{topThree[2].username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h4 className="font-bold text-slate-100">{topThree[2].display_name || topThree[2].username}</h4>
                <span className="text-xs text-slate-400">@{topThree[2].username}</span>
                <span className="text-xl font-black text-amber-400 mt-2 font-mono">{topThree[2].rating} ELO</span>
              </Card>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold w-14">Rank</th>
                    <th className="py-3.5 px-4 font-bold">Player</th>
                    <th className="py-3.5 px-4 font-bold text-right">Rating</th>
                    <th className="py-3.5 px-4 font-bold text-right hidden sm:table-cell">Games</th>
                    <th className="py-3.5 px-4 font-bold text-right hidden sm:table-cell">Wins</th>
                    <th className="py-3.5 px-4 font-bold text-right hidden md:table-cell">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No players found matching &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p, index) => {
                      const isCurrentUser = user && p.id === user.id;
                      const winRate = p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0;
                      const rank = index + 1;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isCurrentUser ? 'bg-emerald-950/40 font-semibold' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 font-bold">
                            {rank === 1 ? (
                              <span className="text-amber-400">🥇 1</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-300">🥈 2</span>
                            ) : rank === 3 ? (
                              <span className="text-amber-600">🥉 3</span>
                            ) : (
                              <span className="text-slate-500 font-mono">#{rank}</span>
                            )}
                          </td>

                          {/* Player */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 border border-slate-700 bg-slate-800">
                                <AvatarImage src={p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`} />
                                <AvatarFallback>{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-slate-100 font-bold truncate max-w-[140px] sm:max-w-[200px]">
                                  {p.display_name || p.username}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-[10px] text-emerald-400 font-semibold uppercase bg-emerald-950 px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-400">@{p.username}</span>
                              </div>
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                            {p.rating}
                          </td>

                          {/* Games */}
                          <td className="py-3.5 px-4 text-right text-slate-300 hidden sm:table-cell font-mono">
                            {p.games_played}
                          </td>

                          {/* Wins */}
                          <td className="py-3.5 px-4 text-right text-emerald-400 hidden sm:table-cell font-mono">
                            {p.wins}
                          </td>

                          {/* Win Rate */}
                          <td className="py-3.5 px-4 text-right text-slate-300 hidden md:table-cell font-mono">
                            {winRate}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
