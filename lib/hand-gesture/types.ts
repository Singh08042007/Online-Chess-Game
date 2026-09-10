export type HandGesture = 'OPEN_HAND' | 'CLOSED_FIST' | 'POINTING' | 'PINCH' | 'UNKNOWN';

export type GestureState =
  | 'IDLE'            // No hand or tracking paused
  | 'HOVERING'        // Hand detected, pointing or hovering over a square
  | 'GRABBING'        // Fist closing over a piece
  | 'DRAGGING'        // Holding piece and moving
  | 'DROP_DETECTED'   // Hand opened to release
  | 'AI_TURN';        // Computer thinking, user hand input paused

export interface HandLandmark {
  x: number; // 0 to 1
  y: number; // 0 to 1
  z: number;
}

export interface CalibrationBounds {
  minX: number; // Left bound in mirrored coordinates (0..1)
  maxX: number; // Right bound (0..1)
  minY: number; // Top bound (0..1)
  maxY: number; // Bottom bound (0..1)
}

export interface HandTrackingResult {
  landmarks: HandLandmark[] | null;
  rawPosition: { x: number; y: number } | null;
  smoothedPosition: { x: number; y: number } | null;
  boardPosition: { x: number; y: number } | null;
  gesture: HandGesture;
  confidence: number;
  hoveredSquare: string | null;
  isHandPresent: boolean;
}

