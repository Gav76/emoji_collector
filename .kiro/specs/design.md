# Orientation Estimator Application - Design Document

## Overview

The Orientation Estimator Application is a client-side web application that provides real-time face tracking and head orientation visualization. The application uses the device camera to capture video, processes it using a face mesh detection library, and displays both the raw feed and an annotated version with tracking points. A dynamic border provides immediate visual feedback about the user's head direction.

The application is built entirely with web technologies (HTML5, CSS3, JavaScript/TypeScript) and runs completely in the browser with no backend dependencies. All video processing happens client-side to ensure privacy and minimize latency.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Environment                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Application Layer (index.html)            │ │
│  │  - UI Layout                                           │ │
│  │  - Event Coordination                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────────┐│
│  │                                                          ││
│  ▼                        ▼                        ▼        ││
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ ││
│  │   Camera     │  │    Face      │  │   Rendering      │ ││
│  │   Manager    │  │   Tracker    │  │   Engine         │ ││
│  │              │  │              │  │                  │ ││
│  │ - Permission │  │ - Detection  │  │ - Canvas Draw    │ ││
│  │ - Stream     │  │ - Landmarks  │  │ - Border Update  │ ││
│  │ - Error      │  │ - Direction  │  │ - Sync Frames    │ ││
│  └──────────────┘  └──────────────┘  └──────────────────┘ ││
│         │                  │                    │           ││
│         └──────────────────┴────────────────────┘           ││
│                           │                                  ││
│  ┌────────────────────────▼────────────────────────────────┐││
│  │           MediaPipe Face Mesh Library                   │││
│  │           (External Dependency)                         │││
│  └─────────────────────────────────────────────────────────┘││
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Camera Manager**
- Requests and manages camera permissions
- Initializes video stream from getUserMedia API
- Handles camera errors and provides user feedback
- Manages video element lifecycle

**Face Tracker**
- Initializes MediaPipe Face Mesh model
- Processes video frames to detect facial landmarks
- Calculates head orientation from landmark positions
- Provides landmark coordinates and direction state

**Rendering Engine**
- Draws raw camera feed to first canvas
- Draws camera feed with landmark overlays to second canvas
- Updates border colors based on head direction
- Synchronizes both canvases to show the same frame

**Application Layer**
- Coordinates component initialization
- Manages application state
- Handles UI layout and responsiveness
- Provides error messaging to users

## Components and Interfaces

### CameraManager

**Purpose**: Manages camera access and video stream lifecycle

**Interface**:
```typescript
interface CameraManager {
  // Initialize camera and request permissions
  initialize(): Promise<MediaStream>;
  
  // Get the video element with active stream
  getVideoElement(): HTMLVideoElement;
  
  // Check if camera is currently active
  isActive(): boolean;
  
  // Stop camera stream and release resources
  stop(): void;
  
  // Event handlers
  onError(callback: (error: CameraError) => void): void;
  onReady(callback: () => void): void;
}

interface CameraError {
  type: 'permission_denied' | 'not_found' | 'not_readable' | 'unknown';
  message: string;
}
```

**Key Methods**:
- `initialize()`: Calls `navigator.mediaDevices.getUserMedia()` with video constraints, returns MediaStream
- `getVideoElement()`: Returns HTMLVideoElement with srcObject set to MediaStream
- `stop()`: Calls `stream.getTracks().forEach(track => track.stop())`

### FaceTracker

**Purpose**: Detects face and calculates head orientation

**Interface**:
```typescript
interface FaceTracker {
  // Initialize the face mesh model
  initialize(): Promise<void>;
  
  // Process a video frame and return results
  processFrame(videoElement: HTMLVideoElement): Promise<FaceTrackingResult>;
  
  // Check if model is ready
  isReady(): boolean;
  
  // Clean up resources
  dispose(): void;
}

interface FaceTrackingResult {
  detected: boolean;
  landmarks: Landmark[];
  direction: HeadDirection;
  confidence: number;
}

interface Landmark {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
  z: number;  // Depth (optional)
}

enum HeadDirection {
  CENTER = 'center',
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down'
}
```

**Key Methods**:
- `initialize()`: Loads MediaPipe Face Mesh model from CDN
- `processFrame()`: Runs face detection on current video frame, returns landmarks and calculated direction
- `calculateDirection()`: Internal method that analyzes landmark positions to determine head orientation

**Direction Calculation Logic**:
The head direction is calculated by analyzing the relative positions of key facial landmarks:
- **Left/Right**: Compare nose tip position to face center horizontal position
- **Up/Down**: Compare nose tip position to face center vertical position
- **Center**: When nose tip is within threshold of face center

Thresholds (normalized coordinates):
- Horizontal threshold: ±0.15 from center
- Vertical threshold: ±0.15 from center

### RenderingEngine

**Purpose**: Handles all visual rendering and UI updates

**Interface**:
```typescript
interface RenderingEngine {
  // Initialize canvases and rendering context
  initialize(
    rawCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
    borderElement: HTMLElement
  ): void;
  
  // Render a frame with optional landmarks
  renderFrame(
    videoElement: HTMLVideoElement,
    trackingResult: FaceTrackingResult
  ): void;
  
  // Update border color based on direction
  updateBorder(direction: HeadDirection): void;
  
  // Clear all canvases
  clear(): void;
}

interface BorderColorMap {
  [HeadDirection.CENTER]: string;
  [HeadDirection.LEFT]: string;
  [HeadDirection.RIGHT]: string;
  [HeadDirection.UP]: string;
  [HeadDirection.DOWN]: string;
}
```

**Key Methods**:
- `renderFrame()`: Draws video frame to both canvases, adds landmarks to overlay canvas
- `drawLandmarks()`: Internal method that draws circles/lines for facial landmarks
- `updateBorder()`: Changes border color with smooth CSS transition

**Border Color Scheme**:
- Center: Green (#4CAF50)
- Left: Blue (#2196F3)
- Right: Orange (#FF9800)
- Up: Purple (#9C27B0)
- Down: Red (#F44336)

### Application Controller

**Purpose**: Orchestrates all components and manages application lifecycle

**Interface**:
```typescript
interface ApplicationController {
  // Start the application
  start(): Promise<void>;
  
  // Stop the application
  stop(): void;
  
  // Get current application state
  getState(): ApplicationState;
}

interface ApplicationState {
  cameraActive: boolean;
  trackerReady: boolean;
  currentDirection: HeadDirection;
  fps: number;
  error: string | null;
}
```

**Key Methods**:
- `start()`: Initializes all components in sequence, starts render loop
- `renderLoop()`: Main animation loop using requestAnimationFrame
- `handleError()`: Displays error messages to user

## Data Models

### Landmark Data Structure

Landmarks are represented as normalized coordinates (0-1 range) relative to the video frame dimensions:

```typescript
interface Landmark {
  x: number;      // Horizontal position (0 = left, 1 = right)
  y: number;      // Vertical position (0 = top, 1 = bottom)
  z: number;      // Depth (optional, relative to face plane)
}
```

MediaPipe Face Mesh provides 468 landmarks. For this application, we'll use a subset of key landmarks:
- Nose tip (index 1)
- Left eye (indices 33, 133)
- Right eye (indices 362, 263)
- Mouth corners (indices 61, 291)
- Face outline (indices 10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109)

### Direction State

```typescript
enum HeadDirection {
  CENTER = 'center',
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down'
}
```

Direction is determined by comparing the nose tip position to the face center:
- If horizontal offset > threshold: LEFT or RIGHT
- If vertical offset > threshold: UP or DOWN
- Otherwise: CENTER

### Application Configuration

```typescript
interface AppConfig {
  camera: {
    width: number;          // Default: 640
    height: number;         // Default: 480
    facingMode: string;     // Default: 'user'
  };
  
  tracking: {
    minDetectionConfidence: number;  // Default: 0.5
    minTrackingConfidence: number;   // Default: 0.5
    directionThreshold: number;      // Default: 0.15
  };
  
  rendering: {
    targetFPS: number;               // Default: 30
    landmarkColor: string;           // Default: '#00FF00'
    landmarkRadius: number;          // Default: 2
  };
  
  borders: BorderColorMap;
}
```

## Data Flow

### Initialization Sequence

```
1. User loads page
   ↓
2. Application Controller starts
   ↓
3. Camera Manager requests permissions
   ↓
4. User grants/denies permission
   ↓
5. If granted: Initialize video stream
   ↓
6. Face Tracker loads MediaPipe model
   ↓
7. Rendering Engine initializes canvases
   ↓
8. Start render loop
```

### Frame Processing Loop

```
requestAnimationFrame callback:
   ↓
1. Check if video is ready
   ↓
2. Face Tracker processes current frame
   ↓
3. Get landmarks and direction
   ↓
4. Rendering Engine draws raw frame to canvas 1
   ↓
5. Rendering Engine draws frame + landmarks to canvas 2
   ↓
6. Rendering Engine updates border color
   ↓
7. Schedule next frame
```

### Error Handling Flow

```
Error occurs in any component
   ↓
Component calls error callback
   ↓
Application Controller receives error
   ↓
Display error message to user
   ↓
Stop render loop if critical error
   ↓
Provide recovery options (retry, etc.)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Camera stream initialization

*For any* successful camera permission grant, the video element should have a valid MediaStream assigned to its srcObject property and the stream should have at least one active video track.

**Validates: Requirements US-1.2, US-1.3**

### Property 2: Error handling for camera denial

*For any* camera permission denial or camera access error, the application should display an error message to the user and the error message should contain information about the error type.

**Validates: Requirements US-1.4**

### Property 3: Face detection activation

*For any* video element with a ready state of HAVE_ENOUGH_DATA, the face tracker should begin processing frames and return tracking results.

**Validates: Requirements US-2.1**

### Property 4: Landmark overlay rendering

*For any* face tracking result containing detected landmarks, the overlay canvas should have drawing operations performed on it that render the landmarks, while the raw canvas should only contain the video frame without landmarks.

**Validates: Requirements US-2.2, US-4.2, US-4.3**

### Property 5: Landmark completeness

*For any* detected face, the tracking result should contain at least 468 landmarks (MediaPipe Face Mesh standard) covering all major facial features including eyes, nose, mouth, and face outline.

**Validates: Requirements US-2.4**

### Property 6: Tracking responsiveness

*For any* two consecutive frames where the input video content differs, the landmark positions in the tracking results should also differ, demonstrating real-time tracking updates.

**Validates: Requirements US-2.3**

### Property 7: Direction-to-color mapping uniqueness

*For any* two different head directions (CENTER, LEFT, RIGHT, UP, DOWN), the border colors assigned to them should be distinct, and for any given direction, the border element should display the corresponding color.

**Validates: Requirements US-3.1, US-3.3**

### Property 8: Frame synchronization

*For any* render cycle, both the raw canvas and overlay canvas should be drawn using the same video frame timestamp, ensuring temporal consistency between the two displays.

**Validates: Requirements US-4.4**

### Property 9: Direction calculation consistency

*For any* set of facial landmarks, calculating the head direction multiple times with the same landmark data should always produce the same direction result (deterministic calculation).

**Validates: Requirements US-3.1** (implicit requirement for reliable direction detection)

### Property 10: Landmark coordinate normalization

*For any* landmark returned by the face tracker, the x and y coordinates should be normalized values between 0 and 1 inclusive, where (0,0) represents the top-left corner and (1,1) represents the bottom-right corner of the video frame.

**Validates: Requirements US-2.2** (implicit requirement for correct rendering)

## Error Handling

### Camera Errors

**Permission Denied**
- Error Type: `permission_denied`
- User Message: "Camera access was denied. Please grant camera permissions to use this application."
- Recovery: Provide button to retry permission request

**Camera Not Found**
- Error Type: `not_found`
- User Message: "No camera device found. Please connect a camera and refresh the page."
- Recovery: Provide refresh button

**Camera Not Readable**
- Error Type: `not_readable`
- User Message: "Camera is in use by another application. Please close other applications using the camera."
- Recovery: Provide retry button

**Unknown Camera Error**
- Error Type: `unknown`
- User Message: "An unexpected error occurred while accessing the camera. Please refresh the page."
- Recovery: Provide refresh button

### Face Tracking Errors

**Model Load Failure**
- Scenario: MediaPipe Face Mesh fails to load
- User Message: "Failed to load face tracking model. Please check your internet connection and refresh."
- Recovery: Provide refresh button

**Processing Error**
- Scenario: Error during frame processing
- Behavior: Log error to console, continue with next frame
- User Impact: Temporary loss of tracking (should recover automatically)

**No Face Detected**
- Scenario: No face visible in frame
- Behavior: Continue processing, show empty landmarks
- User Impact: Border remains at last known direction or defaults to center

### Rendering Errors

**Canvas Context Error**
- Scenario: Unable to get 2D context from canvas
- User Message: "Your browser does not support required graphics features."
- Recovery: Display browser compatibility message

**Performance Degradation**
- Scenario: FPS drops below threshold (15 FPS)
- Behavior: Log warning to console
- User Impact: Choppy visualization (graceful degradation)

### Error Recovery Strategy

1. **Transient Errors**: Retry automatically with exponential backoff
2. **Permission Errors**: Require user action to retry
3. **Fatal Errors**: Display error message and stop application
4. **Degraded Performance**: Continue operation with reduced quality

## Testing Strategy

### Dual Testing Approach

This application requires both unit tests and property-based tests to ensure comprehensive correctness:

**Unit Tests** focus on:
- Specific examples of camera initialization
- Edge cases like empty landmark arrays
- Error conditions and error message formatting
- DOM structure and element existence
- Integration between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Landmark coordinate normalization across all possible values
- Direction calculation consistency for any landmark configuration
- Frame synchronization across all render cycles
- Color mapping uniqueness for all direction combinations

### Property-Based Testing Configuration

**Library**: fast-check (for JavaScript/TypeScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: orientation-estimator-app, Property {N}: {property description}`
- Use custom generators for:
  - Landmark arrays (468 points with normalized coordinates)
  - Head direction enums
  - Video frame timestamps
  - MediaStream mock objects

**Example Test Structure**:
```typescript
// Feature: orientation-estimator-app, Property 7: Direction-to-color mapping uniqueness
test('different directions map to different colors', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...Object.values(HeadDirection)),
      fc.constantFrom(...Object.values(HeadDirection)),
      (dir1, dir2) => {
        if (dir1 === dir2) return true;
        const color1 = borderColorMap[dir1];
        const color2 = borderColorMap[dir2];
        return color1 !== color2;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Camera Manager Tests**:
- Test successful camera initialization with mock getUserMedia
- Test permission denial handling
- Test camera not found error
- Test stream cleanup on stop()

**Face Tracker Tests**:
- Test model initialization
- Test landmark extraction from mock results
- Test direction calculation with known landmark positions
- Test handling of no face detected

**Rendering Engine Tests**:
- Test canvas drawing operations are called
- Test border color updates
- Test frame synchronization logic
- Test landmark rendering with empty arrays

**Application Controller Tests**:
- Test initialization sequence
- Test error propagation
- Test render loop starts and stops correctly
- Test state management

### Integration Testing

**End-to-End Flow**:
1. Mock camera stream with test video
2. Verify face tracker processes frames
3. Verify both canvases receive updates
4. Verify border color changes with direction
5. Verify FPS meets target threshold

**Browser Compatibility Testing**:
- Test on Chrome, Firefox, Safari, Edge
- Verify getUserMedia API availability
- Verify Canvas API functionality
- Verify MediaPipe library loads correctly

### Performance Testing

**Metrics to Monitor**:
- Frame processing time (target: <33ms for 30 FPS)
- Memory usage over time (check for leaks)
- CPU usage (should remain reasonable)
- Time to first frame (target: <1 second after camera ready)

**Performance Test Scenarios**:
- Continuous operation for 5 minutes
- Rapid head movements
- Face entering and leaving frame
- Multiple browser tabs open

### Test Coverage Goals

- Unit test coverage: >80% of code
- Property test coverage: All 10 correctness properties
- Integration test coverage: All major user flows
- Browser compatibility: 4 major browsers

## Implementation Notes

### Technology Choices

**Face Tracking Library**: MediaPipe Face Mesh
- Rationale: Excellent accuracy, runs in browser, well-documented
- Alternative considered: TensorFlow.js Face Landmarks (less accurate)
- CDN: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh

**Rendering**: HTML5 Canvas 2D Context
- Rationale: Simple API, good performance for 2D overlays
- Alternative considered: WebGL (unnecessary complexity for this use case)

**Language**: TypeScript
- Rationale: Type safety helps prevent runtime errors, better IDE support
- Compiled to ES6 JavaScript for browser compatibility

### Performance Optimizations

1. **Frame Skipping**: If processing takes too long, skip frames to maintain responsiveness
2. **Landmark Subset**: Only draw key landmarks instead of all 468 to reduce rendering overhead
3. **RequestAnimationFrame**: Use browser's animation frame for optimal rendering timing
4. **Lazy Loading**: Load MediaPipe model only after camera is ready

### Browser Compatibility Considerations

**getUserMedia API**:
- Requires HTTPS (except localhost)
- Requires user permission
- Not available in older browsers (provide fallback message)

**Canvas API**:
- Widely supported
- Check for context availability before use

**MediaPipe**:
- Requires WebAssembly support
- Requires WebGL for optimal performance
- Provide error message for unsupported browsers

### Privacy Considerations

- All processing happens client-side (no data sent to servers)
- No video recording or storage
- No analytics or tracking of user faces
- Clear camera indicator when active (browser-provided)
- Application can be hosted as static files (no backend required)

### Deployment

**Hosting Requirements**:
- Static file hosting (GitHub Pages, Netlify, S3, etc.)
- HTTPS required for camera access
- No server-side processing needed

**Build Process**:
- TypeScript compilation to JavaScript
- Bundle with module bundler (optional, can use ES modules)
- Minification for production
- Source maps for debugging

**Files to Deploy**:
- index.html
- styles.css
- app.js (compiled from TypeScript)
- No backend or API required

