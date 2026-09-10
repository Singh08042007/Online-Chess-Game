import { HandGesture } from './types';

export class CoordinateSmoother {
  private smoothedX: number | null = null;
  private smoothedY: number | null = null;
  private alpha: number;

  constructor(alpha: number = 0.35) {
    this.alpha = alpha;
  }

  public update(rawX: number, rawY: number): { x: number; y: number } {
    if (this.smoothedX === null || this.smoothedY === null) {
      this.smoothedX = rawX;
      this.smoothedY = rawY;
    } else {
      this.smoothedX = this.alpha * rawX + (1 - this.alpha) * this.smoothedX;
      this.smoothedY = this.alpha * rawY + (1 - this.alpha) * this.smoothedY;
    }

    return { x: this.smoothedX, y: this.smoothedY };
  }

  public reset(): void {
    this.smoothedX = null;
    this.smoothedY = null;
  }
}

export class SquareDebouncer {
  private currentSquare: string | null = null;
  private candidateSquare: string | null = null;
  private candidateStartTime: number = 0;
  private dwellMs: number;

  constructor(dwellMs: number = 70) {
    this.dwellMs = dwellMs;
  }

  public update(instantSquare: string | null): string | null {
    const now = performance.now();

    if (instantSquare !== this.candidateSquare) {
      this.candidateSquare = instantSquare;
      this.candidateStartTime = now;
    } else if (now - this.candidateStartTime >= this.dwellMs) {
      this.currentSquare = this.candidateSquare;
    }

    return this.currentSquare;
  }

  public reset(): void {
    this.currentSquare = null;
    this.candidateSquare = null;
    this.candidateStartTime = 0;
  }
}

export class GestureDebouncer {
  private lastStableGesture: HandGesture = 'UNKNOWN';
  private candidateGesture: HandGesture = 'UNKNOWN';
  private candidateCount: number = 0;
  private requiredFrames: number;

  constructor(requiredFrames: number = 2) {
    this.requiredFrames = requiredFrames;
  }

  public update(gesture: HandGesture): HandGesture {
    if (gesture === this.candidateGesture) {
      this.candidateCount++;
      if (this.candidateCount >= this.requiredFrames) {
        this.lastStableGesture = gesture;
      }
    } else {
      this.candidateGesture = gesture;
      this.candidateCount = 1;
    }

    return this.lastStableGesture;
  }

  public reset(): void {
    this.lastStableGesture = 'UNKNOWN';
    this.candidateGesture = 'UNKNOWN';
    this.candidateCount = 0;
  }
}
