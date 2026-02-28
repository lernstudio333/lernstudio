# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:3000
npm test           # Run tests (interactive watch mode)
npm test -- --watchAll=false   # Run tests once (CI mode)
npm run build      # Production build to /build
npm run deploy     # Build + deploy to GitHub Pages
```

## Architecture

React 18 + TypeScript SPA bootstrapped with Create React App. Deployed to GitHub Pages at `lernstudio333.github.io/lernstudio`. Styling uses Bootstrap 5 with `react-bootstrap` components.

### View State Machine

`Body.tsx` controls which of the three main views is rendered, driven by a `MainState` value (`'CourseSelector' | 'LearnSession' | 'List'`):

- **CourseSelector** — initial screen; fetches available courses/docs from backend; user selects a course and learning method (`learnNew | repeat`) before starting
- **LearnSession** — the core learning session; fetches cards from backend and runs the spaced repetition loop
- **List (CardList)** — table view of all cards with their scores, errors, and favourites

### Backend: Google Apps Script

All data fetching is done via `fetch()` POST requests to a single Google Apps Script URL (hardcoded `appID` string in `CourseSelector.tsx`, `LearnSession.tsx`, and `CardList.tsx`). The `dataType` field in the JSON body selects the operation:

- `"docs"` — returns `Doc[]` (list of available courses)
- `"nextCards"` — returns a `Session` (questions + pool of answer options); controlled by `method` (`learnNew | repeat | list`) and `favouritesOnly`
- `"learnings"` — sends back updated learning scores after a session ends

Auth is handled via a `token` string that the user enters at login (`LoginModal.tsx`). It is stored in `App.tsx` state and threaded as a prop through `Body → CourseSelector/LearnSession/CardList`.

### Spaced Repetition (LearnSession.tsx)

- Questions are fetched once on mount and stored in a queue.
- After each answer, `updateQuestion()` adjusts `learning.score` and `learning.errs`, and `moveQuestion()` reinserts the card into the queue at a position based on answer quality (`NEAR / MIDDLE / END`).
- A card is marked `doneInThisSession` when `score >= 2` and answered correctly, or after 5 attempts.
- Session ends when `rounds > MAXROUNDS` (20, from `src/shared/config.ts`), `rounds > questions.length * 3`, or the next card in queue is already done.
- On session end, `sendHome()` POSTs all updated learnings to the backend.

### Question Rendering Modes

`questionType()` in `LearnSession` picks the rendering component based on `learning.score`:

- Score ≤ 3 → **`Question.tsx`** (multiple-choice answer buttons; answer options are randomly sampled from the session's answer pool via `randomSample` in `hooks/util.ts`)
- Score > 3 → **`QuestionAuto.tsx`** (show answer, self-judge: Nicht gewusst / Fast / Easy)

### Key Types (`src/shared/types.d.ts`)

Global TypeScript interfaces/types declared without `export` (ambient declarations available everywhere):
- `Question` — card data with optional `learning: { score, errs, fav, lastEdited }`
- `Options.type` — `"SC" | "MC" | "SYN" | "GAP"` determines question prompt wording
- `Answer` — `string[]` (multi-element answers render as `<ul>`)
- `AnswerLevel` — `'WRONG' | 'ALMOST' | 'CORRECT'`
- `MainState` / `LearnMethod`

### Stub Hooks

`src/hooks/useFetchDocs.ts` and `src/hooks/useFetchSessionData.ts` are legacy stubs with hardcoded test data; they are currently commented out in all components. Inline `fetch()` calls are used instead.
