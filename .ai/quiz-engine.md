# Quiz Engine — Conceptual Architecture

This document describes the **conceptual architecture of the quiz engine** used by the learning app.

It serves as a reference for developers and AI agents implementing the quiz system.

The concepts described here will be implemented in a shared module. Implementation details (TypeScript interfaces, enums, scoring formulas) are defined elsewhere.

---

## 1. Overview

The quiz engine is the core of the learning experience. It is responsible for:

- **Selecting quiz modes** — deciding how a card is presented based on its type and the user's current learning score
- **Transforming card data** — modifying question and answer content before display (e.g. reversing direction)
- **Evaluating answers** — determining whether the user's response was correct, partial, or wrong
- **Updating learning scores** — adjusting per-card scores based on answer quality
- **Determining learning progression** — deciding when a card advances to a harder mode or is considered learned

The system is designed to be **flexible and data-driven**. Card types define their own quiz behaviors, progression rules, and available modes. This means new card types can be added without changing the engine's core logic.

---

## 2. Card Model

A card is the fundamental unit of learning content. Each card contains:

- **cardType** — determines how the card behaves in the quiz engine
- **question** — the prompt shown to the user
- **answer** — the correct response
- **tip** — optional hint shown to assist the user

The answer can take different formats depending on the card type:

1. **Single text string** — one correct answer as plain text
2. **Array of strings** — multiple parts, synonyms, or ordered elements
3. **Array of images** — visual answers (e.g. for image-based card types)

Quiz components, transformers, and filters must be able to handle all three formats.

---

## 3. Card Types

Every card belongs to a **card type**. The card type defines the quiz behavior for that card.

Example card types:

| Card Type | Description |
|---|---|
| `SINGLE_CARD` | A card with a single text question and a single text answer |
| `MULTI_CARD` | A card with multiple correct answers |
| `SYNONYM` | A card asking for a synonym or equivalent term |
| `GAP` | A card where the user must complete a gap in a sentence |
| `IMAGES` | A card where answers are images rather than text |

Each card type defines:

- **How questions are phrased** — the wording used to introduce the question (e.g. "What does X mean?" vs. "Complete the sentence:")
- **Which quiz modes are available** — not all modes are valid for all card types
- **How difficulty progresses** — which modes are used at low scores vs. high scores

### Quizzing Rules

Each card type defines a list of **quizzing rules**.

A quizzing rule specifies how a card should be quizzed at a given stage of learning. Each rule contains:

- **Quiz mode** — the interaction mode to use (see Section 4)
- **Transformer** *(optional)* — a transformation applied to the card data before display (see Section 5)
- **Filter** *(optional)* — a condition that must be true for the rule to apply (see Section 6)
- **Minimum learning score** — the score the user must have reached before this rule becomes active
- **Supersede behavior** — whether this rule replaces (supersedes) earlier rules once the score threshold is reached

This rule-based system allows **gradual progression from easier to harder quiz modes** as the user's learning score increases. A card might start in `DISPLAY_ANSWER` mode for a new learner and progress to `TYPED_ANSWER` once the card is well-known.

---

## 4. Quiz Modes

A quiz mode defines the type of interaction the user has with a card. The quiz engine selects the appropriate mode based on the card type's quizzing rules and the user's current score.

| Quiz Mode | Description |
|---|---|
| `DISPLAY_ANSWER` | The question and answer are shown immediately, with no user input required. Used for introduction or review of entirely new material. |
| `MULTIPLE_CHOICE` | The user selects the correct answer from a set of options. Incorrect options (distractors) are drawn from the distractor pool. |
| `TYPED_ANSWER` | The user types the answer as free text. Used for short, unambiguous answers. |
| `SELF_ASSESSMENT` | The user sees the question, requests the answer, then self-reports how well they knew it. |
| `ARRANGE_ORDER` | The answer consists of multiple parts. The user arranges draggable tags into the correct order. |

Quiz modes describe **interaction behavior only**. They do not define UI components or visual design.

---

## 5. Transformers

A transformer modifies card data **before it is presented to the user** as a quiz question.

Transformers operate on a simplified card structure containing:

- question
- answer
- tip

This keeps transformers independent of the full card data model.

Example transformers:

| Transformer | Description |
|---|---|
| `backward` | Swaps the question and answer. Allows a card to be quizzed in reverse — the user sees the answer and must supply the question. |
| `partRandomize` | Randomizes the order of parts in a multi-part answer. Used to prevent positional memorization. |
| `pickAnswer` | Selects one answer from a set of alternatives to use as the displayed answer for this round. |
| `pickFirstAnswer` | Always selects the first answer from a multi-part answer set as the canonical answer. |

Transformers are composable — multiple transformers can be applied in sequence to a single card before it is quizzed.

---

## 6. Filters

A filter determines **whether a quizzing rule is applicable** to a specific card instance.

Filters return a boolean: `true` means the rule can be applied, `false` means it should be skipped.

Example filter:

| Filter | Description |
|---|---|
| `shortAnswer` | Returns `true` only if the answer text is short enough for typed input to be practical. Prevents `TYPED_ANSWER` mode from being used for long or complex answers. |

Filters allow card-type rules to be defined broadly while still excluding individual cards where the mode would not make sense.

---

## 7. Error Types

When a user answers a question, the outcome is classified as an **error type**.

Error types capture the nature of the user's response with more granularity than a simple correct/incorrect flag.

Example error types:

| Error Type | Description |
|---|---|
| `NONE` | The answer was fully correct with no errors |
| `MC_WRONG` | A wrong option was selected in multiple choice |
| `TYPING_MISSPELLED` | The typed answer was close but had a spelling error |
| `TYPING_WRONG` | The typed answer was clearly incorrect |
| `SELF_ASSESS_ALMOST` | The user self-reported partial recall |
| `SELF_ASSESS_WRONG` | The user self-reported no recall |
| `ARRANGE_ORDER_ALMOST` | The order was partially correct |
| `ARRANGE_ORDER_WRONG` | The order was substantially incorrect |

Error types influence:

- **Score changes** — how much the learning score increases or decreases
- **Learning progression** — whether the card moves forward, stays, or is pushed back in the queue

Exact scoring values and delta rules are defined elsewhere.

---

## 8. Learning Score

Each **user–card combination** has a learning score that reflects how well the user knows that card.

The score changes over time based on answer quality:
- Correct answers increase the score
- Wrong or partial answers decrease or hold the score

The learning score determines:

- **Which quiz modes become available** — higher scores unlock harder modes (e.g. typed answers instead of multiple choice)
- **When a card is considered learned** — once the score reaches a threshold, the card is treated as mastered for the current session
- **When a card enters spaced repetition** — well-learned cards are scheduled for review at increasing intervals

Exact formulas and thresholds are defined elsewhere.

---

## 9. Rewards

The app provides **visual and audio rewards** when score milestones are reached.

Rewards are tied to cumulative score thresholds. As the user progresses through sessions, they unlock successive reward symbols:

🌱 → 🍀 → 🙈 → 🌸 → 🪷 → 💋 → 🏆

Rewards serve as **motivational feedback** — they acknowledge effort, mark progress, and make the learning experience more engaging (gamification).

When a milestone is reached:
- The reward symbol is shown in the header bar
- A brief animation plays near the score (e.g. sparks or confetti)
- Optional audio feedback is played

---

## 10. Relationship to Backend

The quiz engine runs entirely on the **frontend** during a session. The backend is responsible for storage and supply of data; the frontend handles all runtime quiz logic.

**Backend responsibilities:**
- Selects study cards for the session based on quiz mode and user learning state (`fetch-study-cards` Edge Function)
- Provides a pool of distractor **cards** (not just answers) for multiple-choice options
- Stores learning progress (score, error counts, last studied date) per user–card combination (`batch-update-learnings` Edge Function)

**Frontend quiz engine responsibilities:**
- Runs the learning session loop
- Manages the card queue (ordering, reinsertion of wrong answers)
- Applies transformers and filters to card data
- Evaluates answers and classifies error types
- Updates learning scores locally during the session

**At session end:**
The frontend sends the full updated learning state (final scores, complete `errors_by_type` dict) to the backend in a single batch update. The backend replaces the stored state — it does not accumulate deltas. Score is floored at 0 server-side.

---

## 11. Card Selection Algorithm

Implemented in `shared/features/study/selectionAlgorithm.ts` (pure, testable). The Edge Function `fetch-study-cards` calls it after fetching DB data.

### Study Card Selection

| Mode | Logic |
|------|-------|
| **NEW** | 1. In-progress cards (`0 ≤ score < THRESHOLD`, not reviewed in last 2h), sorted descending by score (near-complete first). 2. Fill remaining slots with cards never studied (`learning = null`). Returns at most `studyCardCount` cards; fewer if not enough available. |
| **REPEAT** | Cards with `score ≥ THRESHOLD`, sorted by urgency `(daysPassed + 1 + jitter) / score` descending. High urgency = overdue + low score. |
| **LIST** | All cards in lesson order. No count limit. User browses with full learning state visible. |

All modes support `favoriteOnly` filter (`favoriteDate != null`).

Constants: `THRESHOLD_NEW_VS_REPEAT = 7`, `MIN_CARD_REVIEW_INTERVAL_ms = 2h`, `NUMBER_CARDS_PER_SESSION = 20`.

> **Note:** The REPEAT urgency formula is an intentional fix from the legacy algorithm (which had the sort direction inverted). A future improvement is to replace the linear `daysPassed` term with a logarithmic/exponential scale.

### Distractor Card Selection

Distractors are full cards (not just answer strings — this differs from the legacy implementation).

1. Try cards from the **same lesson**, excluding selected study cards — random shuffle
2. If not enough, expand to **sister lessons** in the same course
3. Target count: `distractorCardCount` (default `NUMBER_DISTRACTOR_CARDS = 100`)
4. Future: weight toward cards of same type, similar answer length, same tags
