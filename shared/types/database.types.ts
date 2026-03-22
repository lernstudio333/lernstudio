// ============================================================
// Database Types
//
// This file should be regenerated from the live Supabase schema using:
//
//   supabase gen types typescript --project-dir backend > shared/types/database.types.ts
//
// The types below are hand-authored placeholders derived from backend/schema.sql.
// Regenerate whenever the DB schema changes.
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      programs: {
        Row:    ProgramRow;
        Insert: Omit<ProgramRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProgramRow, 'id'>>;
      };
      courses: {
        Row:    CourseRow;
        Insert: Omit<CourseRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CourseRow, 'id'>>;
      };
      lessons: {
        Row:    LessonRow;
        Insert: Omit<LessonRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LessonRow, 'id'>>;
      };
      cards: {
        Row:    CardRow;
        Insert: Omit<CardRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CardRow, 'id'>>;
      };
      card_answers: {
        Row:    CardAnswerRow;
        Insert: Omit<CardAnswerRow, 'id'>;
        Update: Partial<Omit<CardAnswerRow, 'id'>>;
      };
      card_modes: {
        Row:    CardModeRow;
        Insert: CardModeRow;
        Update: Partial<CardModeRow>;
      };
      profiles: {
        Row:    ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProfileRow, 'id'>>;
      };
      media: {
        Row:    MediaRow;
        Insert: Omit<MediaRow, 'id' | 'created_at'>;
        Update: Partial<Omit<MediaRow, 'id'>>;
      };
      program_memberships: {
        Row:    ProgramMembershipRow;
        Insert: Omit<ProgramMembershipRow, 'added_at'>;
        Update: Partial<ProgramMembershipRow>;
      };
      course_memberships: {
        Row:    CourseMembershipRow;
        Insert: Omit<CourseMembershipRow, 'added_at'>;
        Update: Partial<CourseMembershipRow>;
      };
      tags: {
        Row:    TagRow;
        Insert: Omit<TagRow, 'id' | 'created_at'>;
        Update: Partial<Omit<TagRow, 'id'>>;
      };
    };
  };
}

// ── Row types ────────────────────────────────────────────────

export interface ProgramRow {
  id:           string;
  ext_id:       string | null;
  title:        string;
  description:  string | null;
  teaser_image: string | null; // uuid FK → media(id)
  teaser_text:  string | null;
  created_by:   string | null;
  position:     number;
  created_at:   string;
  updated_at:   string;
}

export interface CourseRow {
  id:          string;
  program_id:  string | null;
  ext_id:      string | null;
  title:       string;
  description: string | null;
  position:    number;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface LessonRow {
  id:            string;
  course_id:     string | null;
  ext_id:        string | null;
  title:         string;
  content:       string | null;
  google_doc_id: string | null;
  position:      number;
  created_at:    string;
  updated_at:    string;
}

export type CardType = 'SINGLE_CARD' | 'MULTI_CARD' | 'SYNONYM' | 'GAP' | 'IMAGES';

export interface CardRow {
  id:         string;
  ext_id:     string | null;
  lesson_id:  string | null;
  question:   string;
  card_type:  CardType;
  details:    string | null;
  source:     string | null;
  tip:        string | null;
  position:   number;
  created_at: string;
  updated_at: string;
}

export interface CardAnswerRow {
  id:          string;
  card_id:     string | null;
  answer_text: string | null;
  media_id:    string | null;
  position:    number;
}

export type CardModeType = 'DISPLAY_ANSWER' | 'MULTIPLE_CHOICE' | 'TYPED_ANSWER' | 'SELF_ASSESSMENT' | 'ARRANGE_ORDER';

export interface CardModeRow {
  card_id:   string;
  mode:      CardModeType;
  value:     number;
  min_score: number;
}

export interface ProfileRow {
  id:         string;
  first_name: string | null;
  last_name:  string | null;
  gas_token:  string | null;
  role:       'student' | 'editor' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface MediaRow {
  id:         string;
  media_type: 'image' | 'video';
  bucket:     string | null;
  path:       string | null;
  width:      number | null;
  height:     number | null;
  created_at: string;
}

export interface ProgramMembershipRow {
  user_id:    string;
  program_id: string;
  role:       'student' | 'editor';
  added_at:   string;
}

export interface CourseMembershipRow {
  user_id:   string;
  course_id: string;
  role:      'student' | 'editor';
  added_at:  string;
}

export interface TagRow {
  id:         string;
  name:       string;
  created_at: string;
}
