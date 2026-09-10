'use client';

import React from 'react';

interface ChessPieceProps {
  type: string; // 'P','N','B','R','Q','K' (White) or 'p','n','b','r','q','k' (Black)
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = React.memo(({ type, className = '' }) => {
  if (!type) return null;

  const isWhite = type === type.toUpperCase();
  const pieceKey = type.toLowerCase();

  const fill = isWhite ? '#F8FAFC' : '#1E293B';
  const stroke = isWhite ? '#334155' : '#0F172A';
  const highlight = isWhite ? '#FFFFFF' : '#475569';

  // Crisp, tournament-quality SVG shapes
  const renderSvg = () => {
    switch (pieceKey) {
      case 'p': // Pawn
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <path
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {isWhite && <circle cx="22.5" cy="13" r="2.5" fill={highlight} opacity="0.6" />}
          </svg>
        );

      case 'r': // Rook
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <path
              d="M9 39h27v-3H9v3zm3-3v-4h21v4H12zm1-4.5h19v-13h-4v2h-3v-2h-5v2h-3v-2h-4v13zm-2-15.5l1.5-2.5h21l1.5 2.5H11zm-1-3.5v2h25v-2H10zm0-3.5h5v2.5h3V9h4v2.5h3V9h4v2.5h3V9h3v2.5h-25z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'n': // Knight
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <path
              d="M22 10c-5.5 0-10 4.5-10 10 0 2.5 1 5 2.5 7l-2.5 5h4l2-3.5c1.5 1 3.5 1.5 5.5 1.5s4-.5 5.5-1.5l2 3.5h4l-2.5-5c1.5-2 2.5-4.5 2.5-7 0-5.5-4.5-10-10-10zm-6 29h16v-3H16v3z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M22 10c-5.5 0-10 4.5-10 10 0 2.5 1 5 2.5 7l-2.5 5h4l2-3.5c1.5 1 3.5 1.5 5.5 1.5s4-.5 5.5-1.5l2 3.5h4l-2.5-5c1.5-2 2.5-4.5 2.5-7 0-5.5-4.5-10-10-10z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
            />
            <circle cx="18" cy="18" r="1.5" fill={isWhite ? '#0F172A' : '#F8FAFC'} />
          </svg>
        );

      case 'b': // Bishop
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <g
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.94 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
              <path d="M17.5 26h10M22.5 21v10" stroke={stroke} strokeWidth="1.2" />
            </g>
          </svg>
        );

      case 'q': // Queen
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <g
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-4-14-4.5 14-4.5-14-4 14-7-11 2 12z" />
              <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
              <path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke={stroke} />
              <circle cx="6" cy="12" r="2" />
              <circle cx="14" cy="9" r="2" />
              <circle cx="22.5" cy="8" r="2" />
              <circle cx="31" cy="9" r="2" />
              <circle cx="39" cy="12" r="2" />
            </g>
          </svg>
        );

      case 'k': // King
        return (
          <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-md select-none">
            <g
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22.5 11.63V6M20 8h5" stroke={stroke} strokeWidth="1.5" />
              <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
              <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-6 3.5-6 3.5l-2-2c-.5-1.5-2-2-4-2s-3.5.5-4 2l-2 2s-2-4.5-6-3.5c-3 6 6 10.5 6 10.5v7z" />
              <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" fill="none" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full h-full flex items-center justify-center p-1 transition-transform duration-150 hover:scale-105 active:scale-95 ${className}`}>
      {renderSvg()}
    </div>
  );
});
