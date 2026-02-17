/**
 * CameraManager - Manages camera access and video stream lifecycle
 * 
 * Responsibilities:
 * - Request and manage camera permissions
 * - Initialize video stream from getUserMedia API
 * - Handle camera errors and provide user feedback
 * - Manage video element lifecycle
 */

export interface CameraError {
  type: 'permission_denied' | 'not_found' | 'not_readable' | 'unknown';
  message: string;
}

export interface CameraConfig {
  width: number;
  height: number;
  facingMode: string;
}

export interface ICameraManager {
  initialize(config?: CameraConfig): Promise<MediaStream>;
  getVideoElement(): HTMLVideoElement;
  isActive(): boolean;
  stop(): void;
  onError(callback: (error: CameraError) => void): void;
  onReady(callback: () => void): void;
}

export class CameraManager implements ICameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private errorCallback: ((error: CameraError) => void) | null = null;
  private readyCallback: (() => void) | null = null;

  /**
   * Initialize camera and request permissions
   * @param config - Optional camera configuration
   * @returns Promise<MediaStream> - The media stream from the camera
   */
  async initialize(config?: CameraConfig): Promise<MediaStream> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      // Use provided config or defaults
      const cameraConfig = config || { width: 640, height: 480, facingMode: 'user' };

      // Request camera access with video constraints
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: cameraConfig.width },
          height: { ideal: cameraConfig.height },
          facingMode: cameraConfig.facingMode
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element and attach stream
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (this.videoElement) {
          this.videoElement.onloadedmetadata = () => {
            resolve();
          };
        }
      });

      // Trigger ready callback
      if (this.readyCallback) {
        this.readyCallback();
      }

      return this.stream;
    } catch (error) {
      const cameraError = this.mapError(error);
      
      if (this.errorCallback) {
        this.errorCallback(cameraError);
      }
      
      throw cameraError;
    }
  }

  /**
   * Get the video element with active stream
   * @returns HTMLVideoElement - The video element
   */
  getVideoElement(): HTMLVideoElement {
    if (!this.videoElement) {
      throw new Error('Video element not initialized. Call initialize() first.');
    }
    return this.videoElement;
  }

  /**
   * Check if camera is currently active
   * @returns boolean - True if camera stream is active
   */
  isActive(): boolean {
    if (!this.stream) {
      return false;
    }

    const videoTracks = this.stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].readyState === 'live';
  }

  /**
   * Stop camera stream and release resources
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Register error callback
   * @param callback - Function to call when an error occurs
   */
  onError(callback: (error: CameraError) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Register ready callback
   * @param callback - Function to call when camera is ready
   */
  onReady(callback: () => void): void {
    this.readyCallback = callback;
  }

  /**
   * Map native errors to CameraError interface
   * @param error - The native error object
   * @returns CameraError - Mapped error with type and message
   */
  private mapError(error: any): CameraError {
    if (error instanceof DOMException || error?.name) {
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return {
            type: 'permission_denied',
            message: 'Camera access was denied. Please grant camera permissions to use this application.'
          };
        
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return {
            type: 'not_found',
            message: 'No camera device found. Please connect a camera and refresh the page.'
          };
        
        case 'NotReadableError':
        case 'TrackStartError':
          return {
            type: 'not_readable',
            message: 'Camera is in use by another application. Please close other applications using the camera.'
          };
        
        default:
          return {
            type: 'unknown',
            message: `An unexpected error occurred while accessing the camera: ${error.message || 'Unknown error'}`
          };
      }
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred while accessing the camera. Please refresh the page.'
    };
  }
}
