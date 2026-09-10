'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSupabaseChess } from '@/hooks/useSupabaseChess';
import { ChessBoard } from '@/components/ChessBoard';
import { PlayerCard } from '@/components/chess/PlayerCard';
import { GameOverModal } from '@/components/chess/GameOverModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Flag,
  Handshake,
  RotateCcw,
  Copy,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Share2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.id as string)?.toUpperCase();
  const { user, profile, guestName } = useAuth();

  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [resignModalOpen, setResignModalOpen] = useState(false);
  const [customOrientation, setCustomOrientation] = useState<'white' | 'black' | null>(null);

  const {
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
    promotionSquare,
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
  } = useSupabaseChess({
    roomCode,
    userId: user?.id || null,
    userName: profile?.display_name || profile?.username || guestName,
    userAvatar: profile?.avatar_url || null,
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success('Room code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Game link copied to clipboard!');
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  // Determine board orientation (default to player's color, or White if spectator)
  const orientation = customOrientation ?? (playerRole === 'black' ? 'black' : 'white');

  const flipBoard = () => {
    setCustomOrientation((prev) => {
      const current = prev ?? (playerRole === 'black' ? 'black' : 'white');
      return current === 'white' ? 'black' : 'white';
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-slate-400 font-medium animate-pulse">Connecting to Chess Arena room...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
        <p className="text-slate-400 max-w-md mb-6">{error || 'Unable to join game room.'}</p>
        <Button
          onClick={() => router.push('/play')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
        >
          Return to Matchmaking Lobby
        </Button>
      </div>
    );
  }

  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout'].includes(game.status);
  const isWhite = orientation === 'white';

  // Top player is the opponent, bottom player is the current user or active perspective
  const topPlayer = isWhite
    ? {
        name: game.black_player_name || 'Waiting for opponent...',
        color: 'black' as const,
        time: blackTime,
        captured: capturedStats.capturedByBlack,
        materialDiff: capturedStats.blackMaterialDiff,
        isTurn: game.current_turn === 'black' && game.status === 'active',
      }
    : {
        name: game.white_player_name || 'Waiting for opponent...',
        color: 'white' as const,
        time: whiteTime,
        captured: capturedStats.capturedByWhite,
        materialDiff: capturedStats.whiteMaterialDiff,
        isTurn: game.current_turn === 'white' && game.status === 'active',
      };

  const bottomPlayer = isWhite
    ? {
        name: game.white_player_name || (user ? profile?.display_name || profile?.username || 'You' : guestName),
        color: 'white' as const,
        time: whiteTime,
        captured: capturedStats.capturedByWhite,
        materialDiff: capturedStats.whiteMaterialDiff,
        isTurn: game.current_turn === 'white' && game.status === 'active',
      }
    : {
        name: game.black_player_name || (user ? profile?.display_name || profile?.username || 'You' : guestName),
        color: 'black' as const,
        time: blackTime,
        captured: capturedStats.capturedByBlack,
        materialDiff: capturedStats.blackMaterialDiff,
        isTurn: game.current_turn === 'black' && game.status === 'active',
      };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 flex flex-col">
      {/* Waiting for Opponent Header Banner */}
      {game.status === 'waiting' && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">Waiting for Opponent to Join</h3>
              <p className="text-slate-400 text-xs">Share your room code with a friend to begin playing.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-lg text-emerald-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              {roomCode}
            </span>
            <Button onClick={handleCopyCode} size="sm" variant="secondary" className="gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button onClick={handleShareLink} size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* Draw Offer Notification Banner */}
      {game.draw_offered_by && game.draw_offered_by !== playerRole && playerRole !== 'spectator' && (
        <div className="mb-4 p-4 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-amber-200">
            <Handshake className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold">Your opponent has offered a draw. Do you accept?</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={acceptDraw} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Accept Draw
            </Button>
            <Button onClick={declineDraw} size="sm" variant="outline" className="border-amber-700 text-amber-300 hover:bg-amber-900/50">
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Main Game Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left / Center Column: Chessboard & Player Cards */}
        <div className="lg:col-span-8 flex flex-col items-center gap-2 sm:gap-3 w-full max-w-[580px] mx-auto">
          {/* Top Player Card */}
          <div className="w-full">
            <PlayerCard
              name={topPlayer.name}
              color={topPlayer.color}
              timeSeconds={topPlayer.time}
              isActiveTurn={topPlayer.isTurn}
              capturedPieces={topPlayer.captured}
              materialDifference={topPlayer.materialDiff}
              isCurrentUser={playerRole === topPlayer.color}
            />
          </div>

          {/* Interactive Chess Board */}
          <div className="w-full flex justify-center py-1">
            <ChessBoard
              board={board}
              onMove={makeMove}
              canMakeMove={isMyTurn}
              calculatePossibleMoves={calculatePossibleMoves}
              promotionPending={promotionPending}
              promotionSquare={promotionSquare}
              onPromotion={handlePromotion}
              isCheck={isCheck}
              currentTurn={currentTurn}
              lastMove={lastMove}
              orientation={orientation}
            />
          </div>

          {/* Bottom Player Card */}
          <div className="w-full">
            <PlayerCard
              name={bottomPlayer.name}
              color={bottomPlayer.color}
              timeSeconds={bottomPlayer.time}
              isActiveTurn={bottomPlayer.isTurn}
              capturedPieces={bottomPlayer.captured}
              materialDifference={bottomPlayer.materialDiff}
              isCurrentUser={playerRole === bottomPlayer.color}
            />
          </div>

          {/* In-Game Action Bar */}
          <div className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Turn: <strong className="capitalize text-slate-200">{currentTurn}</strong>
              </span>
              {isCheck && (
                <span className="text-xs font-black px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 animate-pulse">
                  CHECK!
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={flipBoard}
                size="sm"
                variant="ghost"
                className="h-8 px-2.5 text-xs text-slate-400 hover:text-white"
                title="Flip board orientation"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Flip
              </Button>

              {playerRole !== 'spectator' && game.status === 'active' && (
                <>
                  <Button
                    onClick={offerDraw}
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                    disabled={Boolean(game.draw_offered_by)}
                  >
                    <Handshake className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Offer Draw
                  </Button>

                  <Button
                    onClick={() => setResignModalOpen(true)}
                    size="sm"
                    variant="destructive"
                    className="h-8 px-2.5 text-xs bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200"
                  >
                    <Flag className="w-3.5 h-3.5 mr-1" />
                    Resign
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Game Controls (Moves, Chat, Game Info) */}
        <div className="lg:col-span-4 w-full">
          <Card className="bg-slate-900/90 border-slate-800/90 shadow-xl overflow-hidden">
            <Tabs defaultValue="moves" className="w-full">
              <CardHeader className="p-3 border-b border-slate-800 bg-slate-950/60">
                <TabsList className="grid w-full grid-cols-3 bg-slate-900">
                  <TabsTrigger value="moves" className="text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Moves ({moves.length})
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Live Chat
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    Room Info
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-4">
                {/* TAB 1: MOVES HISTORY */}
                <TabsContent value="moves" className="mt-0 space-y-2">
                  <ScrollArea className="h-[360px] sm:h-[420px] w-full pr-3">
                    {moves.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                        <span className="text-3xl mb-2">♟</span>
                        <p className="text-xs font-medium">No moves played yet.</p>
                        <p className="text-[11px] text-slate-600">Moves will appear here as the game progresses.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1 text-sm font-mono">
                        {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => {
                          const whiteMove = moves[i * 2];
                          const blackMove = moves[i * 2 + 1];
                          return (
                            <div
                              key={i}
                              className={`flex items-center p-1.5 rounded text-xs ${
                                i % 2 === 0 ? 'bg-slate-950/40' : 'bg-transparent'
                              }`}
                            >
                              <span className="w-8 text-slate-500 font-bold">{i + 1}.</span>
                              <span className="w-24 font-bold text-slate-200">
                                {whiteMove ? whiteMove.san : ''}
                              </span>
                              <span className="w-24 font-bold text-slate-400">
                                {blackMove ? blackMove.san : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* TAB 2: LIVE CHAT */}
                <TabsContent value="chat" className="mt-0 flex flex-col h-[360px] sm:h-[420px]">
                  <ScrollArea className="flex-1 pr-3 mb-3">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center">
                        <p className="text-xs">No chat messages yet.</p>
                        <p className="text-[11px] text-slate-600">Send a good luck message to your opponent!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((msg) => {
                          const isMine = msg.sender_id === user?.id || msg.sender_name === (profile?.display_name || guestName);
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col text-xs p-2 rounded-lg max-w-[85%] ${
                                isMine
                                  ? 'ml-auto bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
                                  : 'mr-auto bg-slate-800/80 text-slate-200 border border-slate-700/60'
                              }`}
                            >
                              <span className="font-bold text-[10px] text-slate-400 mb-0.5">{msg.sender_name}</span>
                              <p className="break-words">{msg.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-slate-800">
                    <Input
                      type="text"
                      placeholder="Say something nice..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      maxLength={120}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-100 focus:border-emerald-500"
                    />
                    <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 px-3">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </TabsContent>

                {/* TAB 3: ROOM INFO */}
                <TabsContent value="info" className="mt-0 space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Room Code</span>
                      <span className="font-mono font-bold text-emerald-400">{roomCode}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Status</span>
                      <span className="capitalize font-semibold text-slate-200">{game.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Time Control</span>
                      <span className="font-semibold text-slate-200">{game.time_control_minutes} min Rapid</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Rated Game</span>
                      <span className="font-semibold text-slate-200">{game.is_rated ? 'Yes (ELO affected)' : 'Casual'}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/play')}
                    variant="outline"
                    className="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Return to Lobby
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Resignation Confirmation Dialog */}
      <Dialog open={resignModalOpen} onOpenChange={setResignModalOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" />
              Confirm Resignation
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Are you sure you want to forfeit this match? Your opponent will be awarded victory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setResignModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setResignModalOpen(false);
                resignGame();
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Resign Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Over Modal with celebration & ELO */}
      <GameOverModal
        isOpen={isGameOver}
        onClose={() => {}}
        winnerColor={game.winner_color}
        termination={game.termination}
        userColor={playerRole}
        whiteRatingChange={game.white_rating_change}
        blackRatingChange={game.black_rating_change}
        onRematch={() => router.push('/play')}
        onBackToLobby={() => router.push('/play')}
      />
    </div>
  );
}
