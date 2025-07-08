import React, { useState } from 'react';
import { Piece } from './Piece';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ChessBoardProps {
  board: string[][];
  onMove: (from: string, to: string) => void;
  canMakeMove: boolean;
  calculatePossibleMoves: (board: string[][], from: string) => string[];
  promotionPending: boolean;
  promotionSquare: string | null;
  onPromotion: (piece: string) => void;
}

const getPieceSymbol = (piece: string) => {
  switch (piece.toUpperCase()) {
    case 'Q': return '♛';
    case 'R': return '♜';
    case 'B': return '♝';
    case 'N': return '♞';
    case 'K': return '♚';
    case 'P': return '♟';
    case 'q': return '♕';
    case 'r': return '♖';
    case 'b': return '♗';
    case 'n': return '♘';
    case 'k': return '♔';
    case 'p': return '♙';
    default: return piece;
  }
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
      <DialogContent className="bg-white dark:bg-gray-800">
        <DialogTitle className="text-gray-900 dark:text-gray-100">Choose promotion piece</DialogTitle>
        <div className="flex justify-around">
          {pieces.map((piece) => (
            <Button key={piece} onClick={() => onPromotion(piece)} className="text-4xl bg-amber-100 dark:bg-amber-800 text-gray-900 dark:text-gray-100">
              {getPieceSymbol(piece)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Square: React.FC<{
  position: string;
  isSelected: boolean;
  isPossibleMove: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ position, isSelected, isPossibleMove, onClick, children }) => {
  const isLight = (position.charCodeAt(0) - 97 + parseInt(position[1])) % 2 === 0;

  return (
    <div
      onClick={onClick}
      className={`aspect-square flex items-center justify-center cursor-pointer transition-all duration-200
      ${isLight ? 'bg-amber-200 dark:bg-amber-700' : 'bg-amber-800 dark:bg-amber-900'}
      ${isSelected ? 'ring-4 ring-blue-500' : ''}
      ${isPossibleMove ? 'ring-4 ring-green-500' : ''}
      hover:opacity-80`}
    >
      {children}
      {isPossibleMove && !children && (
        <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
      )}
    </div>
  );
};


export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({ board, onMove, canMakeMove, calculatePossibleMoves, promotionPending, promotionSquare, onPromotion }) => {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  const handleSquareClick = (position: string) => {
    console.log('Square clicked:', position, 'Can make move:', canMakeMove);
    if (!canMakeMove) {
      console.log('Cannot make move now');
      setPossibleMoves([]);
      return;
    }

    if (selectedPiece) {
      if (possibleMoves.includes(position)) {
        console.log('Attempting move from', selectedPiece, 'to', position);
        onMove(selectedPiece, position);
        setSelectedPiece(null);
        setPossibleMoves([]);
      } else {
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    } else {
      const [col, row] = position.split('');
      const piece = board[8 - parseInt(row)][col.charCodeAt(0) - 97];
      if (piece) {
        console.log('Selecting piece:', piece, 'at', position);
        setSelectedPiece(position);
        const moves = calculatePossibleMoves(board, position);
        setPossibleMoves(moves);
      }
    }
  };

  return (
    <div className="w-full max-w-[80vmin] aspect-square">
      <div className="grid grid-cols-8 gap-0 w-full h-full border-4 border-amber-800 rounded-lg shadow-lg overflow-hidden">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const position = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            return (
              <Square
                key={position}
                position={position}
                isSelected={position === selectedPiece}
                isPossibleMove={possibleMoves.includes(position)}
                onClick={() => handleSquareClick(position)}
              >
                {piece && <Piece type={piece} />}
              </Square>
            );
          })
        )}
      </div>
      <PromotionDialog
        isOpen={promotionPending}
        onClose={() => {}} // This should be handled by the parent component
        onPromotion={onPromotion}
        color={promotionSquare && promotionSquare[1] === '8' ? 'white' : 'black'}
      />
    </div>
  );
});

