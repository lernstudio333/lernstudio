import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProgramWithCourses, FetchProgramsResponse, StudyAction } from 'shared/features/programs';
import ProgramView from './ProgramView';

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
  onLessonAction: (lessonId: string, action: StudyAction) => void;
}

export default function LandingPage({ onLessonAction }: Props) {
  const [programs, setPrograms]               = useState<ProgramWithCourses[] | null>(null); // null = loading
  const [error, setError]                     = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithCourses | null>(null);

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
  }, []);

  // Show program detail view when a program is selected
  if (selectedProgram) {
    return (
      <ProgramView
        program={selectedProgram}
        onBack={() => setSelectedProgram(null)}
        onLessonAction={onLessonAction}
      />
    );
  }

  return (
    <div className="container py-4">

      {/* ── Continue Studying ─────────────────────────────── */}
      <section className="mb-5">
        <h5 className="mb-3">Continue Studying</h5>
        <div className="rounded border p-3 bg-light text-muted small fst-italic">
          Your three most recently studied lessons will appear here.
          <span className="ms-1 text-body-tertiary">(Coming in Step 15)</span>
        </div>
      </section>

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
