'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, GameRecord } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Swords,
  PlusCircle,
  LogIn,
  Users,
  Clock,
  Trophy,
  Sparkles,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
const TIME_CONTROLS = [
  { label: 'Blitz', minutes: 3 },
  { label: 'Blitz', minutes: 5 },
  { label: 'Rapid', minutes: 10 },
  { label: 'Rapid', minutes: 15 },
];

export default function PlayLobbyPage() {
  const router = useRouter();
  const { user, profile, guestName } = useAuth();

  const [joinCode, setJoinCode] = useState('');
  const [timeControl, setTimeControl] = useState<number>(10); // in minutes
  const [isRated, setIsRated] = useState<boolean>(true);
  const [sidePreference, setSidePreference] = useState<'white' | 'black' | 'random'>('random');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [openGames, setOpenGames] = useState<GameRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Generate 6-char alphanumeric room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Fetch waiting games
  const fetchOpenGames = async () => {
    try {
      setLoadingGames(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        setOpenGames(data as GameRecord[]);
      }
    } catch (err) {
      console.error('Error fetching open games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchOpenGames();

    // Subscribe to new waiting games
    const channel = supabase
      .channel('lobby_open_games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: 'status=eq.waiting',
        },
        () => {
          fetchOpenGames();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create new multiplayer match
  const handleCreateGame = async () => {
    try {
      setCreating(true);
      const roomCode = generateRoomCode();
      const playerName = profile?.display_name || profile?.username || guestName;
      const playerId = user?.id || null;

      let chosenColor = sidePreference;
      if (chosenColor === 'random') {
        chosenColor = Math.random() < 0.5 ? 'white' : 'black';
      }

      const isWhite = chosenColor === 'white';

      const { data, error } = await supabase
        .from('games')
        .insert({
          room_code: roomCode,
          white_player_id: isWhite ? playerId : null,
          white_player_name: isWhite ? playerName : null,
          black_player_id: !isWhite ? playerId : null,
          black_player_name: !isWhite ? playerName : null,
          status: 'waiting',
          current_turn: 'white',
          time_control_minutes: timeControl,
          white_time_seconds: timeControl * 60,
          black_time_seconds: timeControl * 60,
          is_rated: isRated,
        })
        .select('*')
        .single();

      if (error) {
        toast.error(error.message || 'Failed to create game room.');
        setCreating(false);
        return;
      }

      toast.success(`Room ${roomCode} created!`);
      router.push(`/game/${roomCode}`);
    } catch (err) {
      console.error('Create game error:', err);
      toast.error('An unexpected error occurred.');
      setCreating(false);
    }
  };

  // Join match by room code
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setJoining(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('room_code', cleanCode)
        .single();

      if (error || !data) {
        toast.error('Room code not found. Please verify the code.');
        setJoining(false);
        return;
      }

      router.push(`/game/${cleanCode}`);
    } catch (err) {
      toast.error('Failed to join game.');
      setJoining(false);
    }
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Swords className="w-8 h-8 text-emerald-400" />
            Play Online
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Challenge players worldwide with real-time ratings, clocks, and authoritative FIDE rules.
          </p>
        </div>

        {profile && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Current Rating</span>
              <span className="text-lg font-black text-amber-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                {profile.rating}
              </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Win Rate</span>
              <span className="text-lg font-bold text-emerald-400">
                {profile.games_played > 0
                  ? `${Math.round((profile.wins / profile.games_played) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Create & Join Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create Match Card */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Host a Match Room
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Configure your preferred chess rules and time controls
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-5">
              {/* Time Control Options */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Time Control</Label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_CONTROLS.map((tc) => (
                    <button
                      key={tc.minutes}
                      type="button"
                      onClick={() => setTimeControl(tc.minutes)}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border text-xs font-bold transition-all ${
                        timeControl === tc.minutes
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-black text-emerald-400">{tc.minutes}m</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">{tc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Side Preference */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-300">Side Preference</Label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                  {[
                    { key: 'white', label: 'Play White', icon: '♔' },
                    { key: 'random', label: 'Random Side', icon: '☯' },
                    { key: 'black', label: 'Play Black', icon: '♚' },
                  ].map((side) => (
                    <button
                      key={side.key}
                      type="button"
                      onClick={() => setSidePreference(side.key as 'white' | 'black' | 'random')}
                      className={`flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all ${
                        sidePreference === side.key
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm sm:text-base">{side.icon}</span>
                      <span className="truncate">{side.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rated Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Rated Match
                  </span>
                  <span className="text-[11px] text-slate-400">Updates player ELO ratings upon completion</span>
                </div>
                <input
                  type="checkbox"
                  checked={isRated}
                  onChange={(e) => setIsRated(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              <Button
                onClick={handleCreateGame}
                disabled={creating}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 text-sm shadow-lg shadow-emerald-950/50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {creating ? 'Creating Room...' : 'Create Match Room'}
              </Button>
            </CardContent>
          </Card>

          {/* Join Match by Code Card */}
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl p-5">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-teal-400" />
              Join via Room Code
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the 6-character room code shared by your friend to jump directly into the game.
            </p>
            <form onSubmit={handleJoinGame} className="flex gap-2">
              <Input
                type="text"
                maxLength={6}
                placeholder="e.g. CH7X92"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 font-mono tracking-wider uppercase text-slate-100 focus:border-emerald-500"
              />
              <Button
                type="submit"
                disabled={joining || joinCode.trim().length < 4}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-5"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Game'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Open Games Browser */}
        <div className="lg:col-span-5">
          <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden h-full flex flex-col">
            <CardHeader className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Open Waiting Matches
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  Live players waiting for an opponent
                </CardDescription>
              </div>
              <button
                onClick={fetchOpenGames}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Refresh list"
              >
                <RefreshCw className={`w-4 h-4 ${loadingGames ? 'animate-spin' : ''}`} />
              </button>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col">
              {loadingGames ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <span className="text-xs text-slate-400">Scanning for open matches...</span>
                </div>
              ) : openGames.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <span className="text-3xl mb-2">♖</span>
                  <p className="text-xs font-semibold">No open games right now.</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Create a room above and be the first to host!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {openGames.map((g) => {
                    const hostName = g.white_player_name || g.black_player_name || 'Anonymous';
                    const hostSide = g.white_player_name ? 'White' : 'Black';
                    return (
                      <div
                        key={g.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 flex items-center justify-between transition-colors shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-200">{hostName}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{g.time_control_minutes} min</span>
                            <span>•</span>
                            <span>Playing as {hostSide}</span>
                            {g.is_rated && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-semibold">Rated</span>
                              </>
                            )}
                          </span>
                        </div>
                        <Button
                          onClick={() => router.push(`/game/${g.room_code}`)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5"
                        >
                          Play Now
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
