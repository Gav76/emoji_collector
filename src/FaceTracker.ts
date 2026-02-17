/**
 * FaceTracker - Detects face and calculates head orientation
 * 
 * Responsibilities:
 * - Initialize MediaPipe Face Mesh model
 * - Process video frames to detect facial landmarks
 * - Calculate head orientation from landmark positions
 * - Provide landmark coordinates and direction state
 */

import { EmojiMatcher } from './EmojiMatcher.js';

export enum HeadDirection {
  CENTER = 'center',
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down'
}

export interface Landmark {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
  z: number;  // Depth (optional)
}

export interface FaceTrackingResult {
  detected: boolean;
  landmarks: Landmark[];
  direction: HeadDirection;
  confidence: number;
  emoji?: string;
  expression?: string;
}

export interface TrackingConfig {
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  directionThreshold: number;
}

export interface IFaceTracker {
  initialize(config?: TrackingConfig): Promise<void>;
  processFrame(videoElement: HTMLVideoElement): Promise<FaceTrackingResult>;
  isReady(): boolean;
  dispose(): void;
}

export class FaceTracker implements IFaceTracker {
  private faceMesh: any = null;
  private ready: boolean = false;
  private lastResult: FaceTrackingResult | null = null;
  private directionThreshold: number = 0.15;
  private emojiMatcher: EmojiMatcher = new EmojiMatcher();

  /**
   * Initialize the face mesh model
   * @param config - Optional tracking configuration
   */
  async initialize(config?: TrackingConfig): Promise<void> {
    try {
      // Use provided config or defaults
      const trackingConfig = config || {
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        directionThreshold: 0.15
      };

      this.directionThreshold = trackingConfig.directionThreshold;

      // Check if FaceMesh is available from MediaPipe CDN
      if (typeof (window as any).FaceMesh === 'undefined') {
        throw new Error('MediaPipe FaceMesh not loaded. Ensure CDN scripts are included.');
      }

      // Create FaceMesh instance
      this.faceMesh = new (window as any).FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      // Configure FaceMesh options
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: trackingConfig.minDetectionConfidence,
        minTrackingConfidence: trackingConfig.minTrackingConfidence
      });

      // Set up results callback
      this.faceMesh.onResults((results: any) => {
        this.handleResults(results);
      });

      this.ready = true;
    } catch (error) {
      console.error('Failed to initialize FaceTracker:', error);
      throw error;
    }
  }

  /**
   * Process a video frame and return results
   * @param videoElement - The video element to process
   * @returns Promise<FaceTrackingResult> - The tracking result
   */
  async processFrame(videoElement: HTMLVideoElement): Promise<FaceTrackingResult> {
    if (!this.ready || !this.faceMesh) {
      throw new Error('FaceTracker not initialized. Call initialize() first.');
    }

    // Send frame to FaceMesh for processing
    await this.faceMesh.send({ image: videoElement });

    // Return the last result (updated by onResults callback)
    if (this.lastResult) {
      return this.lastResult;
    }

    // Return empty result if no face detected yet
    return {
      detected: false,
      landmarks: [],
      direction: HeadDirection.CENTER,
      confidence: 0
    };
  }

  /**
   * Check if model is ready
   * @returns boolean - True if model is initialized and ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    this.ready = false;
    this.lastResult = null;
  }

  /**
   * Handle results from MediaPipe FaceMesh
   * @param results - Results from FaceMesh processing
   */
  private handleResults(results: any): void {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // No face detected
      this.lastResult = {
        detected: false,
        landmarks: [],
        direction: HeadDirection.CENTER,
        confidence: 0
      };
      return;
    }

    // Extract landmarks from first face
    const faceLandmarks = results.multiFaceLandmarks[0];
    const landmarks: Landmark[] = faceLandmarks.map((lm: any) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z || 0
    }));

    // Calculate head direction
    const direction = this.calculateDirection(landmarks);

    // Analyze expression and get emoji
    const expressionResult = this.emojiMatcher.analyzeExpression(landmarks);

    this.lastResult = {
      detected: true,
      landmarks: landmarks,
      direction: direction,
      confidence: 1.0,  // MediaPipe doesn't provide per-face confidence in this version
      emoji: expressionResult.emoji,
      expression: expressionResult.expression
    };
  }

  /**
   * Calculate head direction from landmarks
   * @param landmarks - Array of facial landmarks
   * @returns HeadDirection - The calculated head direction
   */
  private calculateDirection(landmarks: Landmark[]): HeadDirection {
    if (landmarks.length < 468) {
      return HeadDirection.CENTER;
    }

    // Get nose tip (landmark index 1)
    const noseTip = landmarks[1];

    // Calculate face center from key landmarks
    // Using left eye (33), right eye (263), and chin (152)
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];

    const faceCenterX = (leftEye.x + rightEye.x) / 2;
    const faceCenterY = (leftEye.y + rightEye.y + chin.y) / 3;

    // Calculate offsets
    const horizontalOffset = noseTip.x - faceCenterX;
    const verticalOffset = noseTip.y - faceCenterY;

    // Use configured direction threshold
    const threshold = this.directionThreshold;

    // Determine direction based on offsets
    // Horizontal takes precedence over vertical
    // Note: Camera view is mirrored, so negative offset = looking right, positive = looking left
    if (Math.abs(horizontalOffset) > Math.abs(verticalOffset)) {
      if (horizontalOffset > threshold) {
        return HeadDirection.LEFT;  // Nose moved right in image = looking left
      } else if (horizontalOffset < -threshold) {
        return HeadDirection.RIGHT;  // Nose moved left in image = looking right
      }
    } else {
      if (verticalOffset > threshold) {
        return HeadDirection.DOWN;
      } else if (verticalOffset < -threshold) {
        return HeadDirection.UP;
      }
    }

    return HeadDirection.CENTER;
  }
}
