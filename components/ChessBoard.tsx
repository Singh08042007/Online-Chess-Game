'use client';

import React, { useState } from 'react';
import { ChessPiece } from './chess/ChessPiece';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { soundManager } from '@/lib/audio';

interface ChessBoardProps {
  board: string[][]; // 8x8 matrix where row 0 is rank 8, row 7 is rank 1
  onMove: (from: string, to: string) => void;
  canMakeMove: boolean;
  calculatePossibleMoves: (position: string) => string[];
  promotionPending?: boolean;
  promotionSquare?: string | null;
  onPromotion?: (piece: string) => void;
  isCheck?: boolean;
  currentTurn?: 'white' | 'black';
  lastMove?: { from: string; to: string } | null;
  orientation?: 'white' | 'black';
}

const PromotionDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPromotion: (piece: string) => void;
  color: 'white' | 'black';
}> = ({ isOpen, onClose, onPromotion, color }) => {
  const pieces = color === 'white' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs bg-slate-900 border-slate-800 text-slate-100 p-6 text-center">
        <DialogTitle className="text-xl font-bold text-white mb-1">Pawn Promotion</DialogTitle>
        <DialogDescription className="text-xs text-slate-400 mb-4">
          Choose a piece to promote your pawn
        </DialogDescription>
        <div className="grid grid-cols-4 gap-2">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onPromotion(piece)}
              className="aspect-square flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/80 border border-slate-700 hover:border-emerald-500 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              <ChessPiece type={piece} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({
  board,
  onMove,
  canMakeMove,
  calculatePossibleMoves,
  promotionPending = false,
  promotionSquare = null,
  onPromotion = () => {},
  isCheck = false,
  currentTurn = 'white',
  lastMove = null,
  orientation = 'white',
}) => {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  const isFlipped = orientation === 'black';

  // Files and Ranks depending on orientation
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getPieceAtPosition = (pos: string): string => {
    const col = pos.charCodeAt(0) - 97;
    const row = 8 - parseInt(pos[1]);
    if (board && board[row] && board[row][col] !== undefined) {
      return board[row][col];
    }
    return '';
  };

  const handleSquareClick = (position: string) => {
    if (!canMakeMove) {
      setSelectedPiece(null);
      setPossibleMoves([]);
      return;
    }

    if (selectedPiece) {
      if (possibleMoves.includes(position)) {
        onMove(selectedPiece, position);
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else {
        const pieceAtSquare = getPieceAtPosition(position);
        const isOwnPiece = pieceAtSquare && (
          (currentTurn === 'white' && pieceAtSquare === pieceAtSquare.toUpperCase()) ||
          (currentTurn === 'black' && pieceAtSquare === pieceAtSquare.toLowerCase())
        );

        if (isOwnPiece) {
          setSelectedPiece(position);
          const moves = calculatePossibleMoves(position);
          setPossibleMoves(moves);
        } else {
          setSelectedPiece(null);
          setPossibleMoves([]);
        }
      }
    } else {
      const pieceAtSquare = getPieceAtPosition(position);
      const isOwnPiece = pieceAtSquare && (
        (currentTurn === 'white' && pieceAtSquare === pieceAtSquare.toUpperCase()) ||
        (currentTurn === 'black' && pieceAtSquare === pieceAtSquare.toLowerCase())
      );

      if (isOwnPiece) {
        setSelectedPiece(position);
        const moves = calculatePossibleMoves(position);
        setPossibleMoves(moves);
      }
    }
  };

  return (
    <div className="relative w-full max-w-[min(100vw-24px,560px)] aspect-square select-none p-1 sm:p-3.5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800/80 ring-1 ring-white/5 touch-manipulation">
      {/* Board grid container */}
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg sm:rounded-xl overflow-hidden shadow-inner border sm:border-2 border-slate-950">
        {ranks.map((rank) =>
          files.map((file) => {
            const position = `${file}${rank}`;
            const piece = getPieceAtPosition(position);

            const fileIdx = file.charCodeAt(0) - 97;
            const rankIdx = parseInt(rank);
            const isLightSquare = (fileIdx + rankIdx) % 2 !== 0;

            const isSelected = selectedPiece === position;
            const isPossibleTarget = possibleMoves.includes(position);
            const isLastMoveSquare = lastMove && (lastMove.from === position || lastMove.to === position);
            const isCheckedKing = isCheck && piece && (
              (currentTurn === 'white' && piece === 'K') ||
              (currentTurn === 'black' && piece === 'k')
            );

            // Coordinates display flags
            const showFileCoord = rank === (isFlipped ? '8' : '1');
            const showRankCoord = file === (isFlipped ? 'h' : 'a');

            return (
              <div
                key={position}
                onClick={() => handleSquareClick(position)}
                className={`relative aspect-square flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                  isLightSquare
                    ? 'bg-[#EEEED2] hover:bg-[#F5F5E0] text-[#779952]'
                    : 'bg-[#769656] hover:bg-[#86A666] text-[#EEEED2]'
                } ${
                  isSelected ? '!bg-[#BACA44] ring-2 ring-inset ring-amber-400/80' : ''
                } ${
                  isLastMoveSquare && !isSelected ? '!bg-[#CDD26A]' : ''
                } ${
                  isCheckedKing ? '!bg-red-600/90 shadow-inner animate-pulse' : ''
                }`}
              >
                {/* File coordinate label */}
                {showFileCoord && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-bold pointer-events-none opacity-80 select-none">
                    {file}
                  </span>
                )}

                {/* Rank coordinate label */}
                {showRankCoord && (
                  <span className="absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-bold pointer-events-none opacity-80 select-none">
                    {rank}
                  </span>
                )}

                {/* Possible move indicator dot or capture ring */}
                {isPossibleTarget && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    {piece ? (
                      <div className="w-[84%] h-[84%] rounded-full border-4 sm:border-[5px] border-emerald-500/80 opacity-90 shadow-sm" />
                    ) : (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-600/80 opacity-90 shadow-sm" />
                    )}
                  </div>
                )}

                {/* Piece representation */}
                {piece && <ChessPiece type={piece} />}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Dialog */}
      <PromotionDialog
        isOpen={promotionPending}
        onClose={() => {}}
        onPromotion={onPromotion}
        color={promotionSquare && promotionSquare[1] === '8' ? 'white' : 'black'}
      />
    </div>
  );
});
