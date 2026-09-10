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
import { Camera, ShieldCheck, AlertCircle, MousePointer } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableCamera: () => void;
  onPlayWithMouse: () => void;
  permissionDenied: boolean;
  errorMessage: string | null;
  isLoading: boolean;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onEnableCamera,
  onPlayWithMouse,
  permissionDenied,
  errorMessage,
  isLoading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 p-6">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-950/50">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {permissionDenied ? 'Camera Access Required' : 'Enable Camera Hand Control'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs mt-1">
            {permissionDenied
              ? 'Webcam permission is needed to recognize your hand gestures.'
              : 'Camera access is required to control the chess board with hand gestures.'}
          </DialogDescription>
        </DialogHeader>

        {/* Error or Explanation Banner */}
        {errorMessage ? (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5 my-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Camera Unavailable</p>
              <p className="text-[11px] text-red-300/80 mt-0.5">{errorMessage}</p>
              <p className="text-[11px] text-red-400 mt-1">
                Tip: Check your browser address bar and click the camera icon to allow access.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 my-2">
            {/* Privacy Guarantee Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-bold text-emerald-300">100% Private & Local:</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your camera feed is processed directly inside your browser using Google MediaPipe.
                  No video frames or images are ever uploaded, recorded, or stored.
                </p>
              </div>
            </div>

            {/* How it works summary */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">How hand control works:</p>
              <p className="text-[11px] text-slate-400">
                • <strong>Point</strong> index finger over a chess piece to aim.
              </p>
              <p className="text-[11px] text-slate-400">
                • <strong>Close fist</strong> to pick up the piece.
              </p>
              <p className="text-[11px] text-slate-400">
                • <strong>Move hand</strong> to target square and <strong>open hand</strong> to drop!
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          {!permissionDenied ? (
            <Button
              onClick={onEnableCamera}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm h-10 shadow-md shadow-emerald-950/40"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Starting Camera...' : 'Enable Camera'}
            </Button>
          ) : (
            <Button
              onClick={onEnableCamera}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10"
            >
              Retry Camera
            </Button>
          )}

          <Button
            onClick={onPlayWithMouse}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm h-10 gap-1.5"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Play with Mouse Instead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
