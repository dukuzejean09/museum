# Kandt House Museum — AR Image-Based System Analysis

## Table of Contents

1. [Current System Overview](#1-current-system-overview)
2. [Current AI Scanner Flow](#2-current-ai-scanner-flow)
3. [Gap Analysis — What's Missing for Image-Based AR](#3-gap-analysis--whats-missing-for-image-based-ar)
4. [Proposed AR Image-Based System](#4-proposed-ar-image-based-system)
5. [Backend Changes Required](#5-backend-changes-required)
6. [Frontend Changes Required](#6-frontend-changes-required)
7. [Database Schema Changes](#7-database-schema-changes)
8. [File-by-File Change Map](#8-file-by-file-change-map)
9. [Technology Stack Additions](#9-technology-stack-additions)
10. [What This Is NOT](#10-what-this-is-not)

---

## 1. Current System Overview

### Architecture

| Layer      | Stack                                                        |
|------------|--------------------------------------------------------------|
| Frontend   | React 18 + React Router v6 + Tailwind CSS + Vite             |
| Backend    | Node.js + Express 5 + MongoDB (Mongoose)                     |
| AI         | OpenAI GPT-4o (vision) + TTS-1-HD (narration)               |
| Storage    | Cloudinary (images/media) + local `/uploads/` (audio)        |
| Auth       | JWT — dual system (Admin/Guide staff + Visitor time-limited) |
| Deploy     | Backend on Render, Frontend on separate host                 |

### Content Models

| Model       | Purpose                                                                 |
|-------------|-------------------------------------------------------------------------|
| Exhibition  | Main content units — title, descriptions, timeline, media, narration    |
| Artifact    | Physical museum items — name, images, historical story, origin, category |
| Story       | Narrative content belonging to exhibitions (many-to-one)                |
| Trail       | Self-guided tour paths with ordered stops linking to artifacts           |
| Guide       | Museum guide profiles with availability and specializations             |

All content fields support three languages: **English (en)**, **French (fr)**, **Kinyarwanda (rw)**.

### Existing QR System

The system already has a QR code infrastructure:

- **Access Codes**: Admins generate QR codes (`KM-XXXXXXXX`) that visitors scan at the museum entrance to authenticate and get a time-limited JWT (default 3 hours).
- **Exhibition QR Codes**: Admins can generate QR codes for individual exhibitions via `GET /api/qr/exhibition/:id`. These link to the exhibition detail page (`/exhibitions/:id`).
- **Gateway Page** (`/enter`): Handles QR scan auto-validation — if URL contains `?code=KM-XXXXX`, it auto-authenticates the visitor.

### Existing AI Scanner

The current scanner (embedded in `/search` page, component: `Scanner.jsx`) works as follows:

1. Visitor takes a photo or uploads an image
2. Image is sent to `POST /api/ai/identify` (requires admin/guide JWT)
3. Backend sends image to GPT-4o vision with all published exhibitions as context
4. GPT-4o returns: `{ matched, exhibitionId, confidence, description }`
5. If matched, auto-triggers TTS narration via `POST /api/ai/narrate`
6. Audio MP3 is saved to `/uploads/` and streamed back to the browser

---

## 2. Current AI Scanner Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Visitor     │     │   Frontend   │     │   Backend    │     │   OpenAI     │
│  (Camera/     │────>│  Scanner.jsx │────>│  /ai/identify│────>│  GPT-4o      │
│   Upload)     │     │  POST image  │     │  (multer)    │     │  Vision      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                │                      │
                                                │<─────────────────────│
                                                │  { matched, id,      │
                                                │    confidence,       │
                                                │    description }     │
                                                │                      │
                                          ┌─────▼──────┐        ┌─────▼──────┐
                                          │ /ai/narrate │───────>│ TTS-1-HD   │
                                          │ (text→MP3)  │<───────│ (nova)     │
                                          └─────┬──────┘        └────────────┘
                                                │
                                          ┌─────▼──────┐
                                          │ Audio plays │
                                          │ in browser  │
                                          └────────────┘
```

### Problems with the Current Scanner for AR Use

| Problem | Detail |
|---------|--------|
| **Auth-gated** | `/ai/identify` and `/ai/narrate` require admin/guide JWT — visitors cannot use them |
| **No real-time overlay** | Takes a single photo, processes it, shows results on a separate screen — no camera overlay |
| **Exhibition-only matching** | GPT-4o only knows about exhibitions, not individual artifacts |
| **No visual feedback** | After identification, only shows text + audio — no image overlays, info cards on camera view |
| **Slow pipeline** | GPT-4o vision call takes 3-8 seconds — too slow for real-time AR feel |
| **Expensive per scan** | Every scan costs an OpenAI API call (~$0.01-0.03) — not scalable for many visitors |
| **No QR+AR integration** | QR codes only link to web pages — they don't trigger AR overlays |

---

## 3. Gap Analysis — What's Missing for Image-Based AR

### What "Image-Based AR" Means Here

**NOT full AR** (no 3D models, no spatial tracking, no SLAM, no WebXR).

**IS**: When a visitor points their phone camera at a museum artifact/exhibit or scans a QR code, an **overlay appears on the camera feed** showing:
- Information card (title, description, date)
- Historical images overlaid on screen
- Audio narration auto-playing
- Related content links
- Multilingual support

Think of it as a **smart camera viewfinder** — the camera stays live, and contextual content appears overlaid on top of it.

### Gap Summary

| Component | Current State | Required State |
|-----------|---------------|----------------|
| Camera view | Single photo capture, then stops | **Continuous live camera feed with overlay** |
| Recognition | GPT-4o per image (slow, expensive) | **QR-code triggered + optional image match** |
| Content overlay | Separate results page | **Floating cards/panels on camera view** |
| Audio | Manual play after results | **Auto-narration on recognition** |
| Auth for scanning | Admin/guide JWT only | **Visitor JWT should work** |
| Artifact support | Exhibitions only | **Both exhibitions and artifacts** |
| Offline hints | None | **QR codes encode entity type + ID directly** |
| Analytics | Basic event tracking | **Track AR scans, dwell time, audio plays** |

---

## 4. Proposed AR Image-Based System

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VISITOR'S PHONE                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LIVE CAMERA FEED (background)                │   │
│  │                                                          │   │
│  │    ┌──────────────────────────────────┐                   │   │
│  │    │     QR CODE DETECTED             │                   │   │
│  │    │     "Scanning..."                │                   │   │
│  │    └──────────────────────────────────┘                   │   │
│  │                                                          │   │
│  │    ┌──────────────────────────────────┐                   │   │
│  │    │  ┌────┐  Exhibition Title        │   ▶ Audio        │   │
│  │    │  │IMG │  Short description...    │   ── ── ──       │   │
│  │    │  └────┘  Period: 1907-1916       │                   │   │
│  │    │  [View Full Details →]           │                   │   │
│  │    └──────────────────────────────────┘                   │   │
│  │                                                          │   │
│  │    ┌──────────────────────────────────┐                   │   │
│  │    │  Related: 3 artifacts, 2 stories │                   │   │
│  │    └──────────────────────────────────┘                   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [×Close]              [🔊Mute]              [📷Scan Again]     │
└─────────────────────────────────────────────────────────────────┘
```

### Two Recognition Modes

#### Mode 1: QR Code Scan (Primary — Fast, Free, Reliable)

1. Visitor opens AR Scanner page
2. Camera feed starts — QR scanner runs continuously in background
3. When a QR code is detected, system extracts the encoded data
4. QR data format: `{ type: "exhibition"|"artifact", id: "mongoId" }`
5. Frontend fetches the entity data from existing public API
6. Overlay card appears on camera feed with content + auto-narration

**No AI cost. Instant. Works offline with cached data.**

#### Mode 2: AI Image Recognition (Secondary — Fallback)

1. Visitor taps "Identify" button on the AR view
2. Current camera frame is captured and sent to `/api/ai/identify`
3. GPT-4o matches against exhibitions AND artifacts
4. Result triggers the same overlay as QR mode

**Used when no QR code is visible or visitor wants to identify something without a label.**

### User Flow

```
Visitor enters museum
        │
        ▼
Scans entrance QR code ──→ Gateway validates ──→ JWT stored
        │
        ▼
Opens AR Scanner (nav menu or home CTA)
        │
        ▼
Camera activates (live feed, full screen)
        │
        ├──→ QR code detected automatically ──→ Fetch entity ──→ Show overlay
        │
        ├──→ Tap "Identify" button ──→ Capture frame ──→ AI identify ──→ Show overlay
        │
        └──→ Tap "×" to close overlay ──→ Camera continues scanning
```

---

## 5. Backend Changes Required

### 5.1 Update AI Identify Endpoint — Allow Visitor Access

**File**: `backend/routes/aiRoutes.js`

**Current**: `router.post('/identify', protect, requireRole('admin', 'guide'), ...)`

**Change**: Add visitor token support OR create a separate public-facing identify endpoint.

**Recommended**: Create a new route that accepts visitor JWT:

```
POST /api/ai/identify-visitor   (visitor JWT or admin JWT)
```

This keeps the admin endpoint untouched and adds a visitor-accessible version with stricter rate limiting (e.g., 10 requests/hour per visitor).

### 5.2 Update AI Identify to Support Artifacts

**File**: `backend/controllers/aiController.js`

**Current**: Only fetches published exhibitions as GPT-4o context.

**Change**: Also fetch published artifacts and include them in the GPT-4o system prompt so it can match against both exhibitions and artifacts.

**Update response format**:
```json
{
  "matched": true,
  "entityType": "exhibition" | "artifact",
  "entityId": "...",
  "confidence": "high" | "medium" | "low",
  "description": "...",
  "entity": { /* full exhibition or artifact document */ }
}
```

### 5.3 Update QR Code Generation — Encode Entity Data

**File**: `backend/controllers/qrController.js`

**Current**: QR codes encode a URL: `${FRONTEND_URL}/exhibitions/${id}`

**Change**: QR codes should encode structured data for AR scanning:

```json
{
  "t": "exhibition",
  "id": "665a1b2c3d4e5f6g7h8i9j0k"
}
```

OR use a dual-purpose URL that works both as a web link AND contains parseable data:

```
${FRONTEND_URL}/ar?type=exhibition&id=665a1b2c3d4e5f6g7h8i9j0k
```

This way:
- If scanned with a normal QR reader → opens the AR page which fetches and displays content
- If scanned within the app's AR camera → parsed directly, no page navigation needed

**Also add**: QR generation for artifacts (currently only exhibitions have QR endpoints):

```
GET /api/qr/artifact/:artifactId
```

### 5.4 Add Narration for Artifacts

**File**: `backend/controllers/aiController.js`

**Current**: `POST /api/ai/narrate` only handles `exhibitionId` or raw `text`.

**Change**: Also accept `artifactId`:

```json
{ "artifactId": "..." }
```

Build narration text from artifact fields: name, description, historicalStory, dateCreated, originLocation.

### 5.5 Update Analytics Tracking

**File**: `backend/models/AnalyticsEvent.js`

**Current eventTypes**: `'view' | 'scan' | 'audio_play' | 'audio_complete' | 'trail_click' | 'share' | 'search' | 'bookmark' | 'qr_scan'`

**Add**: `'ar_scan' | 'ar_view' | 'ar_audio_play' | 'ar_dismiss'`

**Current entityTypes**: `'exhibition' | 'trail' | 'story'`

**Add**: `'artifact'`

---

## 6. Frontend Changes Required

### 6.1 New AR Scanner Page Component

**New File**: `frontend/src/pages/ARScanner.jsx`

This is the core new component. It replaces the current Scanner.jsx flow with a persistent camera experience.

**Responsibilities**:
- Start rear camera in full-screen mode
- Run QR code detection continuously (using `jsQR` or `@nicolo-ribaudo/qr-reader` library)
- When QR detected: parse data, fetch entity from public API, show overlay
- "Identify" button: capture frame, send to AI identify endpoint
- Overlay panel: entity info card, audio player, related content links
- Dismiss overlay to continue scanning
- Track analytics events

**Key UI States**:
1. **Scanning** — live camera, scanning indicator, "Identify" button
2. **Loading** — spinner overlay while fetching data
3. **Content Overlay** — semi-transparent card over camera with entity details
4. **Error** — brief error toast, camera continues

### 6.2 Update App.jsx Routing

**File**: `frontend/src/App.jsx`

**Add route**:
```jsx
<Route path="/ar" element={<ARScanner />} />
```

**Update redirect**: `/scanner` → `/ar` (currently redirects to `/search`)

### 6.3 Update Navigation

**File**: `frontend/src/components/Navbar.jsx`

**Add**: AR Scanner link in the navigation menu with a camera/scan icon.

### 6.4 Update Home Page CTA

**File**: `frontend/src/pages/Home.jsx`

**Current**: References "QR-Enabled AR Smart Tourism" but links to search/exhibitions.

**Change**: Add a prominent "Start AR Experience" button that links to `/ar`.

### 6.5 Update API Client

**File**: `frontend/src/api.js`

**Add**:
```javascript
// AR-specific identify (visitor-accessible)
export const aiIdentifyVisitor = (formData) =>
  API.post('/ai/identify-visitor', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

// Generate artifact QR (admin)
export const generateArtifactQR = (artifactId) =>
  AdminAPI.get(`/qr/artifact/${artifactId}`).then(res => res.data);
```

### 6.6 Update Admin QR Generation

**Files**: `AdminExhibitions.jsx`, `AdminArtifacts.jsx`

**Add**: QR code generation buttons on artifact list/detail pages (currently only exhibitions have this).

### 6.7 Update or Remove Old Scanner

**File**: `frontend/src/pages/Scanner.jsx`

**Option A**: Remove entirely — the AR Scanner replaces it.
**Option B**: Keep as a fallback for non-camera-capable devices, but redirect camera-capable devices to `/ar`.

---

## 7. Database Schema Changes

### 7.1 Artifact Model — Add AR Fields (Optional Enhancement)

**File**: `backend/models/Artifact.js`

```javascript
// Optional: Add AR-specific metadata
arOverlayImage: String,       // Special overlay image for AR view (if different from main image)
arDescription: {              // Shorter description optimized for AR overlay
  en: String, fr: String, rw: String
},
arAudioNarration: {           // Pre-generated audio for instant AR playback
  en: String, fr: String, rw: String
}
```

**These are optional.** The AR system can work without them by using existing fields. But pre-generated narration audio avoids real-time TTS API calls and provides instant playback.

### 7.2 Exhibition Model — Add AR Fields (Optional Enhancement)

**File**: `backend/models/Exhibition.js`

Same optional fields as Artifact above. The exhibition model already has `narration.full` and `narration.preview` audio fields, which can be reused for AR.

### 7.3 AnalyticsEvent Model — Extend Enums

**File**: `backend/models/AnalyticsEvent.js`

```javascript
eventType: {
  type: String,
  enum: [
    'view', 'scan', 'audio_play', 'audio_complete',
    'trail_click', 'share', 'search', 'bookmark', 'qr_scan',
    'ar_scan', 'ar_view', 'ar_audio_play', 'ar_dismiss'  // NEW
  ]
},
entityType: {
  type: String,
  enum: ['exhibition', 'trail', 'story', 'artifact']  // ADD 'artifact'
}
```

---

## 8. File-by-File Change Map

### Backend Files to Modify

| File | Change Type | What to Do |
|------|-------------|------------|
| `backend/routes/aiRoutes.js` | Modify | Add visitor-accessible identify route |
| `backend/controllers/aiController.js` | Modify | Add artifact context to GPT prompt, add `artifactId` to narrate, add visitor identify handler |
| `backend/routes/qrRoutes.js` | Modify | Add `GET /artifact/:artifactId` route |
| `backend/controllers/qrController.js` | Modify | Add artifact QR generation, update QR data format for AR |
| `backend/models/AnalyticsEvent.js` | Modify | Add new event types and entity types |
| `backend/server.js` | Modify | Mount new visitor AI route (if separate), adjust rate limits |

### Backend Files — No Changes Needed

| File | Why |
|------|-----|
| `backend/models/Artifact.js` | AR fields are optional; existing fields suffice |
| `backend/models/Exhibition.js` | Already has narration audio fields |
| All other routes/controllers | Existing public GET endpoints already serve the data AR needs |

### Frontend Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/pages/ARScanner.jsx` | Main AR camera + overlay component |

### Frontend Files to Modify

| File | Change Type | What to Do |
|------|-------------|------------|
| `frontend/src/App.jsx` | Modify | Add `/ar` route, update `/scanner` redirect |
| `frontend/src/api.js` | Modify | Add visitor identify + artifact QR API calls |
| `frontend/src/components/Navbar.jsx` | Modify | Add AR Scanner nav link |
| `frontend/src/pages/Home.jsx` | Modify | Add "Start AR Experience" CTA |
| `frontend/src/pages/admin/AdminArtifacts.jsx` | Modify | Add QR generation button per artifact |
| `frontend/src/i18n/en.json` | Modify | Add AR-related translation keys |
| `frontend/src/i18n/fr.json` | Modify | Add AR-related translation keys |
| `frontend/src/i18n/rw.json` | Modify | Add AR-related translation keys |

### Frontend Files — Optional Changes

| File | What |
|------|------|
| `frontend/src/pages/Scanner.jsx` | Remove or redirect to ARScanner |
| `frontend/src/pages/Search.jsx` | Remove embedded scanner, link to `/ar` instead |

---

## 9. Technology Stack Additions

### Frontend Dependencies to Add

| Package | Purpose | Size |
|---------|---------|------|
| `jsqr` | QR code detection from camera frames | ~50KB |

**That's it.** No heavy AR frameworks needed. The image-based AR overlay system uses:
- Native `getUserMedia` API (already used in Scanner.jsx)
- Canvas API for frame capture (already used)
- CSS positioning for overlays (standard Tailwind)
- `jsqr` for QR detection from video frames

### Backend Dependencies — None

No new backend dependencies required. The existing stack (Express, Mongoose, OpenAI SDK, qrcode) handles everything.

### Why No AR Framework is Needed

| Framework | What It Does | Why NOT Needed |
|-----------|-------------|----------------|
| A-Frame | 3D scene rendering in browser | No 3D models in this system |
| Three.js | WebGL 3D engine | No 3D rendering needed |
| AR.js | Marker-based AR with 3D models | No 3D, no spatial tracking |
| `<model-viewer>` | Display .glb/.gltf 3D models | No 3D model files |
| WebXR | Immersive AR/VR sessions | Overkill — just need camera + overlay |

**Image-based AR = live camera feed + 2D content overlay.** This is achievable with standard web APIs and CSS.

---

## 10. What This Is NOT

To be clear about scope boundaries:

| This IS | This is NOT |
|---------|-------------|
| 2D info overlays on camera feed | 3D model rendering in real space |
| QR-triggered content display | Markerless object tracking |
| AI image recognition (existing) | Real-time object detection (YOLO/TF) |
| Pre-recorded audio narration | Live AI-generated speech |
| Mobile web browser experience | Native app (iOS/Android) |
| Content cards floating over camera | Spatial anchoring to real surfaces |
| Single-entity view per scan | Multiple simultaneous AR markers |

### Summary

The current system already has **80% of the infrastructure** needed for image-based AR:
- Camera access and frame capture (Scanner.jsx)
- AI image recognition (GPT-4o identify endpoint)
- Audio narration (TTS endpoint)
- QR code generation (qrController)
- Rich multilingual content (exhibitions, artifacts, stories)
- Visitor authentication (access codes + JWT)
- Analytics tracking (events API)

**The main missing piece is the AR Scanner UI** — a full-screen camera view with continuous QR scanning and floating content overlays. The backend needs minor updates (visitor auth on AI endpoints, artifact QR codes, extended analytics), but no architectural changes.

**Estimated new code**: ~400-500 lines for `ARScanner.jsx`, ~50-80 lines of backend modifications across 4-5 files.
