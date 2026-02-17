/**
 * RenderingEngine - Handles all visual rendering and UI updates
 * 
 * Responsibilities:
 * - Draw raw camera feed to first canvas
 * - Draw camera feed with landmark overlays to second canvas
 * - Update border colors based on head direction
 * - Synchronize both canvases to show the same frame
 */

import { HeadDirection, Landmark, FaceTrackingResult } from './FaceTracker.js';

export interface BorderColorMap {
  [HeadDirection.CENTER]: string;
  [HeadDirection.LEFT]: string;
  [HeadDirection.RIGHT]: string;
  [HeadDirection.UP]: string;
  [HeadDirection.DOWN]: string;
}

export interface RenderingConfig {
  landmarkColor: string;
  landmarkRadius: number;
  borderColors: BorderColorMap;
}

export interface IRenderingEngine {
  initialize(
    overlayCanvas: HTMLCanvasElement,
    borderElement: HTMLElement,
    config?: RenderingConfig
  ): void;
  renderFrame(
    videoElement: HTMLVideoElement,
    trackingResult: FaceTrackingResult
  ): void;
  updateBorder(direction: HeadDirection): void;
  clear(): void;
}

export class RenderingEngine implements IRenderingEngine {
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayContext: CanvasRenderingContext2D | null = null;
  private borderElement: HTMLElement | null = null;

  // Border color scheme (can be overridden by config)
  private borderColors: BorderColorMap = {
    [HeadDirection.CENTER]: '#667eea',  // Match background gradient
    [HeadDirection.LEFT]: '#2196F3',    // Blue
    [HeadDirection.RIGHT]: '#FF9800',   // Orange
    [HeadDirection.UP]: '#9C27B0',      // Purple
    [HeadDirection.DOWN]: '#F44336'     // Red
  };

  // Rendering configuration (can be overridden by config)
  private landmarkColor: string = '#00FF00';
  private landmarkRadius: number = 2;

  /**
   * Initialize canvases and rendering context
   * @param config - Optional rendering configuration
   */
  initialize(
    overlayCanvas: HTMLCanvasElement,
    borderElement: HTMLElement,
    config?: RenderingConfig
  ): void {
    this.overlayCanvas = overlayCanvas;
    this.borderElement = borderElement;

    // Apply configuration if provided
    if (config) {
      this.landmarkColor = config.landmarkColor;
      this.landmarkRadius = config.landmarkRadius;
      this.borderColors = config.borderColors;
    }

    // Get 2D rendering context
    this.overlayContext = overlayCanvas.getContext('2d');

    if (!this.overlayContext) {
      throw new Error('Failed to get 2D rendering context from canvas element');
    }

    // Set initial border color
    this.updateBorder(HeadDirection.CENTER);
  }

  /**
   * Render a frame with optional landmarks
   */
  renderFrame(
    videoElement: HTMLVideoElement,
    trackingResult: FaceTrackingResult
  ): void {
    if (!this.overlayContext || !this.overlayCanvas) {
      throw new Error('RenderingEngine not initialized. Call initialize() first.');
    }

    // Draw video frame to overlay canvas
    this.overlayContext.drawImage(
      videoElement,
      0,
      0,
      this.overlayCanvas.width,
      this.overlayCanvas.height
    );

    // If face detected, draw landmarks on overlay canvas
    if (trackingResult.detected && trackingResult.landmarks.length > 0) {
      this.drawLandmarks(trackingResult.landmarks, this.overlayContext);
    }

    // Update border color based on direction
    this.updateBorder(trackingResult.direction);
  }

  /**
   * Update border color based on direction
   */
  updateBorder(direction: HeadDirection): void {
    if (!this.borderElement) {
      return;
    }

    const color = this.borderColors[direction];
    this.borderElement.style.borderColor = color;
  }

  /**
   * Clear all canvases
   */
  clear(): void {
    if (this.overlayContext && this.overlayCanvas) {
      this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  /**
   * Draw landmarks on canvas
   * @param landmarks - Array of facial landmarks
   * @param context - Canvas rendering context
   */
  private drawLandmarks(landmarks: Landmark[], context: CanvasRenderingContext2D): void {
    if (!this.overlayCanvas) {
      return;
    }

    const canvasWidth = this.overlayCanvas.width;
    const canvasHeight = this.overlayCanvas.height;

    // Comprehensive landmark indices for better face visualization
    const keyLandmarkIndices = [
      // Nose
      1, 2, 98, 327,
      
      // Left eye (complete outline)
      33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
      
      // Right eye (complete outline)
      362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398,
      
      // Left eyebrow
      70, 63, 105, 66, 107, 55, 65, 52, 53, 46,
      
      // Right eyebrow
      300, 293, 334, 296, 336, 285, 295, 282, 283, 276,
      
      // Mouth outer
      61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
      308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78,
      
      // Mouth inner
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
      
      // Face outline (more points for better definition)
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
      397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
      172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
      
      // Cheeks
      205, 425, 206, 203, 36, 266, 423, 426,
      
      // Chin
      152, 175, 171, 140, 194, 201, 200, 421, 418, 369, 395, 394
    ];

    context.fillStyle = this.landmarkColor;

    // Draw circles for each key landmark
    for (const index of keyLandmarkIndices) {
      if (index < landmarks.length) {
        const landmark = landmarks[index];
        
        // Convert normalized coordinates to canvas pixel coordinates
        const x = landmark.x * canvasWidth;
        const y = landmark.y * canvasHeight;

        context.beginPath();
        context.arc(x, y, this.landmarkRadius, 0, 2 * Math.PI);
        context.fill();
      }
    }
  }
}
