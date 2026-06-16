# Kandt House Museum — QR-Enabled AR Smart Tourism System: Implementation Analysis

> **Project Title:** Developing a QR Code-Enabled AR Smart Tourism System to Enhance Digital Heritage Experiences: A Case of Kandt House Museum, Kigali.
>
> **Author:** MUKAMUGEMA Alphonsine Delice (2305001356)
>
> **Supervisor:** Mr. Maurice TURINUMUKIZA
>
> **Institution:** University of Kigali — Bachelor of Business Information Technology (BBIT)
>
> **Last Updated:** June 16, 2026

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [AR Recognition Pipeline — How It Works](#2-ar-recognition-pipeline--how-it-works)
3. [Implementation Progress — Feature Completion](#3-implementation-progress--feature-completion)
4. [Detailed Feature Status](#4-detailed-feature-status)
5. [Technology Stack](#5-technology-stack)
6. [Codebase Breakdown](#6-codebase-breakdown)
7. [What This System IS and IS NOT](#7-what-this-system-is-and-is-not)
8. [Alignment with Research Objectives](#8-alignment-with-research-objectives)
9. [Remaining Work](#9-remaining-work)

---

## 1. System Architecture Overview

### Full-Stack Architecture

| Layer       | Stack                                                             | Status |
|-------------|-------------------------------------------------------------------|--------|
| Frontend    | React 18 + React Router v6 + Tailwind CSS + Vite                 | DONE   |
| Backend     | Node.js + Express 5 + MongoDB Atlas (Mongoose)                   | DONE   |
| AI Vision   | OpenAI GPT-4o (image recognition + vision analysis)              | DONE   |
| AI Audio    | OpenAI TTS-1-HD (virtual narration / text-to-speech)             | DONE   |
| Object Detection | YOLO (Ultralytics) — Python FastAPI microservice            | DONE   |
| Image Matching   | OpenCV SIFT descriptor matching (client-side + server-side) | DONE   |
| QR System   | jsQR (client-side scanning) + qrcode (server-side generation)    | DONE   |
| Storage     | Cloudinary (images/media) + server `/uploads/` (audio narration) | DONE   |
| Auth        | JWT — dual system (Admin/Guide staff + Visitor time-limited 3h)  | DONE   |
| Deploy      | Backend on Hugging Face Spaces (Docker), Frontend on Vercel      | DONE   |
| i18n        | Three languages: English (en), French (fr), Kinyarwanda (rw)     | DONE   |

### Content Models

| Model       | Purpose                                                                 | Status |
|-------------|-------------------------------------------------------------------------|--------|
| Exhibition  | Main content units — title, descriptions, timeline, media, narration    | DONE   |
| Artifact    | Physical museum items — name, images, historical story, origin, category | DONE   |
| Story       | Narrative content belonging to exhibitions (many-to-one)                | DONE   |
| Trail       | Self-guided tour paths with ordered stops linking to artifacts           | DONE   |
| Guide       | Museum guide profiles with availability and specializations             | DONE   |
| Booking     | Visitor tour bookings with reference numbers and email confirmation     | DONE   |
| AccessCode  | QR-based visitor entry codes with time-limited JWT                      | DONE   |
| AnalyticsEvent | AR/engagement event tracking with recognition metadata              | DONE   |

### Deployment Architecture

```
                    INTERNET
                       |
        +--------------+--------------+
        |                             |
   VERCEL (Frontend)          HUGGING FACE SPACES (Backend)
   museum-nu-blond.vercel.app    dukj-museum.hf.space
        |                             |
   React 18 SPA              +-------+--------+
   (Static Build)            |                |
                        Node.js/Express   YOLO FastAPI
                        Port 7860         Port 8001
                             |            (internal)
                        MongoDB Atlas
                        (Cloud DB)
```

---

## 2. AR Recognition Pipeline — How It Works

The system implements a **4-stage cascading recognition pipeline** that degrades gracefully based on available services and device capability.

### Recognition Pipeline Architecture

```
VISITOR POINTS CAMERA AT EXHIBIT
              |
              v
+========================+
| STAGE 1: QR CODE SCAN  |  (jsQR library)
| Instant, Free, Offline |
| Priority: HIGHEST      |
+========================+
     | Not a QR?
     v
+========================+
| STAGE 2: OpenCV SIFT   |  (Feature descriptor matching)
| Client-side matching   |
| Matches against stored |
| artifact descriptors   |
+========================+
     | No match?
     v
+========================+
| STAGE 3: YOLO Detect   |  (Python FastAPI microservice)
| Object classification  |
| via ultralytics model  |
| Proxied through Express|
+========================+
     | No match?
     v
+========================+
| STAGE 4: GPT-4o Vision |  (OpenAI API fallback)
| Full AI visual analysis|
| Matches exhibitions +  |
| artifacts by context   |
| Visitor-accessible     |
+========================+
              |
              v
+========================+
| OVERLAY RESULT         |
| - Info card on camera  |
| - Audio narration      |
| - Related content      |
| - Analytics tracked    |
+========================+
```

### Adaptive Performance Levels

The system adapts to available services and shows the visitor what recognition methods are active:

| Level | Name        | Available Methods              | When                                    |
|-------|-------------|-------------------------------|-----------------------------------------|
| 3     | Full        | QR + OpenCV + YOLO + GPT-4o  | All services running                    |
| 2     | No YOLO     | QR + OpenCV + GPT-4o         | YOLO service unavailable                |
| 1     | QR Only     | QR + GPT-4o (manual)         | No descriptors loaded, no YOLO          |
| 0     | Manual      | GPT-4o via "Identify" button | Camera-only, manual identification      |

### User Flow (Implemented)

```
Visitor arrives at museum
        |
        v
Scans entrance QR code (KM-XXXXXXXX)
        |
        v
Gateway page (/enter) auto-validates --> JWT stored (3h)
        |
        v
Opens AR Scanner (navbar link or home CTA)
        |
        v
Camera activates (live feed, full screen)
        |
        +---> QR code detected automatically ---> Fetch entity ---> Show overlay
        |
        +---> OpenCV matches artifact descriptor ---> Fetch entity ---> Show overlay
        |
        +---> YOLO classifies object ---> Map to entity ---> Show overlay
        |
        +---> Tap "Identify" button ---> GPT-4o vision ---> Show overlay
        |
        +---> Tap "x" to dismiss overlay ---> Camera continues scanning
```

---

## 3. Implementation Progress — Feature Completion

### Overall Progress: ~93%

```
OVERALL SYSTEM PROGRESS
[==================================================-] 93%

BY CATEGORY:
Core Platform (CMS, Auth, i18n)      [==================================================] 100%
AR Scanner & Camera UI                [==================================================] 100%
QR Code System                        [=================================================-]  95%
AI Recognition (GPT-4o Vision)        [==================================================] 100%
YOLO Object Detection Service         [==================================================] 100%
OpenCV Feature Matching               [==================================================] 100%
Audio Narration (TTS)                 [==================================================] 100%
Analytics & Event Tracking            [==================================================] 100%
Deployment (HF Spaces + Vercel)       [==================================================] 100%
Admin QR UI (generate/download)       [======================----------------------------]  45%
Visitor Survey/Evaluation             [==================================================] 100%
```

### Gap Analysis: Proposed vs Implemented

| Component                         | Proposed in Analysis Doc  | Current State                        | Status      |
|-----------------------------------|---------------------------|--------------------------------------|-------------|
| Live camera feed with overlay     | Required                  | ARScanner.jsx (190 lines)            | DONE        |
| QR code scanning                  | Primary recognition mode  | jsQR + useQRScanner.js (88 lines)    | DONE        |
| OpenCV image matching             | Not in original proposal  | useOpenCV.js (74 lines) + descriptors| DONE (bonus)|
| YOLO object detection             | Not in original proposal  | FastAPI microservice (208 lines)     | DONE (bonus)|
| GPT-4o AI identification          | Secondary fallback mode   | aiController.js (214 lines)          | DONE        |
| Visitor-accessible AI endpoint    | Required                  | POST /api/ai/identify-visitor        | DONE        |
| Artifact + Exhibition matching    | Required                  | Both supported in all 4 stages       | DONE        |
| Content overlay on camera         | Required                  | AROverlay.jsx (138 lines)            | DONE        |
| Audio narration                   | Required                  | AudioControls.jsx + TTS endpoint     | DONE        |
| QR generation for exhibitions     | Existed already            | GET /api/qr/exhibition/:id           | DONE        |
| QR generation for artifacts       | Required                  | GET /api/qr/artifact/:id             | DONE        |
| Deep-linking (/ar?type=&id=)      | Required                  | ARScanner.jsx handles URL params     | DONE        |
| AR route in App.jsx               | Required                  | /ar route + /scanner, /ai-scanner redirects | DONE  |
| AR link in navigation             | Required                  | Navbar.jsx with ScanLine icon        | DONE        |
| AR CTA on home page               | Required                  | Home.jsx with AR quick-link          | DONE        |
| API client (visitor identify)     | Required                  | api.js: aiIdentifyVisitor()          | DONE        |
| API client (artifact QR)          | Required                  | api.js: generateArtifactQR()         | DONE        |
| AR analytics event types          | Required                  | 6 AR event types + recognitionMethod | DONE        |
| i18n AR keys (en, fr, rw)         | Required                  | 22+ AR keys in all 3 languages       | DONE        |
| jsqr dependency                   | Required                  | package.json: jsqr ^1.4.0            | DONE        |
| Admin QR buttons in UI            | Required                  | Backend ready, UI buttons missing    | PARTIAL     |
| AR-specific model fields          | Optional                  | Descriptors managed via separate service | ALTERNATIVE |

---

## 4. Detailed Feature Status

### 4.1 Frontend — AR Components (DONE)

#### AR Scanner Page
- **File**: `frontend/src/pages/ARScanner.jsx` (190 lines)
- Full-screen camera interface with real-time recognition
- Supports QR scanning, OpenCV matching, YOLO detection, and GPT-4o fallback
- Deep-linking: `/ar?type=exhibition&id=xxx` or `/ar?type=artifact&id=xxx`
- 4 UI states: Scanning, Loading, Content Overlay, Error

#### AR Component Library (5 components, 440 lines total)

| Component                    | File                                        | Lines | Purpose                                           |
|-----------------------------|---------------------------------------------|-------|--------------------------------------------------|
| ARCamera                    | `components/ar/ARCamera.jsx`                | 119   | Live camera feed (rear/front with fallback)       |
| AROverlay                   | `components/ar/AROverlay.jsx`               | 138   | Floating content card with entity details         |
| RecognitionStatus           | `components/ar/RecognitionStatus.jsx`       | 61    | Status indicator showing pipeline level (0-3)     |
| AudioControls               | `components/ar/AudioControls.jsx`           | 83    | Compact narration audio player                    |
| DetectionBox                | `components/ar/DetectionBox.jsx`            | 39    | Bounding box overlay for YOLO detections          |

#### AR Custom Hooks (4 hooks, 509 lines total)

| Hook                        | File                                        | Lines | Purpose                                           |
|-----------------------------|---------------------------------------------|-------|--------------------------------------------------|
| useARRecognition            | `hooks/useARRecognition.js`                 | 280   | Orchestrates the 4-stage recognition pipeline     |
| useQRScanner                | `hooks/useQRScanner.js`                     | 88    | Continuous QR code detection from video frames    |
| useOpenCV                   | `hooks/useOpenCV.js`                        | 74    | SIFT descriptor matching against stored features  |
| useYOLO                     | `hooks/useYOLO.js`                          | 67    | YOLO detection via backend proxy                  |

#### Routing & Navigation (DONE)

| Feature              | File                          | Detail                                    |
|----------------------|-------------------------------|-------------------------------------------|
| AR Route             | `App.jsx` line 102            | `/ar` -> ARScanner (no layout wrapper)    |
| Legacy redirects     | `App.jsx`                     | `/scanner` -> `/ar`, `/ai-scanner` -> `/ar` |
| Navbar link          | `Navbar.jsx` line 47          | ScanLine icon, labeled `t('nav.ar')`      |
| Home CTA             | `Home.jsx` line 15            | AR quick-link in explore grid             |
| Home QR intro        | `Home.jsx` lines 111-124     | QR-enabled AR intro card with visualization |

#### i18n Support (DONE — 22+ keys per language)

AR-related translation keys include: `ar.pointCamera`, `ar.scanning`, `ar.loading`, `ar.identifying`, `ar.ready`, `ar.identify`, `ar.scanAgain`, `ar.back`, `ar.dismiss`, `ar.methodQR`, `ar.methodOpenCV`, `ar.methodYOLO`, `ar.methodAI`, `ar.exhibition`, `ar.artifact`, `ar.viewDetails`, `ar.levelFull`, `ar.levelNoYOLO`, `ar.levelQROnly`, `ar.levelManual`, and more.

### 4.2 Backend — AI & Recognition (DONE)

#### AI Routes & Controller

| Endpoint                      | Auth         | Purpose                                          | Status |
|-------------------------------|-------------|--------------------------------------------------|--------|
| POST `/api/ai/identify`       | Admin/Guide | AI image recognition (staff use)                 | DONE   |
| POST `/api/ai/identify-visitor` | Visitor   | AI image recognition (visitor-accessible, rate-limited) | DONE |
| POST `/api/ai/narrate`        | Admin/Guide | Text-to-speech narration generation              | DONE   |

- **File**: `backend/controllers/aiController.js` (214 lines)
- GPT-4o vision analysis with full museum context (exhibitions + artifacts)
- Confidence scoring and entity linking
- Supports both `exhibitionId` and `artifactId` in narration

#### YOLO Object Detection Service

| Endpoint                      | Purpose                                          | Status |
|-------------------------------|--------------------------------------------------|--------|
| GET `/api/yolo/health`        | Service status and model availability            | DONE   |
| GET `/api/yolo/models`        | List available YOLO models                       | DONE   |
| POST `/api/yolo/detect`       | Object detection with bounding boxes             | DONE   |
| POST `/api/yolo/classify`     | Image classification                             | DONE   |

- **File**: `backend/yolo-service/main.py` (208 lines) — Python FastAPI microservice
- **Proxy**: `backend/routes/yoloProxyRoutes.js` (84 lines) — Express proxy to internal port 8001
- CPU-only PyTorch for cost-effective deployment on HF Spaces
- Model auto-download on first request

#### QR Code System

| Endpoint                          | Auth  | Purpose                                     | Status |
|-----------------------------------|-------|---------------------------------------------|--------|
| GET `/api/qr/exhibition/:id`     | Admin | Generate QR code for exhibition             | DONE   |
| GET `/api/qr/artifact/:id`       | Admin | Generate QR code for artifact               | DONE   |
| POST `/api/access-codes/generate`| Admin | Generate visitor entrance QR codes          | DONE   |

- QR codes encode deep-link URLs: `${FRONTEND_URL}/ar?type=exhibition&id=xxx`
- Dual-purpose: works with normal QR readers (opens browser) AND in-app AR camera (parsed directly)

#### OpenCV Descriptor Management

| Endpoint                              | Auth       | Purpose                                    | Status |
|---------------------------------------|------------|--------------------------------------------|--------|
| GET `/api/ar/descriptors`             | Visitor    | Fetch stored feature descriptors           | DONE   |
| POST `/api/admin/ar/descriptors/rebuild` | Admin  | Rebuild all descriptors                    | DONE   |
| POST `/api/admin/ar/descriptors/validate` | Admin | Validate descriptor integrity             | DONE   |
| POST `/api/admin/ar/descriptors/upload` | Admin/Guide | Upload new descriptor                   | DONE   |

#### Analytics Event Tracking (DONE)

**File**: `backend/models/AnalyticsEvent.js` (34 lines)

**Event types supported**:
- General: `view`, `scan`, `audio_play`, `audio_complete`, `trail_click`, `share`, `search`, `bookmark`, `qr_scan`
- AR-specific: `ar_scan`, `ar_view`, `ar_audio_play`, `ar_dismiss`, `ar_recognition_success`, `ar_recognition_failure`

**Entity types**: `exhibition`, `trail`, `story`, `artifact`

**AR metadata fields**: `recognitionMethod` (qr, opencv, yolo, gpt4o), `recognitionConfidence` (0-1)

**TTL Index**: Events auto-expire after 1 year.

### 4.3 Core Platform Features (DONE)

| Feature                    | Status | Detail                                                   |
|----------------------------|--------|----------------------------------------------------------|
| Admin Dashboard            | DONE   | Full CRUD for exhibitions, artifacts, stories, trails, guides |
| Visitor Authentication     | DONE   | QR-based access codes with 3h time-limited JWT           |
| Staff Authentication       | DONE   | Admin + Guide roles with JWT                             |
| Exhibition Management      | DONE   | Multilingual (en/fr/rw), timeline, media, narration      |
| Artifact Management        | DONE   | Multilingual, images, historical story, categories       |
| Story Management           | DONE   | Belongs to exhibitions, multilingual content             |
| Trail Management           | DONE   | Ordered stops linking to artifacts, multilingual         |
| Guide Management           | DONE   | Profiles, availability, specializations                  |
| Booking System             | DONE   | Tour bookings with email confirmation                    |
| Contact/Messages           | DONE   | Visitor messages with admin reply + email notification   |
| Survey/Feedback            | DONE   | Visitor satisfaction surveys with ratings                 |
| Search                     | DONE   | Full-text search across exhibitions and artifacts        |
| Media Upload (Cloudinary)  | DONE   | Images, videos, documents via Cloudinary CDN             |
| Email Notifications        | DONE   | SMTP (Gmail) with HTML templates                         |
| AI Chatbot                 | DONE   | GPT-powered museum assistant                             |
| Responsive UI              | DONE   | Mobile-first Tailwind CSS design                         |

---

## 5. Technology Stack

### Frontend Dependencies

| Package              | Purpose                                    | Status    |
|----------------------|--------------------------------------------|-----------|
| react 18             | UI framework                               | Installed |
| react-router-dom v6  | Client-side routing                        | Installed |
| tailwindcss          | Utility-first CSS framework                | Installed |
| vite                 | Build tool and dev server                  | Installed |
| jsqr ^1.4.0          | QR code detection from camera frames       | Installed |
| html5-qrcode         | Additional QR scanning support             | Installed |
| qrcode.react         | QR code rendering in React                 | Installed |
| lucide-react          | Icon library (ScanLine, Camera, etc.)     | Installed |
| i18next               | Internationalization framework            | Installed |
| axios                 | HTTP client for API calls                 | Installed |

### Backend Dependencies

| Package              | Purpose                                    | Status    |
|----------------------|--------------------------------------------|-----------|
| express 5            | HTTP server framework                      | Installed |
| mongoose             | MongoDB ODM                                | Installed |
| openai               | GPT-4o Vision + TTS-1-HD APIs             | Installed |
| qrcode               | Server-side QR code generation             | Installed |
| jsonwebtoken          | JWT authentication                        | Installed |
| nodemailer            | Email sending (SMTP/Gmail)                | Installed |
| cloudinary            | Media upload CDN                          | Installed |
| multer                | File upload handling                      | Installed |

### YOLO Service Dependencies (Python)

| Package              | Purpose                                    | Status    |
|----------------------|--------------------------------------------|-----------|
| fastapi 0.115.0      | Python API framework                       | Installed |
| uvicorn 0.31.0       | ASGI server                                | Installed |
| ultralytics 8.3.0    | YOLO model inference                       | Installed |
| torch 2.5.1+cpu      | PyTorch (CPU-only, pinned)                | Installed |
| opencv-python-headless| Computer vision library                   | Installed |
| numpy 1.26.4         | Numerical computing                        | Installed |

### Why No Heavy AR Framework Is Needed

The system uses **marker-based image AR** (QR codes + image recognition triggering 2D content overlays on a live camera feed). This is achieved with standard web APIs:

- **`getUserMedia` API** — Live camera feed (native browser API)
- **Canvas API** — Frame capture for recognition processing
- **CSS + Tailwind** — 2D content overlays positioned on camera view
- **jsQR** — QR code detection from video frames (~50KB)

No 3D rendering, spatial tracking, or WebXR is required. The following frameworks are **intentionally not used**:

| Framework      | What It Does                    | Why Not Needed                           |
|----------------|--------------------------------|------------------------------------------|
| AR.js          | Marker-based AR with 3D models | No 3D model rendering in this system     |
| A-Frame        | 3D scene rendering in browser  | No 3D scenes — only 2D info overlays     |
| Three.js       | WebGL 3D engine                | No 3D rendering needed                   |
| `<model-viewer>` | Display .glb/.gltf 3D models| No 3D model files                        |
| WebXR          | Immersive AR/VR sessions       | Overkill — just need camera + overlay    |

---

## 6. Codebase Breakdown

### Code Volume

| Area                              | Lines of Code | Files |
|-----------------------------------|---------------|-------|
| **Frontend (React)**              | ~12,548       | —     |
| — AR Scanner page                 | 190           | 1     |
| — AR components                   | 440           | 5     |
| — AR hooks (recognition pipeline) | 509           | 4     |
| — **Total AR-specific frontend**  | **1,139**     | **10**|
| **Backend (Node.js + Express)**   | ~4,929        | —     |
| — AI controller + routes          | 231           | 2     |
| — QR controller + routes          | 51            | 2     |
| — AR descriptor controller + routes| 99           | 2     |
| — YOLO proxy routes               | 84            | 1     |
| — Analytics model                 | 34            | 1     |
| — **Total AR-specific backend**   | **499**       | **8** |
| **YOLO Service (Python)**         | **208**       | **1** |
| **Total AR-specific code**        | **~1,846**    | **19**|
| **Total project code**            | **~17,685**   | —     |

### Key File Map

#### Frontend AR Files

```
frontend/src/
  pages/
    ARScanner.jsx              (190 lines)  -- Main AR camera page
  components/ar/
    ARCamera.jsx               (119 lines)  -- Live camera feed manager
    AROverlay.jsx              (138 lines)  -- Content overlay card
    RecognitionStatus.jsx       (61 lines)  -- Pipeline status indicator
    AudioControls.jsx           (83 lines)  -- Narration audio player
    DetectionBox.jsx            (39 lines)  -- YOLO detection bounding box
  hooks/
    useARRecognition.js        (280 lines)  -- 4-stage pipeline orchestrator
    useQRScanner.js             (88 lines)  -- QR code detection
    useOpenCV.js                (74 lines)  -- SIFT descriptor matching
    useYOLO.js                  (67 lines)  -- YOLO proxy integration
```

#### Backend AR Files

```
backend/
  controllers/
    aiController.js            (214 lines)  -- GPT-4o vision + TTS
    qrController.js             (41 lines)  -- QR code generation
    arController.js             (76 lines)  -- Descriptor management
  routes/
    aiRoutes.js                 (17 lines)  -- AI endpoints
    qrRoutes.js                 (10 lines)  -- QR endpoints
    arRoutes.js                 (23 lines)  -- AR descriptor endpoints
    yoloProxyRoutes.js          (84 lines)  -- YOLO service proxy
  yolo-service/
    main.py                    (208 lines)  -- FastAPI YOLO microservice
    requirements.txt                        -- Python dependencies
```

---

## 7. What This System IS and IS NOT

### Scope Boundaries

| This System IS                                  | This System is NOT                              |
|-------------------------------------------------|------------------------------------------------|
| QR-triggered content overlays on camera feed    | 3D model rendering anchored to real surfaces   |
| Multi-stage image recognition (QR+OpenCV+YOLO+AI) | Markerless spatial tracking (SLAM)           |
| AI-powered visual identification (GPT-4o)       | Real-time continuous object tracking           |
| AI-generated audio narration (TTS-1-HD)         | Live conversational AI speech                  |
| Mobile web browser experience (Web-AR)          | Native mobile app (iOS/Android)                |
| 2D info cards floating over live camera          | 3D objects placed in physical space            |
| Marker-based AR (QR codes as triggers)          | Markerless AR (ARKit/ARCore)                   |
| Single-entity identification per scan            | Multiple simultaneous AR markers               |
| Accessible without app download                  | App store distribution                         |

### How This Addresses the Research Proposal

The research proposal describes a **"QR-Enabled Augmented Reality Smart Tourism System"** using **marker-based AR** to overlay **interactive content** onto museum exhibits. The implementation delivers this through:

1. **QR-based triggers** — Physical QR codes placed next to exhibits are scanned by the visitor's phone camera, instantly triggering rich content overlays (title, description, historical context, images, audio narration) in the visitor's chosen language.

2. **Image-based recognition** — Beyond QR codes, the system offers three additional recognition methods (OpenCV feature matching, YOLO object detection, GPT-4o vision) as fallback layers, ensuring visitors can identify exhibits even without a visible QR code.

3. **Virtual narrator** — The AI-powered TTS system generates audio narrations of exhibit descriptions in multiple languages, acting as a **virtual guide** that delivers contextual historical narratives directly through the visitor's smartphone.

4. **Web-AR delivery** — The entire system runs in a standard mobile web browser with no app download required, consistent with the proposal's emphasis on accessibility and low-barrier entry.

5. **Smart camera viewfinder** — The AR Scanner page provides a persistent live camera feed with floating 2D content overlays, creating an interactive "smart viewfinder" experience as described in the proposal.

---

## 8. Alignment with Research Objectives

### Specific Objective 1: Analyze current museum exhibition methods and visitor engagement challenges

| Deliverable                           | Implementation                                              | Status |
|---------------------------------------|-------------------------------------------------------------|--------|
| Visitor survey/feedback system        | Survey model with ratings, multiple question types          | DONE   |
| Analytics event tracking              | 15 event types including 6 AR-specific events               | DONE   |
| Recognition method tracking           | `recognitionMethod` field (qr, opencv, yolo, gpt4o)        | DONE   |
| Confidence scoring                    | `recognitionConfidence` (0-1) on each recognition event     | DONE   |
| Contact/messaging system              | Visitor messages with admin reply pipeline                   | DONE   |

### Specific Objective 2: Design and develop a QR-enabled AR web-based system

| Deliverable                           | Implementation                                              | Status |
|---------------------------------------|-------------------------------------------------------------|--------|
| QR code generation (exhibitions)      | GET /api/qr/exhibition/:id with deep-link URL               | DONE   |
| QR code generation (artifacts)        | GET /api/qr/artifact/:id with deep-link URL                  | DONE   |
| Live camera AR scanner                | ARScanner.jsx with ARCamera component                        | DONE   |
| Content overlay system                | AROverlay.jsx with entity details + action links             | DONE   |
| Virtual narration (TTS)               | OpenAI TTS-1-HD generating MP3 audio narrations              | DONE   |
| Image recognition (AI vision)         | GPT-4o vision with museum context (exhibitions + artifacts)  | DONE   |
| Object detection (YOLO)               | FastAPI microservice with ultralytics                        | DONE   |
| Feature matching (OpenCV)             | SIFT descriptor matching via useOpenCV hook                  | DONE   |
| Multilingual support (en/fr/rw)       | All content models + 22+ AR i18n keys in 3 languages         | DONE   |
| Visitor-accessible scanning           | /api/ai/identify-visitor endpoint with rate limiting          | DONE   |
| Deep-linking (QR -> AR page)          | /ar?type=exhibition&id=xxx handled by ARScanner              | DONE   |
| Admin content management              | Full CRUD for all content models with Cloudinary uploads     | DONE   |
| Responsive mobile-first design        | Tailwind CSS, tested on mobile viewports                     | DONE   |
| No app download required              | Web-AR in standard mobile browser                            | DONE   |

### Specific Objective 3: Evaluate the usability and effectiveness of the AR system

| Deliverable                           | Implementation                                              | Status |
|---------------------------------------|-------------------------------------------------------------|--------|
| Survey collection system              | Visitor surveys with rating scales                           | DONE   |
| Analytics dashboard (admin)           | Event tracking with AR-specific metrics                      | DONE   |
| Performance level indicator           | RecognitionStatus.jsx shows active pipeline level (0-3)      | DONE   |
| Admin QR generation UI                | Backend ready, admin UI buttons not yet added                | PARTIAL|

---

## 9. Remaining Work

### Items Not Yet Completed (~7% remaining)

| Item                                    | Priority | Effort  | Detail                                                  |
|-----------------------------------------|----------|---------|--------------------------------------------------------|
| Admin QR download buttons               | Medium   | ~2h     | Add QR generation/download buttons in AdminArtifacts.jsx and AdminExhibitions.jsx pages |
| Old Scanner.jsx cleanup                 | Low      | ~30min  | File still exists but is no longer routed; can be removed |

### Optional Enhancements (Not Required for Completion)

| Enhancement                            | Effort  | Detail                                                  |
|----------------------------------------|---------|--------------------------------------------------------|
| Pre-generated narration audio          | ~4h     | Store narration audio at content creation time to avoid real-time TTS costs |
| AR-specific model fields               | ~2h     | Add `arOverlayImage`, `arDescription` fields to Artifact/Exhibition models |
| Offline caching                        | ~4h     | Service worker to cache entity data for offline QR scanning |
| YOLO model fine-tuning                 | ~8h     | Train custom YOLO model on Kandt House Museum artifacts for better detection |

---

> **Summary:** The QR-Enabled AR Smart Tourism System for the Kandt House Museum is **~93% complete**. All core AR features are fully implemented: live camera scanning, 4-stage recognition pipeline (QR + OpenCV + YOLO + GPT-4o), content overlays, audio narration, multilingual support, visitor authentication, analytics tracking, and full deployment on Hugging Face Spaces + Vercel. The system exceeds the original proposal by implementing three additional recognition methods (OpenCV, YOLO, adaptive pipeline) beyond the proposed QR + GPT-4o approach. The remaining work consists of minor admin UI additions for QR code download buttons.
