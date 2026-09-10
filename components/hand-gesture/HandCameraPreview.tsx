'use client';

import React, { useState } from 'react';
import { HandGesture } from '@/lib/hand-gesture/types';
import { Button } from '@/components/ui/button';
import {
  Eye,
  EyeOff,
  Sliders,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface HandCameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  gesture: HandGesture;
  hoveredSquare: string | null;
  grabbedSquare: string | null;
  confidence: number;
  isHandPresent: boolean;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  onOpenCalibration: () => void;
  onOpenTutorial: () => void;
}

export const HandCameraPreview: React.FC<HandCameraPreviewProps> = ({
  videoRef,
  canvasRef,
  cameraActive,
  gesture,
  hoveredSquare,
  grabbedSquare,
  confidence,
  isHandPresent,
  showSkeleton,
  onToggleSkeleton,
  onOpenCalibration,
  onOpenTutorial,
}) => {
  const [minimized, setMinimized] = useState(false);

  const getGestureInfo = (g: HandGesture) => {
    switch (g) {
      case 'CLOSED_FIST':
      case 'PINCH':
        return {
          icon: '✊',
          label: 'GRAB / HOLD',
          color: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
        };
      case 'OPEN_HAND':
        return {
          icon: '🖐️',
          label: 'OPEN / DROP',
          color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60',
        };
      case 'POINTING':
        return {
          icon: '👆',
          label: 'POINT / AIM',
          color: 'bg-sky-950/80 text-sky-300 border-sky-500/60',
        };
      default:
        return {
          icon: '✋',
          label: 'DETECTING',
          color: 'bg-slate-900/80 text-slate-400 border-slate-700',
        };
    }
  };

  const gestureInfo = getGestureInfo(gesture);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm transition-all">
      {/* Header with Title and Minimize */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cameraActive && isHandPresent ? 'bg-emerald-500 animate-pulse' : cameraActive ? 'bg-amber-500' : 'bg-red-500'}`} />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Webcam Hand Tracker
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title={minimized ? 'Expand preview' : 'Minimize preview'}
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video & Skeleton Canvas Container */}
      {!minimized && (
        <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          {/* Mirrored Video Feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Skeleton Overlay Canvas */}
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Hand Absence Alert Overlay */}
          {cameraActive && !isHandPresent && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-3 z-20 animate-in fade-in">
              <span className="text-2xl mb-1">✋</span>
              <p className="text-xs font-bold text-amber-300">Show Hand to Camera</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Hold hand in front of webcam to control</p>
            </div>
          )}

          {/* Corner Gesture Badge */}
          {cameraActive && isHandPresent && (
            <div className="absolute top-2 left-2 z-20">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-lg ${gestureInfo.color}`}
              >
                <span>{gestureInfo.icon}</span>
                <span>{gestureInfo.label}</span>
              </span>
            </div>
          )}

          {/* Corner Target Square Badge */}
          {cameraActive && (
            <div className="absolute bottom-2 right-2 z-20">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs font-mono font-bold text-emerald-400 backdrop-blur-md shadow">
                <span>Square:</span>
                <span className="text-sm font-black text-white">{hoveredSquare || '—'}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Bar & Action Toggles */}
      <div className="mt-2.5 space-y-2">
        {/* Grab Status Message */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">Status:</span>
          {grabbedSquare ? (
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Piece Grabbed ({grabbedSquare})
            </span>
          ) : isHandPresent ? (
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aiming ({hoveredSquare || 'Moving'})
            </span>
          ) : (
            <span className="text-slate-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70" />
              Hand not in frame
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
          <Button
            onClick={onToggleSkeleton}
            size="sm"
            variant="outline"
            className="flex-1 text-[11px] h-7 border-slate-700 text-slate-300 hover:text-white"
          >
            {showSkeleton ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showSkeleton ? 'Hide Skeleton' : 'Show Skeleton'}
          </Button>

          <Button
            onClick={onOpenCalibration}
            size="sm"
            variant="outline"
            className="text-[11px] h-7 border-slate-700 text-slate-300 hover:text-white"
            title="Calibrate Board Boundaries"
          >
            <Sliders className="w-3 h-3 mr-1" />
            Calibrate
          </Button>

          <Button
            onClick={onOpenTutorial}
            size="sm"
            variant="outline"
            className="text-[11px] h-7 border-slate-700 text-slate-300 hover:text-white"
            title="View Gesture Instructions"
          >
            Help
          </Button>
        </div>
      </div>
    </div>
  );
};
