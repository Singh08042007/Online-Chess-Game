'use client';

import React from 'react';
import { HandGesture } from '@/lib/hand-gesture/types';
import { ChessPiece } from '@/components/chess/ChessPiece';

interface HandBoardOverlayProps {
  hoveredSquare: string | null;
  grabbedSquare: string | null;
  legalMoves: string[];
  gesture: HandGesture;
  smoothedPosition: { x: number; y: number } | null;
  boardPosition?: { x: number; y: number } | null;
  boardMatrix: string[][];
  orientation?: 'white' | 'black';
  isHandPresent: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export const HandBoardOverlay: React.FC<HandBoardOverlayProps> = ({
  hoveredSquare,
  grabbedSquare,
  legalMoves,
  gesture,
  smoothedPosition,
  boardPosition,
  boardMatrix,
  orientation = 'white',
  isHandPresent,
}) => {
  if (!isHandPresent) return null;

  // Convert square ('e4') into row (0..7) and col (0..7)
  const getSquareGridPos = (sq: string) => {
    if (!sq || sq.length < 2) return null;
    let fileIdx = FILES.indexOf(sq[0]);
    let rankIdx = 8 - parseInt(sq[1], 10);

    if (orientation === 'black') {
      fileIdx = 7 - fileIdx;
      rankIdx = 7 - rankIdx;
    }

    if (fileIdx < 0 || rankIdx < 0) return null;
    return { col: fileIdx, row: rankIdx };
  };

  // Get piece type at grabbed square for floating ghost
  let grabbedPieceType: string | null = null;
  if (grabbedSquare) {
    const file = grabbedSquare.charCodeAt(0) - 97;
    const rank = parseInt(grabbedSquare[1], 10);
    const row = 8 - rank;
    grabbedPieceType = boardMatrix[row]?.[file] || null;
  }

  const isGrabbing = gesture === 'CLOSED_FIST' || gesture === 'PINCH';
  const hoveredPos = hoveredSquare ? getSquareGridPos(hoveredSquare) : null;
  const grabbedPos = grabbedSquare ? getSquareGridPos(grabbedSquare) : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-lg sm:rounded-xl">
      {/* 1. Grabbed Square Highlight */}
      {grabbedPos && (
        <div
          className="absolute border-2 border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-950/50 rounded transition-all animate-pulse"
          style={{
            left: `${grabbedPos.col * 12.5}%`,
            top: `${grabbedPos.row * 12.5}%`,
            width: '12.5%',
            height: '12.5%',
          }}
        />
      )}

      {/* 2. Legal Destination Indicators */}
      {grabbedSquare &&
        legalMoves.map((destSq) => {
          const pos = getSquareGridPos(destSq);
          if (!pos) return null;

          const isTargeted = hoveredSquare === destSq;

          return (
            <div
              key={destSq}
              className={`absolute flex items-center justify-center transition-all ${
                isTargeted ? 'scale-110' : 'scale-100'
              }`}
              style={{
                left: `${pos.col * 12.5}%`,
                top: `${pos.row * 12.5}%`,
                width: '12.5%',
                height: '12.5%',
              }}
            >
              {isTargeted ? (
                <div className="w-[88%] h-[88%] rounded-full border-4 border-emerald-400 bg-emerald-500/30 animate-pulse shadow-md" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-500/70 border border-emerald-300/80 shadow" />
              )}
            </div>
          );
        })}

      {/* 3. Hovered Target Square Ring */}
      {hoveredPos && !grabbedSquare && (
        <div
          className="absolute border-2 border-sky-400 bg-sky-500/15 rounded transition-all duration-75 shadow-lg shadow-sky-950/40"
          style={{
            left: `${hoveredPos.col * 12.5}%`,
            top: `${hoveredPos.row * 12.5}%`,
            width: '12.5%',
            height: '12.5%',
          }}
        />
      )}

      {/* 4. Floating Hand Cursor Tracker */}
      {(boardPosition || smoothedPosition) && (() => {
        const cursor = boardPosition || smoothedPosition!;
        return (
          <div
            className="absolute transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
            style={{
              left: `${Math.max(4, Math.min(96, cursor.x * 100))}%`,
              top: `${Math.max(4, Math.min(96, cursor.y * 100))}%`,
            }}
          >
            {/* Laser Reticle Ring */}
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-xl backdrop-blur-[1px] transition-all duration-100 ${
                isGrabbing
                  ? 'border-amber-400 bg-amber-500/30 scale-110 shadow-amber-950/60'
                  : 'border-emerald-400 bg-emerald-500/20 shadow-emerald-950/60'
              }`}
            >
            <span className="text-base select-none">
              {isGrabbing ? '✊' : gesture === 'OPEN_HAND' ? '🖐️' : '👆'}
            </span>
          </div>

          {/* Floating Grabbed Piece Ghost */}
          {grabbedSquare && grabbedPieceType && (
            <div className="w-8 h-8 -mt-2 animate-bounce opacity-90 drop-shadow-2xl">
              <ChessPiece type={grabbedPieceType} />
            </div>
          )}

          {/* Hovered Coordinate Tag */}
          <span className="text-[10px] font-mono font-bold bg-slate-950/90 border border-slate-700 text-emerald-300 px-1.5 py-0.5 rounded mt-0.5 shadow">
            {hoveredSquare || ''}
          </span>
        </div>
        );
      })()}
    </div>
  );
};
