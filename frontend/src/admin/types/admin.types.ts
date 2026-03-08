export type CardType = 'SC' | 'MC' | 'SYN' | 'GAP' | 'IMG-SC' | 'IMG-MC';

export type CardModeType =
  | 'SHOW'
  | 'MULTIPLECARDS'
  | 'MULTIPLEANSWERS'
  | 'SORTPARTS'
  | 'SELFASSES'
  | 'TYPE'
  | 'ALIKES'
  | 'MULTIPLECARDS_BW'
  | 'SORTPARTS_BW'
  | 'SELFASSES_BW'
  | 'TYPE_BW';

export interface CardAnswer {
  id: string;
  card_id: string;
  answer_text: string;
  is_correct: boolean;
  position: number;
  media_id: string | null;
}

export interface CardMode {
  id: string;
  card_id: string;
  mode: CardModeType;
  value: number;
  min_score: number;
}

export interface AdminCard {
  id: string;
  lesson_id: string;
  question: string;
  card_type: CardType;
  tipp: string | null;
  details: string | null;
  source: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  answers: CardAnswer[];
  modes: CardMode[];
}

export interface AdminLesson {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface AdminCourse {
  id: string;
  program_id: string;
  title: string;
  position: number;
}

export interface AdminProgram {
  id: string;
  title: string;
  position: number;
}

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  gas_token: string | null;
}

export interface AdminMedia {
  id: string;
  bucket: string;
  path: string;
  media_type: 'image' | 'video';
  width: number | null;
  height: number | null;
  created_at: string;
}
