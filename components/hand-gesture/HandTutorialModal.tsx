'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HandGesture, CalibrationBounds } from '@/lib/hand-gesture/types';
import { DEFAULT_CALIBRATION } from '@/lib/hand-gesture/coordinate-mapper';
import { CheckCircle2, Sliders } from 'lucide-react';

interface HandTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGesture: HandGesture;
  currentSquare: string | null;
  calibrationBounds: CalibrationBounds;
  onUpdateCalibration: (bounds: CalibrationBounds) => void;
}

export const HandTutorialModal: React.FC<HandTutorialModalProps> = ({
  isOpen,
  onClose,
  currentGesture,
  currentSquare,
  calibrationBounds,
  onUpdateCalibration,
}) => {
  const isFist = currentGesture === 'CLOSED_FIST' || currentGesture === 'PINCH';
  const isOpenHand = currentGesture === 'OPEN_HAND';
  const isPointing = currentGesture === 'POINTING';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-800 text-slate-100 p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>🖐️</span> How to Play with Hand Gestures
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Control the virtual chess board physically through your webcam.
          </DialogDescription>
        </DialogHeader>

        {/* 4 Steps Visual Cards */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-2xl">☝️</span>
            <p className="font-bold text-xs text-white">1. Point to Aim</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              Move your index finger over a piece you want to move.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-2xl">✊</span>
            <p className="font-bold text-xs text-amber-400">2. Close Hand (Grab)</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              Make a fist or pinch fingers together to pick up the piece.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-2xl">✋</span>
            <p className="font-bold text-xs text-teal-400">3. Move Piece</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              Keep your hand closed and guide the cursor to your target square.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-2xl">🖐️</span>
            <p className="font-bold text-xs text-emerald-400">4. Open Hand (Drop)</p>
            <p className="text-[11px] text-slate-400 leading-snug">
              Open all fingers wide to release the piece on the square!
            </p>
          </div>
        </div>

        {/* Live Interactive Test Strip */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Live Gesture Practice Zone
          </p>
          <p className="text-[11px] text-slate-400">
            Try closing and opening your hand now in front of the camera:
          </p>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div
              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                isOpenHand
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-lg">🖐️</div>
              Open Hand
              {isOpenHand && <div className="text-[9px] text-emerald-400 font-semibold">DETECTED</div>}
            </div>

            <div
              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                isFist
                  ? 'bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500/50 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-lg">✊</div>
              Closed Fist
              {isFist && <div className="text-[9px] text-amber-400 font-semibold">DETECTED</div>}
            </div>

            <div
              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                isPointing
                  ? 'bg-sky-950 border-sky-500 text-sky-300 ring-2 ring-sky-500/50 scale-105'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-lg">👆</div>
              Pointing
              {isPointing && <div className="text-[9px] text-sky-400 font-semibold">DETECTED</div>}
            </div>
          </div>

          <div className="text-center pt-1 text-xs text-slate-400">
            Hovered Square: <strong className="font-mono text-emerald-400">{currentSquare || '—'}</strong>
          </div>
        </div>

        {/* Board Margin Calibration */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Camera Active Zone Size
            </span>
            <Button
              onClick={() => onUpdateCalibration({ ...DEFAULT_CALIBRATION })}
              size="sm"
              variant="ghost"
              className="text-[11px] h-6 px-2 text-slate-400 hover:text-white"
            >
              Reset to Default
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">
            Adjust how much of your webcam view maps across the 8×8 board squares.
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Wide Movement (Comfortable)</span>
              <span>Compact Movement (Fast)</span>
            </div>
            <input
              type="range"
              min="0.06"
              max="0.20"
              step="0.02"
              value={calibrationBounds.minX}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateCalibration({
                  minX: val,
                  maxX: 1 - val,
                  minY: Math.max(0.06, val - 0.04),
                  maxY: Math.max(0.55, 1 - val - 0.23), // preserves generous lower margin
                });
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 mt-2"
        >
          Got it, Let&apos;s Play!
        </Button>
      </DialogContent>
    </Dialog>
  );
};
