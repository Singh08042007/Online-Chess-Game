'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Home, Swords, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerColor: 'white' | 'black' | 'draw' | null;
  termination: string | null;
  userColor?: 'white' | 'black' | 'spectator';
  whiteRatingChange?: number;
  blackRatingChange?: number;
  onRematch?: () => void;
  onBackToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  winnerColor,
  termination,
  userColor = 'spectator',
  whiteRatingChange = 0,
  blackRatingChange = 0,
  onRematch,
  onBackToLobby,
}) => {
  const isDraw = winnerColor === 'draw';
  const isUserWinner = userColor !== 'spectator' && userColor === winnerColor;
  const isUserLoser = userColor !== 'spectator' && !isDraw && userColor !== winnerColor;

  const ratingChange = userColor === 'white' ? whiteRatingChange : userColor === 'black' ? blackRatingChange : 0;

  useEffect(() => {
    if (isOpen && isUserWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // confetti fallback
      }
    }
  }, [isOpen, isUserWinner]);

  const getTitle = () => {
    if (isDraw) return 'Game Drawn';
    if (isUserWinner) return 'Victory!';
    if (isUserLoser) return 'Defeat';
    return `${winnerColor === 'white' ? 'White' : 'Black'} Wins!`;
  };

  const getSubtitle = () => {
    const reason = termination ? `by ${termination}` : '';
    if (isDraw) return `Game ended in a draw ${reason}.`;
    return `${winnerColor === 'white' ? 'White' : 'Black'} is victorious ${reason}.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-2xl p-6 text-center">
        <DialogHeader className="flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
              isUserWinner
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-amber-900/40'
                : isUserLoser
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-900/40'
                : 'bg-gradient-to-tr from-slate-700 to-slate-600 text-slate-200'
            }`}
          >
            {isDraw ? <Swords className="w-8 h-8" /> : <Trophy className="w-9 h-9" />}
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight text-white">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-slate-400 capitalize mt-1">
            {getSubtitle()}
          </DialogDescription>
        </DialogHeader>

        {/* Rating adjustment banner */}
        {userColor !== 'spectator' && ratingChange !== 0 && (
          <div className="my-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-slate-300 font-medium">Rating Adjustment:</span>
            <span
              className={`font-mono font-bold text-base px-2 py-0.5 rounded ${
                ratingChange > 0
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}
            >
              {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          {onRematch && (
            <Button
              onClick={onRematch}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rematch
            </Button>
          )}
          <Button
            onClick={onBackToLobby}
            variant="outline"
            className="flex-1 bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 font-medium py-2.5"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
