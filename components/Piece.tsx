import React from 'react';

interface PieceProps {
  type: string;
}

export const Piece: React.FC<PieceProps> = React.memo(({ type }) => {
  const getPieceSymbol = (type: string) => {
    switch (type) {
      case 'P': return '♙';
      case 'R': return '♖';
      case 'N': return '♘';
      case 'B': return '♗';
      case 'Q': return '♕';
      case 'K': return '♔';
      case 'p': return '♟';
      case 'r': return '♜';
      case 'n': return '♞';
      case 'b': return '♝';
      case 'q': return '♛';
      case 'k': return '♚';
      default: return '';
    }
  };

  const isWhite = type === type.toUpperCase();

  return (
    <div className={`text-3xl sm:text-4xl md:text-5xl ${isWhite ? 'text-white' : 'text-black'} drop-shadow-md transition-transform hover:scale-110`}>
      {getPieceSymbol(type)}
    </div>
  );
});

