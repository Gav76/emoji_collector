# Emoji Collector Application - Requirements

## Feature Name
orientation-estimator-app

## Overview
A gamified single-page web application that uses the device camera to track the user's face in real-time, detecting facial expressions and matching them to emojis. The application displays a tracked camera feed with facial landmarks overlay and provides visual feedback through a dynamic border that changes color based on head direction. Users collect emojis by making different facial expressions, with counters tracking how many times each expression has been detected.

## User Stories

### US-1: Camera Access and Display
**As a** user  
**I want** to see my camera feed displayed on the webpage  
**So that** I can see myself while the face tracking is active

**Acceptance Criteria:**
- The application requests camera permission on load
- Camera feed is displayed with facial landmarks overlay
- Camera feed displays at 640x480 resolution minimum
- User receives clear feedback if camera access is denied
- Loading indicators show during camera initialization and model loading

### US-2: Face Detection and Tracking
**As a** user  
**I want** the application to detect and track my face  
**So that** I can see real-time tracking of my facial features

**Acceptance Criteria:**
- Face detection activates automatically when camera feed is available
- 150+ facial landmarks are tracked and displayed (eyes, eyebrows, nose, mouth, face outline, cheeks, chin)
- Tracking points update in real-time as the user moves
- Landmarks are rendered as small green circles (2px radius)
- "No face detected" message appears when face is not in frame
- Tracking maintains accuracy with head movements

### US-3: Head Direction Visualization
**As a** user  
**I want** a visual indicator that shows which direction I'm looking  
**So that** I can see immediate feedback on my head orientation

**Acceptance Criteria:**
- Border around the video frame changes color based on head direction
- Color changes are smooth with 0.3s CSS transitions
- Five head directions detected: LEFT (blue), RIGHT (orange), UP (purple), DOWN (red), CENTER (matches background gradient)
- Direction threshold of 0.05 provides responsive detection
- Camera mirror effect is corrected (negative offset = right, positive = left)
- Direction indicator displays current direction as text

### US-4: Emoji Expression Detection and Collection
**As a** user  
**I want** the application to detect my facial expressions and match them to emojis  
**So that** I can play a game collecting different expressions

**Acceptance Criteria:**
- 12 different expressions are detected: Neutral 😐, Happy 🙂, Very Happy 😄, Sad 😢, Surprised 😮, Angry 😠, Wink 😉, Kiss 😘, Tongue Out 😛, Thinking 🤔, Sleepy 😴, Confused 😕
- Expression detection uses multiple facial metrics: mouth openness, smile level, eyebrow raise, eye openness, mouth width, lip pucker, head tilt
- Smoothing algorithm requires 2 stable frames to prevent flickering
- All 12 emojis displayed in a responsive grid (2 rows of 6) above the video feed
- Each emoji card shows: emoji icon, label, and counter (starts at 0)
- Active emoji is highlighted with purple border and scale animation
- Counter increments when expression is detected
- Recognition is throttled to once per second to prevent rapid counting
- Highlight duration is 800ms for clear visual feedback

### US-5: Responsive Design
**As a** user  
**I want** the application to work on different screen sizes  
**So that** I can use it on various devices

**Acceptance Criteria:**
- Fully responsive layout with media queries for 1200px, 768px, and 480px breakpoints
- Canvas scales appropriately on all screen sizes
- Emoji grid uses `repeat(auto-fit, minmax(120px, 1fr))` for flexible layout
- Typography and spacing adjust for mobile devices
- Application maintains usability on screens as small as 480px wide
- Background gradient and styling remain visually appealing across all sizes

## Functional Requirements

### FR-1: Camera Integration
- Application must request and obtain camera permissions
- Support for 640x480 webcam resolution with 'user' facing mode
- Handle camera access errors gracefully with user-friendly messages
- Display appropriate error messages for permission denial, camera not found, and other issues
- Provide retry functionality for recoverable errors
- Show loading spinner during camera initialization

### FR-2: Face Tracking Engine
- Implement real-time face detection using MediaPipe Face Mesh from CDN
- Track all 468 facial landmarks provided by MediaPipe
- Render 150+ key landmarks for detailed visualization
- Maintain tracking at 30 FPS target for smooth visualization
- Handle scenarios where face is temporarily not detected
- Set minDetectionConfidence and minTrackingConfidence to 0.5
- Lazy load MediaPipe model after camera is ready

### FR-3: Head Direction Detection
- Calculate head orientation from nose tip (landmark 1) relative to face center
- Detect 5 directions: LEFT, RIGHT, UP, DOWN, CENTER
- Use threshold of 0.05 for horizontal and vertical offsets
- Correct for camera mirror effect in direction calculation
- Provide smooth transitions between direction states
- Update direction detection in real-time with each frame

### FR-4: Emoji Expression Detection
- Analyze facial landmarks to calculate expression metrics:
  - Mouth openness (vertical distance between lips)
  - Smile level (mouth corner elevation)
  - Eyebrow raise (eyebrow to eye distance)
  - Eye openness (vertical eye distance)
  - Mouth width (horizontal mouth distance)
  - Lip pucker (lip protrusion)
  - Head tilt (face rotation angle)
- Implement 12 distinct expression detection algorithms
- Use multi-point averaging for accuracy (4 points per eye, 3 per eyebrow, etc.)
- Apply smoothing with 2-frame stability requirement
- Throttle recognition to 1-second intervals
- Track and display counters for each expression

### FR-5: Visual Rendering
- Render single canvas with video feed and landmark overlay
- Overlay 150+ tracking points with clear visibility (green circles, 2px radius)
- Implement dynamic border color system with CSS transitions (0.3s ease)
- Display emoji collection grid with responsive layout
- Show active emoji with highlight animation (purple border, scale effect)
- Display direction indicator and FPS counter
- Ensure responsive layout that works on different screen sizes (1200px, 768px, 480px breakpoints)

### FR-6: Performance
- Maintain smooth frame rate (target 30 FPS for camera feed)
- Implement frame skipping logic when processing exceeds 33ms budget
- Keep CPU usage reasonable for typical devices
- Optimize rendering to prevent lag or stuttering
- Log performance warnings to console when needed

### FR-7: AWS Deployment
- Provide CloudFormation template for infrastructure as code
- Deploy to S3 bucket with versioning enabled
- Configure CloudFront distribution with Origin Access Identity (OAI)
- Enforce HTTPS with redirect-to-https viewer protocol policy
- Enable compression and HTTP/2 support
- Configure custom error responses (403/404 → 200 with index.html)
- All resources deployed to eu-central-1 region
- Automated deployment script with build, sync, and cache invalidation

## Non-Functional Requirements

### NFR-1: Browser Compatibility
- Support modern browsers (Chrome, Firefox, Safari, Edge - latest versions)
- Utilize standard Web APIs (getUserMedia, Canvas API)
- Check for WebAssembly support (required by MediaPipe)
- Graceful degradation with compatibility error messages for unsupported browsers
- Display list of supported browsers when compatibility check fails

### NFR-2: User Experience
- Application loads within 3 seconds on standard connection
- Intuitive interface requiring no instructions (gamified collection mechanic)
- Smooth visual transitions and animations (0.3s border transitions, 800ms highlight)
- Responsive design for screen sizes from 480px to 1200px+
- Loading indicators during initialization phases
- Clear visual feedback for all user interactions
- FPS counter for performance monitoring
- Privacy notice displayed in UI

### NFR-3: Privacy
- All processing happens client-side (no video data sent to servers)
- Clear indication when camera is active
- No storage of video or image data
- Respect browser camera permissions
- Privacy notice explicitly states client-side processing

### NFR-4: Accessibility
- Provide text alternatives for visual feedback (direction text, emoji labels)
- Ensure sufficient color contrast for border indicators and text
- Support keyboard navigation (Space key to stop/start camera)
- Focus indicators for interactive elements
- Semantic HTML structure

## Technical Constraints

### TC-1: Technology Stack
- TypeScript compiled to ES6 JavaScript modules
- MediaPipe Face Mesh loaded from CDN
- No backend server required (static hosting on S3 + CloudFront)
- Canvas API for rendering
- Jest for unit testing with 15 test cases
- HTML5, CSS3 with modern features (CSS Grid, Flexbox, CSS transitions)

### TC-2: Dependencies
- Minimal external dependencies (MediaPipe Face Mesh from CDN)
- TypeScript for type safety and development
- Jest for testing framework
- All processing libraries loaded via CDN
- Build output uses ES6 modules with .js extensions

### TC-3: Configuration
- Configurable thresholds via AppConfig:
  - Camera: 640x480, facingMode: 'user'
  - Tracking: minDetectionConfidence: 0.5, minTrackingConfidence: 0.5, directionThreshold: 0.05
  - Rendering: targetFPS: 30, landmarkColor: '#00FF00', landmarkRadius: 2
  - Border colors: CENTER (gradient match), LEFT (blue), RIGHT (orange), UP (purple), DOWN (red)
- Expression detection thresholds fine-tuned for accuracy
- Recognition throttle: 1000ms interval
- Highlight duration: 800ms
- Smoothing: 2-frame stability requirement

## Out of Scope

The following features are explicitly out of scope for this version:
- Recording or saving video/images
- Multiple face tracking (only single user)
- Advanced facial recognition or identification
- Audio processing or voice commands
- Sharing or social features
- Leaderboards or persistent score tracking
- User accounts or authentication
- Backend server or database
- Real-time multiplayer features

## Success Criteria

The application will be considered successful when:
1. Camera feed displays reliably across supported browsers with loading indicators
2. 150+ face tracking landmarks are visible and accurate
3. Head direction is correctly detected with 0.05 threshold and visualized through border colors
4. 12 different facial expressions are accurately detected and matched to emojis
5. Emoji collection game works with counters incrementing correctly (2 rows of 6 emojis)
6. Recognition is throttled to once per second with smooth highlight animations
7. Application runs smoothly at 30 FPS without significant lag
8. Responsive design works on screens from 480px to 1200px+
9. User can immediately understand the game mechanic without instructions
10. Application successfully deploys to AWS (S3 + CloudFront) in eu-central-1
11. All 15 unit tests pass
12. TypeScript compiles without errors
13. No diagnostic issues in source code

## Implementation Learnings

Key insights from the development process:

### Direction Detection
- Initial threshold of 0.15 was too high; 0.05 provides better sensitivity
- Camera mirror effect requires inverting horizontal offset logic (negative = right, positive = left)
- Nose tip (landmark 1) relative to face center provides reliable direction calculation

### Expression Detection
- Multi-point averaging improves accuracy (4 points per eye, 3 per eyebrow)
- Smoothing with 2-frame stability prevents flickering between expressions
- Fine-tuned thresholds for each expression are critical for accuracy
- Throttling recognition to 1-second intervals prevents rapid counter increments

### Visual Design
- Single canvas with overlay is cleaner than dual canvas approach
- CENTER border color matching background gradient (#667eea) provides cohesive design
- 800ms highlight duration with scale animation provides clear feedback
- Responsive grid with `auto-fit` and `minmax(120px, 1fr)` adapts well to all screen sizes

### Performance
- Lazy loading MediaPipe after camera initialization improves perceived load time
- Frame skipping when processing exceeds 33ms maintains smooth experience
- Rendering 150+ landmarks instead of all 468 balances detail with performance

### Development Workflow
- TypeScript with ES6 modules requires .js extensions in imports
- Hard refresh (Ctrl+Shift+R) needed after rebuilds to clear browser cache
- Jest unit tests validate core logic before browser testing
- CloudFormation + deployment script enables repeatable AWS deployments

## Future Enhancements (Not in Current Scope)

- Additional expressions and emojis (20+ expressions)
- Persistent score tracking with local storage
- Challenge mode with time limits or target expressions
- Difficulty levels (easy/medium/hard with different thresholds)
- Customizable color schemes for border indicators
- Performance statistics dashboard
- Calibration mode for improved accuracy per user
- Mobile app versions (iOS/Android)
- Multiplayer mode with real-time competition
- Social sharing of high scores or achievements
- Expression history timeline
- Video recording of gameplay sessions
- Custom emoji creation from user photos
- Gesture recognition beyond head direction and expressions
- Voice feedback for detected expressions
- Integration with streaming platforms (OBS, Twitch)

## Build and Deployment Instructions

### Local Development
1. Install dependencies: `npm install`
2. Build TypeScript: `npm run build`
3. Run tests: `npm test`
4. Serve locally: `npm start` or `./serve.sh`
5. Open browser to `http://localhost:8000`
6. Allow camera permissions when prompted
7. Make facial expressions to collect emojis

### AWS Deployment
1. Ensure AWS CLI is installed and configured
2. Set AWS credentials for eu-central-1 region
3. Run deployment script: `./deploy.sh`
4. Script will:
   - Build TypeScript application
   - Create/update CloudFormation stack
   - Sync files to S3 bucket
   - Invalidate CloudFront cache
   - Output website URL
5. Access application via CloudFront URL (HTTPS)

### Testing
- Unit tests: `npm test` (15 tests covering FaceTracker logic)
- Manual testing: Open in browser and verify:
  - Camera initializes with loading indicators
  - Face landmarks appear on video feed
  - Border colors change with head direction
  - Emojis are detected and counters increment
  - Responsive design works at different screen sizes
  - FPS counter shows ~30 FPS

### Troubleshooting
- **Camera not working**: Check browser permissions, ensure HTTPS (or localhost)
- **Direction not updating**: Verify threshold is 0.05, check camera mirror correction
- **Expressions not detected**: Ensure good lighting, face fully visible, try exaggerated expressions
- **Build errors**: Run `npm install`, check TypeScript version, verify .js extensions in imports
- **Deployment fails**: Verify AWS credentials, check region is eu-central-1, ensure bucket name is unique
