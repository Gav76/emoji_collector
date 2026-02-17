/**
 * ApplicationController - Orchestrates all components and manages application lifecycle
 * 
 * Responsibilities:
 * - Initialize all components in sequence
 * - Manage render loop using requestAnimationFrame
 * - Handle errors and display to user
 * - Track application state (FPS, direction, etc.)
 */

import { CameraManager, CameraError, CameraConfig } from './CameraManager.js';
import { FaceTracker, HeadDirection, TrackingConfig } from './FaceTracker.js';
import { RenderingEngine, RenderingConfig } from './RenderingEngine.js';
import { AppConfig } from './AppConfig.js';

export interface ApplicationState {
  cameraActive: boolean;
  trackerReady: boolean;
  currentDirection: HeadDirection;
  fps: number;
  error: string | null;
  emoji?: string;
  expression?: string;
}

export interface IApplicationController {
  start(): Promise<void>;
  stop(): void;
  getState(): ApplicationState;
}

export class ApplicationController implements IApplicationController {
  private cameraManager: CameraManager;
  private faceTracker: FaceTracker;
  private renderingEngine: RenderingEngine;
  private config: AppConfig;
  
  private state: ApplicationState = {
    cameraActive: false,
    trackerReady: false,
    currentDirection: HeadDirection.CENTER,
    fps: 0,
    error: null,
    emoji: '😐',
    expression: 'neutral'
  };

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = 0;
  private isProcessing: boolean = false;
  private frameBudget: number = 33; // 33ms for 30 FPS target

  constructor(
    cameraManager: CameraManager,
    faceTracker: FaceTracker,
    renderingEngine: RenderingEngine,
    config: AppConfig
  ) {
    this.cameraManager = cameraManager;
    this.faceTracker = faceTracker;
    this.renderingEngine = renderingEngine;
    this.config = config;
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      // Set up error handler for camera
      this.cameraManager.onError((error: CameraError) => {
        this.handleError(error.message);
      });

      // Initialize camera and request permissions with config
      await this.cameraManager.initialize(this.config.camera);
      this.state.cameraActive = true;

      // Initialize face tracker and load MediaPipe model with config
      await this.faceTracker.initialize(this.config.tracking);
      this.state.trackerReady = true;

      // Start render loop
      this.lastFrameTime = performance.now();
      this.lastFpsUpdate = performance.now();
      this.renderLoop();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.handleError(errorMessage);
      throw error;
    }
  }

  /**
   * Stop the application
   */
  stop(): void {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop camera
    this.cameraManager.stop();
    this.state.cameraActive = false;

    // Dispose face tracker
    this.faceTracker.dispose();
    this.state.trackerReady = false;

    // Clear canvases
    this.renderingEngine.clear();
  }

  /**
   * Get current application state
   */
  getState(): ApplicationState {
    return { ...this.state };
  }

  /**
   * Main render loop using requestAnimationFrame
   */
  private renderLoop = (): void => {
    try {
      const videoElement = this.cameraManager.getVideoElement();

      // Check if video is ready
      if (videoElement.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // Skip frame if still processing previous frame
        if (!this.isProcessing) {
          this.isProcessing = true;
          const frameStartTime = performance.now();

          // Process frame with face tracker
          this.faceTracker.processFrame(videoElement).then(trackingResult => {
            // Render frame with tracking result
            this.renderingEngine.renderFrame(videoElement, trackingResult);

            // Update state
            this.state.currentDirection = trackingResult.direction;
            this.state.emoji = trackingResult.emoji;
            this.state.expression = trackingResult.expression;

            // Update FPS
            this.updateFPS();

            // Check processing time
            const processingTime = performance.now() - frameStartTime;
            if (processingTime > this.frameBudget) {
              console.warn(`Frame processing took ${processingTime.toFixed(2)}ms (budget: ${this.frameBudget}ms)`);
            }

            this.isProcessing = false;
          }).catch(error => {
            console.error('Error processing frame:', error);
            this.isProcessing = false;
          });
        }
      }

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(this.renderLoop);

    } catch (error) {
      console.error('Error in render loop:', error);
      // Continue loop even on error
      this.animationFrameId = requestAnimationFrame(this.renderLoop);
    }
  };

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    const currentTime = performance.now();
    this.frameCount++;

    // Update FPS every second
    if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.state.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  /**
   * Handle errors and display to user
   */
  private handleError(message: string): void {
    this.state.error = message;
    console.error('Application error:', message);

    // Display error in UI
    const errorDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorDiv && errorText) {
      errorText.textContent = message;
      errorDiv.classList.remove('hidden');
    }

    // Hide loading indicator
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
      loadingDiv.classList.add('hidden');
    }
  }
}
