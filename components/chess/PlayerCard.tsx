'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatClock } from '@/lib/chess-utils';
import { ChessPiece } from './ChessPiece';
import { Clock, Trophy } from 'lucide-react';

interface PlayerCardProps {
  name: string;
  avatarUrl?: string | null;
  rating?: number;
  color: 'white' | 'black';
  timeSeconds: number;
  isActiveTurn: boolean;
  capturedPieces: string[];
  materialDifference: number;
  isCurrentUser?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  avatarUrl,
  rating,
  color,
  timeSeconds,
  isActiveTurn,
  capturedPieces,
  materialDifference,
  isCurrentUser = false,
}) => {
  const isWhite = color === 'white';
  const isLowTime = timeSeconds <= 30 && timeSeconds > 0;
  const isCriticalTime = timeSeconds <= 10 && timeSeconds > 0;

  return (
    <div
      className={`relative flex items-center justify-between p-2.5 sm:p-4 rounded-xl transition-all duration-300 border ${
        isActiveTurn
          ? 'bg-slate-900/95 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
          : 'bg-slate-900/60 border-slate-800/80'
      }`}
    >
      {/* Left: Player Avatar, Name, Rating */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="w-9 h-9 sm:w-12 sm:h-12 border-2 border-slate-700 bg-slate-800 shadow-md">
            <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`} alt={name} />
            <AvatarFallback className="bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Piece side indicator pip */}
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 shadow ${
              isWhite ? 'bg-slate-100' : 'bg-slate-900 border-slate-500'
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm sm:text-base text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
              {name}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                You
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-0.5 text-amber-400 font-medium">
              <Trophy className="w-3 h-3" />
              {rating ?? 1200}
            </span>
            <span className="text-slate-600">•</span>
            <span className="capitalize">{color}</span>
          </div>

          {/* Captured Pieces tray */}
          <div className="flex items-center gap-0.5 mt-1.5 h-5 flex-wrap">
            {capturedPieces.map((piece, i) => (
              <div key={i} className="w-4 h-4 -mr-1">
                <ChessPiece type={piece} />
              </div>
            ))}
            {materialDifference > 0 && (
              <span className="ml-1 text-[11px] font-bold text-emerald-400">
                +{materialDifference}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Clock */}
      <div
        className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 rounded-lg font-mono font-bold text-sm sm:text-xl shrink-0 transition-all shadow-inner border ${
          isCriticalTime
            ? 'bg-red-950/80 text-red-300 border-red-700 animate-pulse'
            : isLowTime
            ? 'bg-amber-950/70 text-amber-300 border-amber-700'
            : isActiveTurn
            ? 'bg-slate-950 text-emerald-400 border-emerald-600/60'
            : 'bg-slate-950/80 text-slate-400 border-slate-800'
        }`}
      >
        <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActiveTurn ? 'text-emerald-400 animate-spin-slow' : 'text-slate-500'}`} />
        <span>{formatClock(timeSeconds)}</span>
      </div>
    </div>
  );
};
