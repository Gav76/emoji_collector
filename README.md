# 🎮 Emoji Collector

A gamified real-time face tracking web application that detects facial expressions and matches them to emojis. Built with MediaPipe Face Mesh and TypeScript.

## Features

- 🎯 Real-time face detection and tracking with 150+ facial landmarks
- 😊 12 different facial expression detection (Neutral, Happy, Very Happy, Sad, Surprised, Angry, Wink, Kiss, Tongue Out, Thinking, Sleepy, Confused)
- 🎮 Gamified emoji collection with counters
- 🎨 Dynamic border colors indicating head direction (LEFT, RIGHT, UP, DOWN, CENTER)
- 🔒 Client-side processing (privacy-focused - no data sent to servers)
- 📱 Fully responsive design (480px to 1200px+)
- ☁️ AWS deployment ready (S3 + CloudFront)
- ✅ Property-based testing for correctness

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Emoji Collection Grid (2 rows × 6 columns)              │  │
│  │  [😐 Neutral] [🙂 Happy] [😄 Very Happy] [😢 Sad] ...    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Video Canvas (640×480) + Facial Landmarks Overlay       │  │
│  │  [Dynamic Border Color: LEFT/RIGHT/UP/DOWN/CENTER]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Status: Direction | Emoji | FPS                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                    ApplicationController                       │
│  • Orchestrates all components                                │
│  • Manages render loop (30 FPS target)                        │
│  • Handles state management                                   │
│  • Error handling and recovery                                │
└────────┬──────────────┬──────────────┬────────────────────────┘
         │              │              │
    ┌────▼────┐   ┌─────▼─────┐  ┌────▼──────┐
    │ Camera  │   │   Face    │  │ Rendering │
    │ Manager │   │  Tracker  │  │  Engine   │
    └────┬────┘   └─────┬─────┘  └────┬──────┘
         │              │              │
         │              │              │
    ┌────▼────────────────────────────▼──────────────────┐
    │              Component Details                     │
    ├────────────────────────────────────────────────────┤
    │ CameraManager:                                     │
    │  • getUserMedia API integration                    │
    │  • Stream management (640×480, 'user' facing)     │
    │  • Error handling (permissions, not found)         │
    │                                                    │
    │ FaceTracker:                                       │
    │  • MediaPipe Face Mesh integration (CDN)          │
    │  • 468 landmark detection                          │
    │  • Direction calculation (threshold: 0.05)         │
    │  • EmojiMatcher integration                        │
    │                                                    │
    │ EmojiMatcher:                                      │
    │  • Facial metric calculation:                      │
    │    - Mouth openness, smile level                   │
    │    - Eyebrow raise, eye openness                   │
    │    - Mouth width, lip pucker, head tilt           │
    │  • 12 expression detection algorithms              │
    │  • 2-frame smoothing for stability                 │
    │                                                    │
    │ RenderingEngine:                                   │
    │  • Canvas 2D rendering                             │
    │  • 150+ landmark visualization                     │
    │  • Border color updates (CSS transitions)          │
    │  • Frame synchronization                           │
    └────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌────────────────────────────────────────────────────┐
    │              External Dependencies                 │
    ├────────────────────────────────────────────────────┤
    │ • MediaPipe Face Mesh (CDN)                       │
    │ • Browser APIs: getUserMedia, Canvas, WebAssembly │
    │ • TypeScript (ES6 modules)                        │
    └────────────────────────────────────────────────────┘

Data Flow:
1. Camera → Video Stream → FaceTracker
2. FaceTracker → Landmarks + Direction → EmojiMatcher
3. EmojiMatcher → Expression + Emoji → ApplicationController
4. ApplicationController → State → RenderingEngine
5. RenderingEngine → Visual Output → Canvas + UI Updates
```

## Component Architecture

### Core Components

1. **ApplicationController** (`src/ApplicationController.ts`)
   - Central orchestrator managing all components
   - Implements render loop with requestAnimationFrame
   - Manages application state and error handling
   - Coordinates camera, tracking, and rendering

2. **CameraManager** (`src/CameraManager.ts`)
   - Handles getUserMedia API for camera access
   - Manages video stream lifecycle
   - Error handling for permissions and device issues

3. **FaceTracker** (`src/FaceTracker.ts`)
   - Integrates MediaPipe Face Mesh
   - Processes video frames to extract 468 landmarks
   - Calculates head direction (LEFT/RIGHT/UP/DOWN/CENTER)
   - Uses EmojiMatcher for expression detection

4. **EmojiMatcher** (`src/EmojiMatcher.ts`)
   - Analyzes facial landmarks for expression metrics
   - Detects 12 different expressions
   - Implements smoothing algorithm (2-frame stability)
   - Maps expressions to emoji characters

5. **RenderingEngine** (`src/RenderingEngine.ts`)
   - Renders video feed and landmark overlays
   - Updates border colors based on direction
   - Draws 150+ key facial landmarks
   - Manages canvas 2D context

### Configuration

**AppConfig** (`src/AppConfig.ts`)
- Camera settings (640×480, 'user' facing mode)
- Tracking thresholds (detection: 0.5, tracking: 0.5, direction: 0.05)
- Rendering settings (30 FPS target, landmark colors)
- Border color mappings for each direction

## Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Serve the application:
```bash
npm start
# or
./serve.sh
```

4. Open browser to `http://localhost:8000`

5. Allow camera permissions when prompted

**Note:** Camera access requires HTTPS except on localhost.

### AWS Deployment

Deploy to S3 + CloudFront in eu-central-1:

```bash
./deploy.sh
```

The script will:
- Build the TypeScript application
- Create/update CloudFormation stack
- Sync files to S3 bucket
- Invalidate CloudFront cache
- Output the website URL

## Development

- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Watch mode**: `npm run dev` - Auto-rebuild on file changes
- **Run tests**: `npm test` - Execute Jest test suite (15 tests)
- **Serve locally**: `npm start` or `./serve.sh` - Start local server

## How It Works

1. **Camera Initialization**: Requests camera access via getUserMedia API
2. **Face Detection**: MediaPipe Face Mesh detects face and extracts 468 landmarks
3. **Expression Analysis**: EmojiMatcher calculates facial metrics (mouth, eyes, eyebrows)
4. **Direction Calculation**: Compares nose position to face center with 0.05 threshold
5. **Rendering**: Draws video feed, 150+ landmarks, and updates UI
6. **Collection Game**: Detects expressions, increments counters (throttled to 1/second)

## Expression Detection

The application detects 12 expressions using facial landmark analysis:

| Expression | Emoji | Detection Method |
|------------|-------|------------------|
| Neutral | 😐 | Baseline state |
| Happy | 🙂 | Smile level > 0.025 |
| Very Happy | 😄 | Smile level > 0.045 + wide mouth |
| Sad | 😢 | Smile level < -0.015 (frown) |
| Surprised | 😮 | Mouth open + eyebrows raised |
| Angry | 😠 | Eyebrows down + slight frown |
| Wink | 😉 | One eye closed, other open |
| Kiss | 😘 | Lips puckered + narrow mouth |
| Tongue Out | 😛 | Very wide mouth + specific shape |
| Thinking | 🤔 | Head tilt + slight eyebrow raise |
| Sleepy | 😴 | Both eyes partially closed |
| Confused | 😕 | Eyebrows raised + neutral mouth |

## Technology Stack

- **TypeScript** - Type-safe development with ES6 modules
- **MediaPipe Face Mesh** - 468-point facial landmark detection (loaded via CDN)
- **HTML5 Canvas API** - 2D rendering for video and landmarks
- **Jest** - Unit testing framework
- **fast-check** - Property-based testing library
- **AWS CloudFormation** - Infrastructure as code
- **AWS S3 + CloudFront** - Static hosting with CDN

## Project Structure

```
.
├── src/
│   ├── main.ts                    # Application entry point
│   ├── ApplicationController.ts   # Main orchestrator
│   ├── CameraManager.ts          # Camera access management
│   ├── FaceTracker.ts            # Face detection & tracking
│   ├── EmojiMatcher.ts           # Expression detection
│   ├── RenderingEngine.ts        # Canvas rendering
│   └── AppConfig.ts              # Configuration constants
├── tests/
│   └── FaceTracker.test.ts       # Unit tests (15 tests)
├── dist/                          # Compiled JavaScript output
├── index.html                     # Main HTML page
├── styles.css                     # Responsive CSS styling
├── cloudformation-template.yaml   # AWS infrastructure
├── deploy.sh                      # Deployment script
└── package.json                   # Dependencies & scripts
```

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge - latest versions)
- Camera access permission
- WebAssembly support (required by MediaPipe)
- JavaScript enabled
- Minimum screen resolution: 480px width

## Performance

- **Target FPS**: 30 frames per second
- **Landmark Rendering**: 150+ key points (optimized from 468 total)
- **Frame Budget**: 33ms per frame with automatic skipping if exceeded
- **Recognition Throttle**: 1 second between expression detections
- **Smoothing**: 2-frame stability requirement for expression changes

## Testing

The application includes comprehensive unit tests:

```bash
npm test
```

**Test Coverage:**
- Direction calculation (CENTER, LEFT, RIGHT, UP, DOWN)
- Landmark validation and normalization
- Threshold testing for direction detection
- Face center calculation
- Offset calculations (horizontal and vertical)
- Priority logic (horizontal vs vertical movement)

All 15 tests validate core face tracking logic.

## Troubleshooting

### Camera not working
- Check browser permissions (allow camera access)
- Ensure HTTPS connection (or use localhost)
- Verify camera is not in use by another application

### Direction not updating
- Ensure threshold is set to 0.05 in AppConfig
- Check that face is fully visible in frame
- Verify good lighting conditions

### Expressions not detected
- Ensure face is well-lit and fully visible
- Try exaggerated expressions
- Check that MediaPipe model loaded successfully
- Verify 2-frame smoothing is working (prevents flickering)

### Build errors
- Run `npm install` to ensure dependencies are installed
- Check TypeScript version compatibility
- Verify .js extensions in import statements (required for ES6 modules)

### Deployment fails
- Verify AWS credentials are configured
- Check that region is set to eu-central-1
- Ensure S3 bucket name is unique (uses account ID)
- Verify CloudFormation stack permissions

## Privacy

All video processing happens locally in your browser. No data is sent to any server.

- ✅ Client-side processing only
- ✅ No video recording or storage
- ✅ No data transmission to external servers
- ✅ MediaPipe model loaded from CDN but processing is local
- ✅ Camera access only when explicitly granted

## Key Implementation Details

### Direction Detection
- Uses nose tip (landmark 1) relative to face center
- Threshold: 0.05 for both horizontal and vertical offsets
- Corrects for camera mirror effect (negative offset = right, positive = left)
- Prioritizes larger offset when both horizontal and vertical movement detected

### Expression Detection
- Multi-point averaging for accuracy (4 points per eye, 3 per eyebrow)
- Calculates 7 facial metrics: mouth openness, smile level, eyebrow raise, eye openness, mouth width, lip pucker, head tilt
- 2-frame smoothing prevents flickering between expressions
- Fine-tuned thresholds for each of 12 expressions

### Responsive Design
- Viewport-fitted layout (100vh with overflow handling)
- Fixed 2×6 emoji grid at all breakpoints
- Canvas scales proportionally with max dimensions
- Breakpoints: 1200px, 768px, 480px
- Emoji sizes adjust: 2rem → 1.75rem → 1.5rem → 1.25rem

## Contributing

This project was built as a learning exercise following the spec-driven development methodology. The complete requirements, design, and implementation plan are available in `.kiro/specs/orientation-estimator-app/`.

## License

MIT

## Acknowledgments

- MediaPipe Face Mesh by Google for facial landmark detection
- Built with TypeScript and modern web APIs
- Deployed on AWS infrastructure
