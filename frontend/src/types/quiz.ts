import { UserRole } from "./auth";

export type QuizStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category_id?: string;
  version: number;
  status: QuizStatus;
  duration_minutes: number;
  passing_percentage: number;
  maximum_attempts: number;
  negative_marking: number;
  difficulty: DifficultyLevel;
  randomize_questions: boolean;
  randomize_options: boolean;
  thumbnail_path?: string;
  created_at: string;
}

export type AttemptStatus = "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED";

export interface Attempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  status: AttemptStatus;
  started_at: string;
  expires_at: string;
  total_questions: number;
  score?: number;
  percentage?: number;
  correct_answers?: number;
  incorrect_answers?: number;
  unanswered_answers?: number;
  submitted_at?: string;
  time_taken_seconds?: number;
}
