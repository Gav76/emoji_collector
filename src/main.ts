/**
 * Main application entry point
 * 
 * Initializes all components and starts the application
 */

import { CameraManager } from './CameraManager.js';
import { FaceTracker } from './FaceTracker.js';
import { RenderingEngine } from './RenderingEngine.js';
import { ApplicationController } from './ApplicationController.js';
import { DEFAULT_CONFIG } from './AppConfig.js';

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility(): { compatible: boolean; message?: string } {
  // Check for getUserMedia API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      compatible: false,
      message: 'Your browser does not support camera access (getUserMedia API). Please use a modern browser like Chrome, Firefox, Safari, or Edge.'
    };
  }

  // Check for Canvas API
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    return {
      compatible: false,
      message: 'Your browser does not support the Canvas API. Please use a modern browser like Chrome, Firefox, Safari, or Edge.'
    };
  }

  // Check for WebAssembly (required by MediaPipe)
  if (typeof WebAssembly === 'undefined') {
    return {
      compatible: false,
      message: 'Your browser does not support WebAssembly, which is required for face tracking. Please update your browser to the latest version.'
    };
  }

  // Check if MediaPipe FaceMesh is loaded
  if (typeof (window as any).FaceMesh === 'undefined') {
    return {
      compatible: false,
      message: 'MediaPipe Face Mesh library failed to load. Please check your internet connection and refresh the page.'
    };
  }

  return { compatible: true };
}

/**
 * Display error message to user
 */
function displayError(message: string): void {
  const errorDiv = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  const loadingDiv = document.getElementById('loading-indicator');

  if (loadingDiv) {
    loadingDiv.classList.add('hidden');
  }

  if (errorDiv && errorText) {
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

/**
 * Hide loading indicator
 */
function hideLoading(): void {
  const loadingDiv = document.getElementById('loading-indicator');
  if (loadingDiv) {
    loadingDiv.classList.add('hidden');
  }
}

/**
 * Update UI with application state
 */
const emojiCounts: Record<string, number> = {
  neutral: 0,
  happy: 0,
  very_happy: 0,
  sad: 0,
  surprised: 0,
  angry: 0,
  wink: 0,
  kiss: 0,
  tongue_out: 0,
  thinking: 0,
  sleepy: 0,
  confused: 0
};

let lastExpression: string = '';
let lastRecognitionTime: number = 0;
const RECOGNITION_INTERVAL = 1000; // 1 second between recognitions

function updateUI(controller: ApplicationController): void {
  const state = controller.getState();

  // Update direction display
  const directionSpan = document.getElementById('current-direction');
  if (directionSpan) {
    directionSpan.textContent = state.currentDirection.toUpperCase();
  }

  // Update emoji display
  const emojiSpan = document.getElementById('current-emoji');
  if (emojiSpan && state.emoji) {
    emojiSpan.textContent = state.emoji;
  }

  // Update emoji collection counters (throttled to once per second)
  const currentTime = Date.now();
  if (state.expression && 
      state.expression !== lastExpression && 
      currentTime - lastRecognitionTime >= RECOGNITION_INTERVAL) {
    
    lastExpression = state.expression;
    lastRecognitionTime = currentTime;
    
    // Increment counter for this expression
    if (emojiCounts.hasOwnProperty(state.expression)) {
      emojiCounts[state.expression]++;
      
      // Update the counter display
      const emojiItem = document.querySelector(`[data-expression="${state.expression}"]`);
      if (emojiItem) {
        const countSpan = emojiItem.querySelector('.emoji-count');
        if (countSpan) {
          countSpan.textContent = emojiCounts[state.expression].toString();
        }
        
        // Highlight the active emoji
        document.querySelectorAll('.emoji-item').forEach(item => item.classList.remove('active'));
        emojiItem.classList.add('active');
        
        // Remove highlight after 800ms
        setTimeout(() => {
          emojiItem.classList.remove('active');
        }, 800);
      }
    }
  }

  // Update FPS display
  const fpsSpan = document.getElementById('current-fps');
  if (fpsSpan) {
    fpsSpan.textContent = state.fps.toString();
  }

  // Update face detection status
  const faceStatus = document.getElementById('face-status');
  if (faceStatus) {
    if (state.currentDirection === 'center' && state.fps > 0) {
      faceStatus.classList.add('hidden');
    }
  }

  // Schedule next update
  requestAnimationFrame(() => updateUI(controller));
}

/**
 * Initialize and start the application
 */
async function initializeApplication(): Promise<void> {
  try {
    // Check browser compatibility
    const compatibilityCheck = checkBrowserCompatibility();
    if (!compatibilityCheck.compatible) {
      displayError(compatibilityCheck.message!);
      return;
    }

    // Get DOM elements
    const overlayCanvas = document.getElementById('overlay-canvas') as HTMLCanvasElement;
    const borderWrapper = document.getElementById('border-wrapper') as HTMLElement;
    const retryButton = document.getElementById('retry-button') as HTMLButtonElement;

    if (!overlayCanvas || !borderWrapper) {
      throw new Error('Required DOM elements not found');
    }

    // Create component instances
    const cameraManager = new CameraManager();
    const faceTracker = new FaceTracker();
    const renderingEngine = new RenderingEngine();

    // Initialize rendering engine with config
    renderingEngine.initialize(
      overlayCanvas,
      borderWrapper,
      {
        landmarkColor: DEFAULT_CONFIG.rendering.landmarkColor,
        landmarkRadius: DEFAULT_CONFIG.rendering.landmarkRadius,
        borderColors: DEFAULT_CONFIG.borders
      }
    );

    // Create application controller
    const controller = new ApplicationController(
      cameraManager,
      faceTracker,
      renderingEngine,
      DEFAULT_CONFIG
    );

    // Set up retry button
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        // Reload the page to retry
        window.location.reload();
      });
    }

    // Start the application
    await controller.start();

    // Hide loading indicator
    hideLoading();

    // Start UI updates
    updateUI(controller);

    // Add keyboard navigation support
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        // Toggle camera on/off
        const state = controller.getState();
        if (state.cameraActive) {
          controller.stop();
          displayError('Camera stopped. Press Space or click Retry to restart.');
        }
      }
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    displayError(errorMessage);
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  // DOM is already ready
  initializeApplication();
}

// Add global error handler for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  displayError(`Error: ${event.error?.message || 'Unknown error'}`);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  displayError(`Error: ${event.reason?.message || 'Unknown error'}`);
});
