import { HandLandmark, HandGesture, HandTrackingResult, CalibrationBounds } from './types';
import { classifyHandGesture } from './gesture-classifier';
import { mapCoordsToSquare, DEFAULT_CALIBRATION } from './coordinate-mapper';
import { CoordinateSmoother, SquareDebouncer, GestureDebouncer } from './smoothing';

declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
  }
}

/**
 * Loads MediaPipe Hands scripts dynamically from CDN only when required.
 */
export async function loadMediaPipeScripts(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.Hands) return;

  const loadScript = (src: string, isReady: () => boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isReady()) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (isReady()) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));
        const interval = setInterval(() => {
          if (isReady()) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 10000);
        return;
      }

      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  };

  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', () => !!window.Camera);
  await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', () => !!window.Hands);
}

export class HandDetectorController {
  private handsInstance: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isProcessingFrame: boolean = false;

  private smoother = new CoordinateSmoother(0.35);
  private squareDebouncer = new SquareDebouncer(80);
  private gestureDebouncer = new GestureDebouncer(2);

  public bounds: CalibrationBounds = { ...DEFAULT_CALIBRATION };
  public orientation: 'white' | 'black' = 'white';
  public showSkeleton: boolean = true;

  private onResultCallback?: (result: HandTrackingResult) => void;

  public async start(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onResult: (result: HandTrackingResult) => void
  ): Promise<void> {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.onResultCallback = onResult;

    // Load scripts if not yet available
    await loadMediaPipeScripts();

    if (!window.Hands) {
      throw new Error('MediaPipe Hands is not available.');
    }

    // Initialize MediaPipe Hands
    this.handsInstance = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.handsInstance.setOptions({
      maxNumHands: 1, // Only focus on primary hand
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });

    this.handsInstance.onResults(this.handleMediaPipeResults);

    this.isRunning = true;
    this.isProcessingFrame = false;
    this.startProcessingLoop();
  }

  private startProcessingLoop = async () => {
    if (!this.isRunning) return;

    if (this.videoElement && this.handsInstance && !this.isProcessingFrame) {
      if (this.videoElement.readyState >= 2 && !this.videoElement.paused) {
        this.isProcessingFrame = true;
        try {
          await this.handsInstance.send({ image: this.videoElement });
        } catch {
          // Suppress occasional frame drop errors
        } finally {
          this.isProcessingFrame = false;
        }
      }
    }

    if (this.isRunning) {
      this.animFrameId = requestAnimationFrame(this.startProcessingLoop);
    }
  };

  private handleMediaPipeResults = (results: any) => {
    const landmarksRaw = results?.multiHandLandmarks?.[0] as HandLandmark[] | undefined;

    if (!landmarksRaw || landmarksRaw.length < 21) {
      this.squareDebouncer.reset();
      this.clearCanvas();
      this.onResultCallback?.({
        landmarks: null,
        rawPosition: null,
        smoothedPosition: null,
        boardPosition: null,
        gesture: 'UNKNOWN',
        confidence: 0,
        hoveredSquare: null,
        isHandPresent: false,
      });
      return;
    }

    // Classify gesture first
    const { gesture: instantGesture, confidence } = classifyHandGesture(landmarksRaw);
    const stableGesture = this.gestureDebouncer.update(instantGesture);

    // Mirrored camera coordinates (User moves right -> cursor moves right)
    // For grab/fist, use center of hand/knuckle (landmark 9) so closing hand doesn't jump; for pointing/open, use index tip (8)
    const isGrabbing = stableGesture === 'CLOSED_FIST' || stableGesture === 'PINCH';
    const trackingLandmark = isGrabbing ? landmarksRaw[9] : landmarksRaw[8];
    const rawX = 1 - trackingLandmark.x;
    const rawY = trackingLandmark.y;

    // Apply Exponential Smoothing
    const smoothed = this.smoother.update(rawX, rawY);

    // Map coordinates to chessboard square
    const mapped = mapCoordsToSquare(smoothed.x, smoothed.y, this.bounds, this.orientation);
    const instantSquare = mapped ? mapped.square : null;
    const stableSquare = this.squareDebouncer.update(instantSquare);

    // Draw skeleton on canvas preview
    if (this.showSkeleton && this.canvasElement) {
      this.drawHandSkeleton(landmarksRaw, stableGesture);
    } else {
      this.clearCanvas();
    }

    this.onResultCallback?.({
      landmarks: landmarksRaw,
      rawPosition: { x: rawX, y: rawY },
      smoothedPosition: smoothed,
      boardPosition: mapped ? { x: mapped.boardX, y: mapped.boardY } : null,
      gesture: stableGesture,
      confidence,
      hoveredSquare: stableSquare,
      isHandPresent: true,
    });
  };

  private drawHandSkeleton(landmarks: HandLandmark[], gesture: HandGesture) {
    if (!this.canvasElement) return;
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Active Board Zone Bounding Box (so user can visually see calibration)
    const boxX = this.bounds.minX * w;
    const boxY = this.bounds.minY * h;
    const boxW = (this.bounds.maxX - this.bounds.minX) * w;
    const boxH = (this.bounds.maxY - this.bounds.minY) * h;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.setLineDash([]);

    // Color based on detected gesture
    const lineColor =
      gesture === 'CLOSED_FIST' || gesture === 'PINCH'
        ? '#F59E0B' // Amber for Grab
        : gesture === 'OPEN_HAND'
        ? '#10B981' // Emerald for Drop/Open
        : '#38BDF8'; // Sky Blue for Point/Hover

    // Hand landmark connection pairs
    const connections: [number, number][] = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm cross knuckles
      [5, 9], [9, 13], [13, 17],
    ];

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = lineColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      // Mirror X for display
      const x1 = (1 - p1.x) * w;
      const y1 = p1.y * h;
      const x2 = (1 - p2.x) * w;
      const y2 = p2.y * h;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw Joint Dots
    landmarks.forEach((p, idx) => {
      const x = (1 - p.x) * w;
      const y = p.y * h;
      ctx.beginPath();
      const radius = idx === 8 || idx === 9 ? 5 : 3;
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 8 || idx === 9 ? '#F59E0B' : '#FFFFFF';
      ctx.fill();
    });
  }

  private clearCanvas() {
    if (!this.canvasElement) return;
    const ctx = this.canvasElement.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
  }

  public stop(): void {
    this.isRunning = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.videoElement.srcObject = null;
    }

    if (this.handsInstance) {
      try {
        this.handsInstance.close();
      } catch (e) {}
      this.handsInstance = null;
    }

    this.clearCanvas();
    this.smoother.reset();
    this.squareDebouncer.reset();
    this.gestureDebouncer.reset();
  }
}
