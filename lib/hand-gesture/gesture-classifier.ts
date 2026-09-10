import { HandLandmark, HandGesture } from './types';

function distance(p1: HandLandmark, p2: HandLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

export function classifyHandGesture(landmarks: HandLandmark[]): {
  gesture: HandGesture;
  confidence: number;
  isIndexExtended: boolean;
  isFist: boolean;
  isOpen: boolean;
  pinchDistance: number;
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'UNKNOWN',
      confidence: 0,
      isIndexExtended: false,
      isFist: false,
      isOpen: false,
      pinchDistance: 1,
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // Palm reference scale (wrist to middle MCP distance)
  const palmScale = Math.max(0.01, distance(wrist, middleMcp));

  // Check finger extension relative to palm scale
  const isIndexExtended = distance(wrist, indexTip) > distance(wrist, indexPip) * 1.15;
  const isMiddleExtended = distance(wrist, middleTip) > distance(wrist, middlePip) * 1.15;
  const isRingExtended = distance(wrist, ringTip) > distance(wrist, ringPip) * 1.15;
  const isPinkyExtended = distance(wrist, pinkyTip) > distance(wrist, pinkyPip) * 1.15;

  // Extension count for 4 main fingers
  const extendedCount =
    (isIndexExtended ? 1 : 0) +
    (isMiddleExtended ? 1 : 0) +
    (isRingExtended ? 1 : 0) +
    (isPinkyExtended ? 1 : 0);

  // Normalized pinch distance
  const pinchDist = distance(thumbTip, indexTip) / palmScale;

  // Fist check: all 4 fingertips are curled close to palm
  const indexCurled = distance(wrist, indexTip) < distance(wrist, indexPip) * 1.05;
  const middleCurled = distance(wrist, middleTip) < distance(wrist, middlePip) * 1.05;
  const ringCurled = distance(wrist, ringTip) < distance(wrist, ringPip) * 1.05;
  const pinkyCurled = distance(wrist, pinkyTip) < distance(wrist, pinkyPip) * 1.05;

  const curledCount =
    (indexCurled ? 1 : 0) +
    (middleCurled ? 1 : 0) +
    (ringCurled ? 1 : 0) +
    (pinkyCurled ? 1 : 0);

  const isFist = curledCount >= 3;
  const isOpen = extendedCount >= 3;

  // Classify gesture
  let gesture: HandGesture = 'UNKNOWN';
  let confidence = 0.7;

  if (pinchDist < 0.45) {
    gesture = 'PINCH';
    confidence = Math.min(0.98, 1 - pinchDist * 1.2);
  } else if (isFist) {
    gesture = 'CLOSED_FIST';
    confidence = Math.min(0.98, 0.7 + (curledCount / 4) * 0.28);
  } else if (isOpen) {
    gesture = 'OPEN_HAND';
    confidence = Math.min(0.98, 0.7 + (extendedCount / 4) * 0.28);
  } else if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    gesture = 'POINTING';
    confidence = 0.92;
  } else {
    gesture = extendedCount >= 2 ? 'OPEN_HAND' : 'CLOSED_FIST';
    confidence = 0.65;
  }

  return {
    gesture,
    confidence,
    isIndexExtended,
    isFist,
    isOpen,
    pinchDistance: pinchDist,
  };
}
