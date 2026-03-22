import type { StudyCardAnswer } from 'shared/features/study';

export interface SessionCard {
  // Static card data
  id:       string;
  cardType: string;
  question: string;
  tip:      string | null;
  answers:  StudyCardAnswer[];

  // Learning state (updated during session)
  score:        number;
  initialScore: number;        // score at session start — used for doneInThisSession
  errorsByType: Record<string, number>;
  lastVisited:  string | null;
  favoriteDate: string | null;
  isFavorite:   boolean;

  // Session tracking
  answeredInThisSession: number;
  doneInThisSession:     boolean;
}

export type QuizModeKey  = 'DISPLAY_ANSWER' | 'MULTIPLE_CHOICE' | 'SELF_ASSESSMENT';
export type AnswerOutcome = 'CORRECT' | 'ALMOST' | 'WRONG';
