'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HandDetectorController } from '@/lib/hand-gesture/hand-detector';
import { HandTrackingResult, GestureState, HandGesture, CalibrationBounds } from '@/lib/hand-gesture/types';
import { DEFAULT_CALIBRATION } from '@/lib/hand-gesture/coordinate-mapper';
import { soundManager } from '@/lib/audio';

interface UseHandChessProps {
  enabled: boolean;
  isMyTurn: boolean;
  playerColor: 'white' | 'black';
  boardMatrix: string[][];
  calculateMoves: (pos: string) => string[];
  onExecuteMove: (from: string, to: string) => void;
  orientation?: 'white' | 'black';
}

export function useHandChess({
  enabled,
  isMyTurn,
  playerColor,
  boardMatrix,
  calculateMoves,
  onExecuteMove,
  orientation = 'white',
}: UseHandChessProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionPending, setPermissionPending] = useState(false);

  const [gestureState, setGestureState] = useState<GestureState>('IDLE');
  const [trackingResult, setTrackingResult] = useState<HandTrackingResult | null>(null);

  // Selected piece being dragged
  const [grabbedSquare, setGrabbedSquare] = useState<string | null>(null);
  const [legalTargetSquares, setLegalTargetSquares] = useState<string[]>([]);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [calibrationBounds, setCalibrationBounds] = useState<CalibrationBounds>({ ...DEFAULT_CALIBRATION });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<HandDetectorController | null>(null);

  const prevGestureRef = useRef<HandGesture>('UNKNOWN');
  const grabbedSquareRef = useRef<string | null>(null);
  const legalTargetsRef = useRef<string[]>([]);
  const isMyTurnRef = useRef(isMyTurn);
  const boardMatrixRef = useRef(boardMatrix);

  // Keep refs up to date
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  useEffect(() => {
    boardMatrixRef.current = boardMatrix;
  }, [boardMatrix]);

  useEffect(() => {
    grabbedSquareRef.current = grabbedSquare;
  }, [grabbedSquare]);

  useEffect(() => {
    legalTargetsRef.current = legalTargetSquares;
  }, [legalTargetSquares]);

  // Helper: Get piece at square (e.g. 'e4') from matrix
  const getPieceAtSquare = useCallback((sq: string): string | null => {
    if (!sq || sq.length < 2) return null;
    const file = sq.charCodeAt(0) - 97; // 0..7
    const rank = parseInt(sq[1], 10);
    const row = 8 - rank; // row 0 is rank 8
    const col = file;
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      return boardMatrixRef.current[row]?.[col] || null;
    }
    return null;
  }, []);

  // Helper: Verify if piece belongs to player
  const isPlayerPiece = useCallback(
    (piece: string | null): boolean => {
      if (!piece) return false;
      if (playerColor === 'white') {
        return piece === piece.toUpperCase();
      } else {
        return piece === piece.toLowerCase();
      }
    },
    [playerColor]
  );

  // Handle hand tracking results & state machine
  const handleTrackingResult = useCallback(
    (result: HandTrackingResult) => {
      setTrackingResult(result);

      if (!result.isHandPresent) {
        if (!grabbedSquareRef.current) {
          setGestureState('IDLE');
        }
        return;
      }

      if (!isMyTurnRef.current) {
        setGestureState('AI_TURN');
        return;
      }

      const { gesture, hoveredSquare } = result;
      const prevGesture = prevGestureRef.current;
      prevGestureRef.current = gesture;

      const isGrabbingGesture = gesture === 'CLOSED_FIST' || gesture === 'PINCH';
      const isOpenGesture = gesture === 'OPEN_HAND';

      // 1. TRANSITION: OPEN / POINT -> CLOSED FIST (GRAB)
      if (isGrabbingGesture && !grabbedSquareRef.current && hoveredSquare) {
        const piece = getPieceAtSquare(hoveredSquare);
        if (isPlayerPiece(piece)) {
          const legal = calculateMoves(hoveredSquare);
          setGrabbedSquare(hoveredSquare);
          setLegalTargetSquares(legal);
          setGestureState('DRAGGING');
          soundManager.playMove();
          return;
        }
      }

      // 2. WHILE GRABBING: DRAGGING
      if (isGrabbingGesture && grabbedSquareRef.current) {
        setGestureState('DRAGGING');
        return;
      }

      // 3. TRANSITION: CLOSED FIST -> OPEN HAND (DROP)
      if (isOpenGesture && grabbedSquareRef.current) {
        const sourceSq = grabbedSquareRef.current;
        const destSq = hoveredSquare;

        setGrabbedSquare(null);
        setLegalTargetSquares([]);

        if (destSq && destSq !== sourceSq && legalTargetsRef.current.includes(destSq)) {
          // Valid move dropped!
          setGestureState('AI_TURN');
          onExecuteMove(sourceSq, destSq);
        } else {
          // Illegal drop or cancelled
          setGestureState('HOVERING');
        }
        return;
      }

      // 4. NORMAL HOVER
      if (!grabbedSquareRef.current) {
        setGestureState('HOVERING');
      }
    },
    [calculateMoves, getPieceAtSquare, isPlayerPiece, onExecuteMove]
  );

  // Start webcam and hand tracking
  const startCamera = useCallback(async () => {
    // If refs are not mounted yet, wait up to 500ms
    if (!videoRef.current || !canvasRef.current) {
      for (let i = 0; i < 10; i++) {
        if (videoRef.current && canvasRef.current) break;
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    if (!videoRef.current || !canvasRef.current) {
      console.warn('Video or Canvas ref not mounted yet.');
      return;
    }

    setPermissionPending(true);
    setCameraError(null);
    setPermissionDenied(false);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Camera is not supported on this browser or connection is not secure (localhost/HTTPS required).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play warning:', e);
        }
      }

      // Mark camera active as soon as stream is playing
      setCameraActive(true);
      setPermissionPending(false);

      if (!detectorRef.current) {
        detectorRef.current = new HandDetectorController();
      }

      detectorRef.current.bounds = calibrationBounds;
      detectorRef.current.orientation = orientation;
      detectorRef.current.showSkeleton = showSkeleton;

      if (videoRef.current && canvasRef.current) {
        await detectorRef.current.start(videoRef.current, canvasRef.current, handleTrackingResult);
      }
    } catch (err: any) {
      console.error('Camera activation error:', err);
      setPermissionPending(false);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraError('Camera access was denied in your browser settings. Please allow camera permissions in the address bar.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError(err.message || 'Unable to start camera for hand tracking.');
      }
      throw err;
    }
  }, [calibrationBounds, handleTrackingResult, orientation, showSkeleton]);

  // Stop camera & cleanup
  const stopCamera = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setGestureState('IDLE');
    setTrackingResult(null);
    setGrabbedSquare(null);
    setLegalTargetSquares([]);
  }, []);

  // Update bounds or orientation on detector
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.bounds = calibrationBounds;
      detectorRef.current.orientation = orientation;
      detectorRef.current.showSkeleton = showSkeleton;
    }
  }, [calibrationBounds, orientation, showSkeleton]);

  // Stop camera only when manually disabled
  useEffect(() => {
    if (!enabled) {
      stopCamera();
    }
  }, [enabled, stopCamera]);

  // Clean up media streams and detector ONLY on hook unmount
  useEffect(() => {
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    cameraActive,
    cameraError,
    permissionDenied,
    permissionPending,
    gestureState,
    trackingResult,
    grabbedSquare,
    legalTargetSquares,
    showSkeleton,
    setShowSkeleton,
    calibrationBounds,
    setCalibrationBounds,
    startCamera,
    stopCamera,
    cancelGrab: () => {
      setGrabbedSquare(null);
      setLegalTargetSquares([]);
    },
  };
}
