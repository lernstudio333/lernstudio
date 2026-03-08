# UI / App Design

This document describes the **design principles and UI components** of the learning app. It covers both user-facing screens and admin functionality, for mobile and desktop views.

---

## 1. Guidelines and UX Principles

### 1.1 Mobile-First Philosophy
- The app is designed **mobile-first**, ensuring accessibility and clarity on small screens.
- Mobile devices receive a simplified interface:
  - Minimal top bar
  - Only essential UI elements are visible
  - Admin functionality is disabled
- Desktop users have access to the **full interface**, including the admin area.

### 1.2 Lesson-Centric Workflow
- The application emphasizes **focused lesson-based interactions**.
- Users select a lesson first; the interface then presents a **dedicated quiz workspace**.
- Hierarchical context (Program → Course → Lesson) is abstracted during active editing to reduce cognitive load.

### 1.3 Quiz / Learning Interaction
- Supports multiple question types based on progress:
  - Single-choice (`SC`)
  - Multiple-choice (`MC`)
  - Synonyms (`SYN`)
  - Gap-fill (`GAP`)
  - Image-based (`IMG-SC`, `IMG-MC`)
- Question complexity adapts to user performance:
  - Beginner: simple prompts, limited distractors
  - Advanced: multi-answer patterns and more challenging arrangements
- Desktop quiz layout:
  - Question displayed prominently at the top
  - Answer options organized in blocks (e.g., 2×2 grid for multi-select or image buttons)
- Mobile quiz layout:
  - Question and answers stacked vertically
  - Large interactive buttons for tap targets
- **Session Progress Management**:
  - Progress is tracked locally during the session
  - Changes are persisted to the backend **only when the session is completed or explicitly aborted**

### 1.4 Desktop Admin Area
- Accessible exclusively on desktop
- Provides full lesson and content management capabilities
- Integrated into the same workspace without disrupting lesson-focused workflows
- more details in .ai/ui-admin.md

---

## 2. UI Elements and Components

### 2.1 Top Bar (Desktop Only)
- Fixed top navigation present in desktop mode
- Elements include:
  - **Sound Level Slider**: adjusts audio feedback volume during quizzes
  - **Score Indicator**: displays cumulative or current session score
  - **Avatar Menu**: access profile, settings, admin dashboard (admin role only), and logout

### 2.2 Avatar Menu
- Placeholder avatar icon located in the top-right
- On click, displays dropdown with:
  - **Header** (centered):
    - User name
    - Email
    - Current score
  - Divider
  - Menu items (left-aligned, with small icons):
    - Settings
    - Admin Dashboard (visible to admin users only)
  - Divider
  - Sign out
- Dropdown uses default Bootstrap styling: light background, subtle border
- Collapses gracefully on smaller screens

### 2.3 Login Overlay
- Displayed immediately on app launch
- Full-screen modal prompting:
  - Email / Username
  - Password
- Authentication performed via **Supabase Auth**
- Mobile-friendly layout: centered form, touch-friendly buttons

### 2.4 Lesson Selection
- Presents the user with a list of available lessons
- Future enhancements: hierarchical navigation `Program → Course → Lesson`
- Mobile:
  - Scrollable vertical list
  - Touch-optimized selection
- Desktop:
  - Optional side panel for navigation
  - Progress indicators visible alongside lesson names

### 2.5 Quiz Workspace
- Activated upon lesson selection
- Layout adapts to screen size:
  - **Desktop**: question on top, answer blocks below
  - **Mobile**: stacked layout
- Answer blocks:
  - Multi-select answers organized in 2×2 or appropriate grids
  - Image-based answers shown in selectable boxes
- Top bar remains visible in desktop quiz view for audio control and score visibility

---

## 3. Responsive Behavior
- **Bootstrap handles most layout responsiveness**:
  - Utilize containers, rows, and columns for consistent behavior
  - Sidebar elements collapse automatically on small screens
- Ensure touch targets are large enough for mobile interactions
- Admin features hidden on mobile

---

## 4. Future Enhancements
- Program → Course → Lesson hierarchy in lesson selection
- Dynamic progress indicators per lesson
- Adaptive question difficulty based on historical performance
- Integration of media gallery for image-based questions