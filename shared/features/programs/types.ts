export type StudyAction = 'NEW' | 'REPEAT' | 'LIST';

export interface LessonSummary {
  id: string;
  title: string;
  lastVisited: string | null;
}

export interface CourseWithLessons {
  id: string;
  title: string;
  lessons: LessonSummary[];
}

export interface ProgramWithCourses {
  id: string;
  title: string;
  teaserImage: string | null;
  teaserText: string | null;
  courses: CourseWithLessons[];
}

export interface FetchProgramsResponse {
  programs: ProgramWithCourses[];
}
