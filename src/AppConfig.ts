/**
 * AppConfig - Application configuration
 * 
 * Centralized configuration for camera, tracking, rendering, and border colors
 */

import { HeadDirection } from './FaceTracker.js';
import { BorderColorMap } from './RenderingEngine.js';

export interface AppConfig {
  camera: {
    width: number;
    height: number;
    facingMode: string;
  };
  
  tracking: {
    minDetectionConfidence: number;
    minTrackingConfidence: number;
    directionThreshold: number;
  };
  
  rendering: {
    targetFPS: number;
    landmarkColor: string;
    landmarkRadius: number;
  };
  
  borders: BorderColorMap;
}

export const DEFAULT_CONFIG: AppConfig = {
  camera: {
    width: 640,
    height: 480,
    facingMode: 'user'
  },
  
  tracking: {
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    directionThreshold: 0.05  // Lowered from 0.15 for more sensitivity
  },
  
  rendering: {
    targetFPS: 30,
    landmarkColor: '#00FF00',
    landmarkRadius: 2
  },
  
  borders: {
    [HeadDirection.CENTER]: '#667eea',  // Match background gradient
    [HeadDirection.LEFT]: '#2196F3',    // Blue
    [HeadDirection.RIGHT]: '#FF9800',   // Orange
    [HeadDirection.UP]: '#9C27B0',      // Purple
    [HeadDirection.DOWN]: '#F44336'     // Red
  }
};
