export type CardType = 'SINGLE_CARD' | 'MULTI_CARD' | 'SYNONYM' | 'GAP' | 'IMAGES';

export type CardModeType = 'DISPLAY_ANSWER' | 'MULTIPLE_CHOICE' | 'TYPED_ANSWER' | 'SELF_ASSESSMENT' | 'ARRANGE_ORDER';

export interface CardAnswer {
  id: string;
  card_id: string;
  answer_text: string;
  position: number;
  media_id: string | null;
  media?: { path: string } | null;
}

export interface CardMode {
  card_id:   string;
  mode:      CardModeType;
  value:     number;
  min_score: number;
}

export interface AdminCard {
  id: string;
  ext_id: string | null;
  lesson_id: string;
  question: string;
  card_type: CardType;
  tip: string | null;
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
  id:           string;
  title:        string;
  position:     number;
  teaser_image: string | null;
  teaser_text:  string | null;
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
