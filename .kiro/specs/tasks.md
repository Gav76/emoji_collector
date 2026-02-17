# Implementation Plan: Orientation Estimator Application

## Overview

This implementation plan breaks down the Orientation Estimator Application into discrete, manageable tasks. The application is a client-side web app that uses MediaPipe Face Mesh for real-time face tracking and displays both raw camera feed and annotated overlay with dynamic border colors indicating head direction.

The implementation follows a bottom-up approach: core utilities first, then individual components, followed by integration and testing.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create project directory structure (src/, dist/, tests/)
  - Initialize package.json with TypeScript and testing dependencies
  - Configure TypeScript (tsconfig.json) for ES6 target
  - Set up HTML5 boilerplate (index.html) with two canvas elements and container divs
  - Create basic CSS file (styles.css) with layout for dual frames and border container
  - Add MediaPipe Face Mesh CDN link to HTML
  - Add fast-check library for property-based testing
  - _Requirements: TC-1, TC-2_

- [ ] 2. Implement Camera Manager component
  - [x] 2.1 Create CameraManager class with TypeScript interfaces
    - Define CameraManager interface with initialize(), getVideoElement(), isActive(), stop() methods
    - Define CameraError interface with type and message fields
    - Implement initialize() method using navigator.mediaDevices.getUserMedia()
    - Set video constraints (640x480, facingMode: 'user')
    - Implement getVideoElement() to return HTMLVideoElement with stream
    - Implement stop() to release all media tracks
    - Implement error callback registration (onError, onReady)
    - _Requirements: US-1.1, US-1.2, FR-1_

  - [ ]* 2.2 Write property test for camera stream initialization
    - **Property 1: Camera stream initialization**
    - **Validates: Requirements US-1.2, US-1.3**

  - [ ]* 2.3 Write unit tests for Camera Manager
    - Test successful initialization with mock getUserMedia
    - Test permission denial error handling
    - Test camera not found error handling
    - Test stream cleanup on stop()
    - Test error callback invocation
    - _Requirements: US-1.4, FR-1_

- [ ] 3. Implement Face Tracker component
  - [x] 3.1 Create FaceTracker class with TypeScript interfaces
    - Define FaceTracker interface with initialize(), processFrame(), isReady(), dispose() methods
    - Define FaceTrackingResult interface with detected, landmarks, direction, confidence fields
    - Define Landmark interface with x, y, z coordinates
    - Define HeadDirection enum (CENTER, LEFT, RIGHT, UP, DOWN)
    - Implement initialize() to load MediaPipe Face Mesh model from CDN
    - Set minDetectionConfidence and minTrackingConfidence to 0.5
    - _Requirements: US-2.1, US-2.2, FR-2_

  - [x] 3.2 Implement frame processing and landmark extraction
    - Implement processFrame() to accept HTMLVideoElement and return Promise<FaceTrackingResult>
    - Call MediaPipe Face Mesh send() method with video frame
    - Extract 468 landmarks from results
    - Normalize landmark coordinates to 0-1 range
    - Handle case when no face is detected (return detected: false)
    - _Requirements: US-2.2, US-2.3, US-2.4, FR-2_

  - [ ]* 3.3 Write property test for landmark coordinate normalization
    - **Property 10: Landmark coordinate normalization**
    - **Validates: Requirements US-2.2**

  - [x] 3.4 Implement head direction calculation
    - Create calculateDirection() method that analyzes landmark positions
    - Get nose tip landmark (index 1) and face center
    - Calculate horizontal offset (nose x - center x)
    - Calculate vertical offset (nose y - center y)
    - Apply thresholds (±0.15) to determine direction
    - Return LEFT if horizontal offset > 0.15
    - Return RIGHT if horizontal offset < -0.15
    - Return UP if vertical offset < -0.15
    - Return DOWN if vertical offset > 0.15
    - Return CENTER otherwise
    - _Requirements: US-3.1, FR-3_

  - [ ]* 3.5 Write property test for direction calculation consistency
    - **Property 9: Direction calculation consistency**
    - **Validates: Requirements US-3.1**

  - [x]* 3.6 Write unit tests for Face Tracker
    - Test model initialization
    - Test landmark extraction with mock MediaPipe results
    - Test direction calculation with known landmark positions (center, left, right, up, down)
    - Test handling of no face detected scenario
    - Test confidence values are within valid range
    - _Requirements: US-2.1, US-2.4, FR-2, FR-3_

- [x] 4. Checkpoint - Ensure core components build and pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Rendering Engine component
  - [x] 5.1 Create RenderingEngine class with TypeScript interfaces
    - Define RenderingEngine interface with initialize(), renderFrame(), updateBorder(), clear() methods
    - Define BorderColorMap interface mapping HeadDirection to color strings
    - Implement initialize() to accept two canvas elements and border element
    - Get 2D rendering contexts for both canvases
    - Store references to canvas contexts and border element
    - Define border color scheme (CENTER: green, LEFT: blue, RIGHT: orange, UP: purple, DOWN: red)
    - _Requirements: US-4.1, US-4.2, FR-4_

  - [x] 5.2 Implement frame rendering methods
    - Implement renderFrame() to accept video element and tracking result
    - Draw video frame to raw canvas using drawImage()
    - Draw video frame to overlay canvas using drawImage()
    - If face detected, call drawLandmarks() on overlay canvas
    - Call updateBorder() with current direction
    - _Requirements: US-4.2, US-4.3, US-4.4, FR-4_

  - [x] 5.3 Implement landmark drawing
    - Create drawLandmarks() method that accepts landmarks array and canvas context
    - Convert normalized coordinates to canvas pixel coordinates
    - Draw circles for each landmark (radius: 2px, color: #00FF00)
    - Focus on key landmarks: nose, eyes, mouth, face outline
    - Use subset of landmarks for performance (not all 468)
    - _Requirements: US-2.2, US-2.4_

  - [x] 5.4 Implement border color updates
    - Implement updateBorder() to accept HeadDirection
    - Map direction to color using BorderColorMap
    - Update border element's CSS border-color property
    - Add CSS transition for smooth color changes (0.3s ease)
    - _Requirements: US-3.1, US-3.3_

  - [ ]* 5.5 Write property test for direction-to-color mapping uniqueness
    - **Property 7: Direction-to-color mapping uniqueness**
    - **Validates: Requirements US-3.1, US-3.3**

  - [ ]* 5.6 Write property test for landmark overlay rendering
    - **Property 4: Landmark overlay rendering**
    - **Validates: Requirements US-2.2, US-4.2, US-4.3**

  - [ ]* 5.7 Write unit tests for Rendering Engine
    - Test canvas drawing operations are called with correct parameters
    - Test border color updates with each direction
    - Test landmark rendering with empty arrays (edge case)
    - Test clear() method resets canvases
    - _Requirements: US-3.3, US-4.2, US-4.3, FR-4_

- [ ] 6. Implement Application Controller
  - [x] 6.1 Create ApplicationController class with TypeScript interfaces
    - Define ApplicationController interface with start(), stop(), getState() methods
    - Define ApplicationState interface with cameraActive, trackerReady, currentDirection, fps, error fields
    - Implement constructor to initialize component references
    - Create instance variables for CameraManager, FaceTracker, RenderingEngine
    - _Requirements: FR-1, FR-2, FR-4_

  - [x] 6.2 Implement initialization sequence
    - Implement start() method as async function
    - Initialize CameraManager and request camera permissions
    - Wait for camera stream to be ready
    - Initialize FaceTracker and load MediaPipe model
    - Initialize RenderingEngine with canvas and border elements
    - Set up error handlers for each component
    - Start render loop after all components ready
    - _Requirements: US-1.1, US-2.1, FR-1, FR-2_

  - [ ]* 6.3 Write property test for face detection activation
    - **Property 3: Face detection activation**
    - **Validates: Requirements US-2.1**

  - [x] 6.4 Implement render loop
    - Create renderLoop() method using requestAnimationFrame
    - Check if video element has readyState >= HAVE_ENOUGH_DATA
    - Call FaceTracker.processFrame() with video element
    - Pass tracking result to RenderingEngine.renderFrame()
    - Calculate and update FPS in application state
    - Schedule next frame with requestAnimationFrame
    - Handle errors gracefully and continue loop
    - _Requirements: US-2.3, US-4.4, FR-4, FR-5_

  - [ ]* 6.5 Write property test for frame synchronization
    - **Property 8: Frame synchronization**
    - **Validates: Requirements US-4.4**

  - [ ]* 6.6 Write property test for tracking responsiveness
    - **Property 6: Tracking responsiveness**
    - **Validates: Requirements US-2.3**

  - [x] 6.5 Implement error handling
    - Create handleError() method that accepts error type and message
    - Display error message in UI (create error message div in HTML)
    - Map CameraError types to user-friendly messages
    - Provide retry buttons for recoverable errors
    - Stop render loop for fatal errors
    - Log errors to console for debugging
    - _Requirements: US-1.4, FR-1_

  - [ ]* 6.6 Write property test for error handling
    - **Property 2: Error handling for camera denial**
    - **Validates: Requirements US-1.4**

  - [ ]* 6.7 Write unit tests for Application Controller
    - Test initialization sequence with mocked components
    - Test render loop starts and stops correctly
    - Test error propagation from components
    - Test state management (getState returns correct values)
    - Test FPS calculation accuracy
    - _Requirements: FR-1, FR-2, FR-4, FR-5_

- [x] 7. Checkpoint - Ensure all components integrate correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement application configuration
  - [x] 8.1 Create AppConfig interface and default configuration
    - Define AppConfig interface with camera, tracking, rendering, borders sections
    - Set default camera config (width: 640, height: 480, facingMode: 'user')
    - Set default tracking config (minDetectionConfidence: 0.5, minTrackingConfidence: 0.5, directionThreshold: 0.15)
    - Set default rendering config (targetFPS: 30, landmarkColor: '#00FF00', landmarkRadius: 2)
    - Set border color map (center: #4CAF50, left: #2196F3, right: #FF9800, up: #9C27B0, down: #F44336)
    - Export configuration as constant
    - _Requirements: FR-2, FR-3, FR-4_

  - [x] 8.2 Update components to use configuration
    - Pass camera config to CameraManager.initialize()
    - Pass tracking config to FaceTracker.initialize()
    - Pass rendering config to RenderingEngine
    - Pass border colors to RenderingEngine
    - _Requirements: FR-2, FR-3, FR-4_

- [ ] 9. Implement UI and styling
  - [x] 9.1 Complete HTML structure
    - Create container div for entire application
    - Create frames container with two canvas elements side by side
    - Add labels for "Raw Feed" and "Tracked Feed"
    - Create border wrapper div around frames container
    - Create error message div (hidden by default)
    - Add loading indicator for initialization
    - Ensure semantic HTML structure
    - _Requirements: US-4.1, US-4.2, NFR-2_

  - [x] 9.2 Complete CSS styling
    - Style container with centered layout and max-width
    - Style frames container with flexbox for side-by-side layout
    - Style canvas elements with fixed dimensions and border
    - Style border wrapper with thick border and transition
    - Style labels with clear typography
    - Style error message div with prominent styling
    - Add responsive design for different screen sizes
    - Ensure sufficient color contrast for accessibility
    - _Requirements: US-3.3, US-4.1, NFR-2, NFR-4_

  - [ ]* 9.3 Write unit tests for UI structure
    - Test all required DOM elements exist
    - Test canvas elements have correct dimensions
    - Test border element has transition CSS property
    - Test error message div is hidden by default
    - _Requirements: US-4.1, NFR-2_

- [ ] 10. Implement main application entry point
  - [x] 10.1 Create main.ts entry point
    - Import all component classes
    - Import AppConfig
    - Create DOMContentLoaded event listener
    - Get references to all DOM elements (canvases, border, error div)
    - Instantiate ApplicationController with components
    - Call ApplicationController.start()
    - Handle initialization errors and display to user
    - _Requirements: FR-1, FR-2, FR-4_

  - [x] 10.2 Add browser compatibility checks
    - Check for getUserMedia API availability
    - Check for Canvas API availability
    - Check for WebAssembly support (required by MediaPipe)
    - Display compatibility error message if checks fail
    - Provide list of supported browsers
    - _Requirements: NFR-1_

  - [ ]* 10.3 Write integration tests for end-to-end flow
    - Test initialization sequence with mocked camera and MediaPipe
    - Test frame processing updates both canvases
    - Test border color changes with direction changes
    - Test error handling displays error message
    - Test application stops cleanly
    - _Requirements: US-1, US-2, US-3, US-4_

- [ ] 11. Implement performance optimizations
  - [x] 11.1 Add frame skipping logic
    - Track processing time for each frame
    - If processing time exceeds frame budget (33ms for 30 FPS), skip next frame
    - Log performance warnings to console
    - _Requirements: FR-5, NFR-2_

  - [x] 11.2 Optimize landmark rendering
    - Create subset of key landmarks to draw (nose, eyes, mouth, outline)
    - Use landmark indices: 1, 33, 133, 362, 263, 61, 291, and face outline points
    - Reduce total landmarks drawn from 468 to ~50 key points
    - _Requirements: FR-5_

  - [x] 11.3 Add lazy loading for MediaPipe
    - Load MediaPipe model only after camera is ready
    - Show loading indicator during model load
    - _Requirements: NFR-2_

  - [ ]* 11.4 Write performance tests
    - Test frame processing time is under 33ms target
    - Test memory usage doesn't grow over 5 minutes
    - Test FPS maintains target of 30 FPS
    - _Requirements: FR-5, NFR-2_

- [ ] 12. Final integration and polish
  - [x] 12.1 Add loading states and user feedback
    - Show loading spinner during camera initialization
    - Show loading spinner during model load
    - Display "Camera ready" message when initialization complete
    - Display "No face detected" message when appropriate
    - _Requirements: NFR-2_

  - [x] 12.2 Add keyboard navigation support
    - Add keyboard shortcut to stop/start camera (Space key)
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators for accessibility
    - _Requirements: NFR-4_

  - [x] 12.3 Verify privacy requirements
    - Confirm no video data is sent to servers (all client-side)
    - Confirm no video/image storage occurs
    - Add privacy notice to UI
    - _Requirements: NFR-3_

  - [ ]* 12.4 Write property test for landmark completeness
    - **Property 5: Landmark completeness**
    - **Validates: Requirements US-2.4**

  - [ ]* 12.5 Write browser compatibility tests
    - Test on Chrome (mock environment)
    - Test on Firefox (mock environment)
    - Test on Safari (mock environment)
    - Test on Edge (mock environment)
    - Verify getUserMedia API works across browsers
    - _Requirements: NFR-1_

- [x] 13. Final checkpoint - Complete testing and validation
  - Run all unit tests and ensure they pass
  - Run all property-based tests with 100+ iterations
  - Verify all 10 correctness properties are validated
  - Test application manually in browser
  - Verify camera feed displays correctly
  - Verify face tracking works in real-time
  - Verify border colors change with head direction
  - Verify error handling works for camera denial
  - Check performance metrics (FPS, memory, CPU)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- All property tests are tagged with: `Feature: orientation-estimator-app, Property {N}: {description}`
- TypeScript provides type safety throughout the implementation
- MediaPipe Face Mesh is loaded from CDN (no local installation needed)
- Application is entirely client-side (no backend required)
- HTTPS is required for camera access (except on localhost)
- Target browsers: Chrome, Firefox, Safari, Edge (latest versions)
