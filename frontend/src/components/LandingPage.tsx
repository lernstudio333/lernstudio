import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProgramWithCourses, FetchProgramsResponse, StudyAction, RecentLesson, FetchRecentLessonsResponse } from 'shared/features/programs';
import ProgramView from './ProgramView';

// ── Recent lesson skeleton row ───────────────────────────────────

function RecentLessonSkeleton() {
  return (
    <div className="d-flex align-items-center gap-3 py-2 placeholder-glow">
      <div className="flex-grow-1">
        <span className="placeholder col-5 d-block mb-1" style={{ height: '0.9rem' }} />
        <span className="placeholder col-8 d-block" style={{ height: '0.75rem' }} />
      </div>
      <span className="placeholder col-2" style={{ height: '2rem', borderRadius: 4 }} />
    </div>
  );
}

// ── Recent lesson row ────────────────────────────────────────────

function RecentLessonRow({
  lesson,
  onAction,
  isLast,
}: {
  lesson:   RecentLesson;
  onAction: (lessonId: string, action: StudyAction) => void;
  isLast:   boolean;
}) {
  const breadcrumb = `${lesson.programTitle} › ${lesson.courseTitle}`;
  const isNew      = lesson.studyMode === 'NEW';

  return (
    <div className={`d-flex align-items-center gap-3 py-2${isLast ? '' : ' border-bottom'}`}>
      <div className="flex-grow-1 overflow-hidden">
        <div
          className="text-muted small text-truncate"
          title={breadcrumb}
          style={{ fontSize: '0.75rem' }}
        >
          {breadcrumb}
        </div>
        <div className="fw-semibold text-truncate" title={lesson.lessonTitle}>
          {lesson.lessonTitle}
        </div>
      </div>
      <button
        className={`btn btn-sm flex-shrink-0 ${isNew ? 'btn-primary' : 'btn-outline-secondary'}`}
        style={{ minWidth: '6rem' }}
        onClick={() => onAction(lesson.lessonId, lesson.studyMode)}
      >
        {isNew ? 'Study New' : 'Repeat'}
      </button>
    </div>
  );
}

// ── Skeleton card ───────────────────────────────────────────────

function ProgramCardSkeleton() {
  return (
    <div className="col">
      <div className="card h-100 placeholder-glow">
        <div
          className="placeholder"
          style={{ height: 160, borderRadius: '0.375rem 0.375rem 0 0' }}
        />
        <div className="card-body">
          <h6 className="placeholder col-8 mb-2" />
          <p className="card-text mb-0">
            <span className="placeholder col-12 d-block mb-1" />
            <span className="placeholder col-9 d-block" />
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Program card ────────────────────────────────────────────────

function ProgramCard({ program, onClick }: { program: ProgramWithCourses; onClick: () => void }) {
  return (
    <div className="col">
      <div
        className="card h-100 shadow-sm"
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {program.teaserImage
          ? <img
              src={program.teaserImage}
              alt={program.title}
              style={{ height: 160, width: '100%', objectFit: 'cover', borderRadius: '0.375rem 0.375rem 0 0' }}
            />
          : <div
              className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
              style={{ height: 160, borderRadius: '0.375rem 0.375rem 0 0', fontSize: '3rem' }}
            >
              📚
            </div>
        }
        <div className="card-body d-flex flex-column">
          <h6 className="card-title fw-semibold mb-1">{program.title}</h6>
          {program.teaserText && (
            <p className="card-text text-muted small mb-0 flex-grow-1">{program.teaserText}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LandingPage ─────────────────────────────────────────────────

interface Props {
  onLessonAction: (lessonId: string, action: StudyAction, program: ProgramWithCourses | null) => void;
  initialProgram?:  ProgramWithCourses | null;
  initialLessonId?: string | null;
}

export default function LandingPage({ onLessonAction, initialProgram = null, initialLessonId = null }: Props) {
  const [programs, setPrograms]               = useState<ProgramWithCourses[] | null>(null); // null = loading
  const [error, setError]                     = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCourses | null>(initialProgram);
  const [recentLessons, setRecentLessons]     = useState<RecentLesson[] | null>(null); // null = loading

  useEffect(() => {
    supabase.functions
      .invoke<FetchProgramsResponse>('fetch-programs')
      .then(({ data, error: fnError }) => {
        if (fnError) {
          setError(fnError.message ?? 'Failed to load programs');
        } else {
          setPrograms(data?.programs ?? []);
        }
      });

    supabase.functions
      .invoke<FetchRecentLessonsResponse>('recent-lessons')
      .then(({ data }) => {
        setRecentLessons(data?.lessons ?? []);
      })
      .catch(() => setRecentLessons([]));
  }, []);

  // Show program detail view when a program is selected
  if (selectedProgram) {
    return (
      <ProgramView
        program={selectedProgram}
        onBack={() => setSelectedProgram(null)}
        onLessonAction={(lessonId, action) => onLessonAction(lessonId, action, selectedProgram)}
        initialLessonId={initialLessonId}
      />
    );
  }

  return (
    <div className="container py-4">

      {/* ── Continue Studying ─────────────────────────────── */}
      {(recentLessons === null || recentLessons.length > 0) && (
        <section className="mb-5">
          <h5 className="mb-3">Continue Studying</h5>
          <div className="border rounded px-3 py-1">
            {recentLessons === null
              ? Array.from({ length: 3 }).map((_, i) => <RecentLessonSkeleton key={i} />)
              : recentLessons.map((lesson, i) => (
                  <RecentLessonRow
                    key={lesson.lessonId}
                    lesson={lesson}
                    onAction={(lessonId, action) => onLessonAction(lessonId, action, null)}
                    isLast={i === recentLessons.length - 1}
                  />
                ))
            }
          </div>
        </section>
      )}

      {/* ── Programs ──────────────────────────────────────── */}
      <section>
        <h5 className="mb-3">Programs</h5>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {/* 2 per row on mobile, 4 on md+ */}
        <div className="row row-cols-2 row-cols-md-4 g-3">
          {programs === null
            ? Array.from({ length: 4 }).map((_, i) => <ProgramCardSkeleton key={i} />)
            : programs.length === 0
              ? (
                <div className="col-12">
                  <p className="text-muted">You are not enrolled in any programs yet.</p>
                </div>
              )
              : programs.map((p) => (
                <ProgramCard
                  key={p.id}
                  program={p}
                  onClick={() => setSelectedProgram(p)}
                />
              ))
          }
        </div>
      </section>
    </div>
  );
}
