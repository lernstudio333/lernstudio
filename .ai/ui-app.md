# UI / App Design

This document describes the **design principles and UI components** of the learning app. It covers both user-facing screens and admin functionality, for mobile and desktop views.

It serves as a **design reference for developers and AI agents** implementing the UI.

> Enums are imported from `/shared` for type safety and consistency across frontend and backend.
> Enum references in this document use the format `EnumName.KEY` (e.g. `QuizMode.MULTIPLE_CHOICE`).
> Full definitions: `shared/core/enums.ts`. Engine behaviour: `.ai/quiz-engine.md`.

---

## 1. Guidelines and UX Principles

### 1.1 Mobile-First Philosophy
- The app is designed **mobile-first**, ensuring accessibility and clarity on small screens.
- Mobile devices receive a simplified interface:
  - Minimal header bar
  - Only essential UI elements are visible
  - Admin functionality is disabled
- Desktop users have access to the **full interface**, including the admin area.

### 1.2 Lesson-Centric Workflow
- The application emphasizes **focused lesson-based interactions**.
- Users select a lesson first; the interface then presents a **dedicated quiz workspace**.
- Hierarchical context (Program → Course → Lesson) is abstracted during active quizzing to reduce cognitive load.

### 1.3 Quiz / Learning Interaction
- Supports multiple question modes based on card type (`CardTypes`) and user progress:
  - **Multiple Choice** (`QuizMode.MULTIPLE_CHOICE`) — select the correct answer from options
  - **Self Assessment** (`QuizMode.SELF_ASSESSMENT`) — reveal answer and self-judge
  - **Arrange Order** (`QuizMode.ARRANGE_ORDER`) — drag parts into the correct sequence
  - **Typed Answer** (`QuizMode.TYPED_ANSWER`) — type a short answer
- Question complexity adapts to user performance (see Section 7).
- Desktop quiz layout:
  - Question displayed prominently at the top
  - Answer options organized in blocks (e.g. 2×2 grid)
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
- More details in `.ai/ui-admin.md`

---

## 2. UI Elements and Components

### 2.1 Header Bar (Desktop Only)
- Fixed top navigation present in desktop mode
- Elements include:
  - **Sound Level Slider**: adjusts audio feedback volume during quizzes
  - **Score Indicator**: displays cumulative or current session score
  - **Avatar Menu**: access profile, settings, admin dashboard (admin role only), and logout

### 2.2 Avatar Menu
- Placeholder avatar icon located in the top-right of the header bar
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
- Displayed immediately on app launch if the user is not authenticated
- Full-screen modal prompting:
  - Email / Username
  - Password
- Authentication performed via **Supabase Auth**
- Mobile-friendly layout: centered form, touch-friendly buttons

---

## 3. Landing Page (Post-Login)

After login the user sees two sections on the landing page:

### 3.1 Continue Studying

Displays the **last three lessons** the user studied.

Each entry is shown as a **breadcrumb-style link**:

```
Program → Course → Lesson
```

Each part of the breadcrumb is individually clickable:
- Clicking **Program** opens that program
- Clicking **Course** opens that course within the program
- Clicking **Lesson** goes directly to the lesson action screen

### 3.2 Programs

Programs are displayed as **portrait cards** in a responsive grid.

Each card contains:
- Program title
- Teaser image
- Teaser text

Clicking a card opens the program's course and lesson navigation.

---

## 4. Course & Lesson Navigation

When a program is opened the user sees a hierarchical view:

```
Program
└── Courses (accordion list)
    └── Lessons (expanded per course)
```

- Courses are displayed in an **accordion list**
- Each course can be expanded to reveal its lessons
- Lessons are listed below the expanded course

---

## 5. Lesson Actions

When a lesson is selected the UI shows three action buttons:

| Action | Enum | Description |
|---|---|---|
| **Learn New** | `StudyMode.NEW` | Focuses on cards the user has not yet mastered. Introduces new material. |
| **Repeat** | `StudyMode.REPEAT` | Reviews already-learned cards using spaced repetition to reinforce memory. |
| **View Cards** | — | Displays all cards in the lesson as a list. No quiz interaction. |

### 5.1 Future Feature: Difficult Items

Below the lesson actions a future section will display a **Difficult Items** list.

This list shows approximately **five cards** the user has struggled with most — those with the lowest score or highest error rate.

The purpose is to give users a quick way to revisit problem areas without starting a full session. The exact selection criteria will be defined later.

---

## 6. Quiz Modes

The active quiz mode for a card is determined by its `CardTypes` entry and the user's current learning score. See `.ai/quiz-engine.md` for the full progression rules.

### 6.1 Multiple Choice (`QuizMode.MULTIPLE_CHOICE`)

The question is displayed at the top.

Below the question, four answer options are shown.

**Desktop layout:** 2×2 grid of answer cards.
**Mobile layout:** vertical list.

An **"I don't know"** button is also available. Pressing it causes the card to reappear later in the session queue, similar to giving a wrong answer.

**Feedback behavior:**

- **Correct answer selected:**
  - Selected card turns green
  - Success sound plays
- **Incorrect answer selected:**
  - Selected card turns red
  - Correct card turns green

### 6.2 Self Assessment (`QuizMode.SELF_ASSESSMENT`)

The user first sees only the question and a **"Show Answer"** button.

After clicking, the correct answer is revealed.

Below the answer, three response buttons appear:

| Button | Error type | Meaning |
|---|---|---|
| **I don't know** | `ErrorType.SELF_ASSESS_WRONG` | User did not recall the answer |
| **Almost knew it** | `ErrorType.SELF_ASSESS_ALMOST` | User had partial recall |
| **Easy** | `ErrorType.NONE` | User recalled the answer confidently |

These buttons directly influence the card's learning score (via `ErrorType.scoreChange`) and determine how soon the card reappears.

### 6.3 Arrange Order (`QuizMode.ARRANGE_ORDER`)

Some cards have answers consisting of **multiple parts**.

These parts are shown as **draggable tags**.

The user must arrange the tags into the correct order.

The tags behave like a **flowing text line** (not a vertical list) — they wrap naturally and can be dragged into position inline.

### 6.4 Typed Answer (`QuizMode.TYPED_ANSWER`)

Some cards require the user to **type the answer**.

This mode is used primarily for short answers.

On mobile, a simplified keyboard layout may be shown to support efficient typing.

---

## 7. Learning Session Behavior

A learning session operates on a **queue of cards**.

**At session start:**
- A fixed set of cards is loaded based on the selected lesson and study mode (`StudyMode.NEW` or `StudyMode.REPEAT`)
- Cards are placed into a queue

**During the session:**
- Correct answers increase the card's learning score
- Incorrect answers or "I don't know" cause the card to reappear later in the queue
- The user sees a progress indicator showing position within the session

**The session ends when one of the following conditions is met:**
- All cards have been sufficiently learned (score above a threshold)
- A maximum number of rounds is reached
- All cards in the session are marked as fully completed

On session end, all updated scores are saved to the backend.

---

## 8. Visual Feedback & Rewards

The user's **score** is displayed in the **header bar**, to the left of the avatar menu.

When certain **score milestones** are reached (defined in the `Rewards` enum):
- A small **visual reward** (`Rewards.icon`) appears to the right of the score
- A brief **animation** (e.g. sparks or confetti) plays near the score
- Optional **audio feedback** (`Rewards.audio`) is played

These rewards encourage engagement and support motivation through gamification.

---

## 9. Responsive Behavior
- **Bootstrap handles most layout responsiveness**:
  - Utilize containers, rows, and columns for consistent behavior
  - Sidebar elements collapse automatically on small screens
- Ensure touch targets are large enough for mobile interactions
- Admin features hidden on mobile

---

## 10. Future Enhancements
- Dynamic progress indicators per lesson (e.g. percentage mastered)
- Adaptive question difficulty based on historical performance
- Integration of media gallery for image-based questions
- Difficult Items section (see Section 5.1)
