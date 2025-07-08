import React from 'react';

interface SquareProps {
  position: string;
  isSelected: boolean;
  isPossibleMove: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = React.memo(({ position, isSelected, isPossibleMove, onClick, children }) => {
  const isLight = (position.charCodeAt(0) - 97 + parseInt(position[1])) % 2 === 0;

  return (
    <div
      onClick={onClick}
      className={`aspect-square flex items-center justify-center cursor-pointer transition-all duration-200
        ${isLight ? 'bg-amber-200' : 'bg-amber-800'}
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
});

