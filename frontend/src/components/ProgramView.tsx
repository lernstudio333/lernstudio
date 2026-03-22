import { useState } from 'react';
import { Button } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import type { ProgramWithCourses, CourseWithLessons, LessonSummary, StudyAction } from 'shared/features/programs';
import './ProgramView.css';

// ── Circle chevron toggle ───────────────────────────────────────

function ChevronCircle({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={`chevron-circle${isOpen ? ' chevron-circle--open' : ''}`} aria-hidden="true">
      <i className={`bi bi-chevron-down chevron-icon${isOpen ? ' open' : ''}`} />
    </div>
  );
}

// ── Letter-circle icon for courses ──────────────────────────────

function CourseIcon({ open }: { open: boolean }) {
  return (
    <div className={`course-icon ${open ? 'course-icon--open' : ''}`}>
      <i className="bi bi-journal-text" />
    </div>
  );
}

// ── Lesson row ──────────────────────────────────────────────────

function LessonRow({
  lesson,
  selected,
  onSelect,
  onAction,
}: {
  lesson: LessonSummary;
  selected: boolean;
  onSelect: () => void;
  onAction: (action: StudyAction) => void;
}) {
  return (
    <div className={`border-top lesson-row ${selected ? 'lesson-row--selected' : 'card-subtle'}`}>
      <div
        className="px-3 py-2 text-start"
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        aria-expanded={selected}
      >
        <span className={`small fw-medium ${selected ? 'text-primary' : ''}`}>
          {lesson.title}
        </span>
      </div>

      {selected && (
        <div className="px-3 pb-3 d-flex gap-2 flex-wrap">
          <Button size="sm" variant="primary"           onClick={() => onAction('NEW')}>   Learn New  </Button>
          <Button size="sm" variant="outline-primary"   onClick={() => onAction('REPEAT')}> Repeat     </Button>
          <Button size="sm" variant="outline-secondary" onClick={() => onAction('LIST')}>   View Cards </Button>
        </div>
      )}
    </div>
  );
}

// ── Course accordion item ───────────────────────────────────────

function CourseItem({
  course,
  open,
  onToggle,
  selectedLessonId,
  onLessonSelect,
  onLessonAction,
  borderTop,
}: {
  course: CourseWithLessons;
  open: boolean;
  onToggle: () => void;
  selectedLessonId: string | null;
  onLessonSelect: (id: string | null) => void;
  onLessonAction: (lessonId: string, action: StudyAction) => void;
  borderTop: boolean;
}) {
  return (
    <div className={borderTop ? 'border-top' : ''}>
      <div
        className={`d-flex align-items-center justify-content-between px-3 py-3 course-header ${
          open ? 'bg-primary text-white' : 'bg-primary bg-opacity-10'
        }`}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-expanded={open}
      >
        <div className="d-flex align-items-center gap-2">
          <CourseIcon open={open} />
          <span className={`fw-medium small ${open ? 'text-white' : ''}`}>
            {course.title}
          </span>
        </div>
        <ChevronCircle isOpen={open} />
      </div>

      {open && (
        <div>
          {course.lessons.length === 0 ? (
            <div className="px-3 py-2 text-muted small border-top">No lessons yet.</div>
          ) : (
            course.lessons.map((lesson: LessonSummary) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                selected={selectedLessonId === lesson.id}
                onSelect={() => onLessonSelect(selectedLessonId === lesson.id ? null : lesson.id)}
                onAction={(action) => onLessonAction(lesson.id, action)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── ProgramView ─────────────────────────────────────────────────

interface Props {
  program:          ProgramWithCourses;
  onBack:           () => void;
  onLessonAction:   (lessonId: string, action: StudyAction) => void;
  initialLessonId?: string | null;
}

export default function ProgramView({ program, onBack, onLessonAction, initialLessonId = null }: Props) {
  const initialCourseId = initialLessonId
    ? (program.courses.find(c => c.lessons.some((l: LessonSummary) => l.id === initialLessonId))?.id ?? null)
    : null;

  const [openCourseId, setOpenCourseId]         = useState<string | null>(initialCourseId);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(initialLessonId);

  function toggleCourse(id: string) {
    const opening = openCourseId !== id;
    setOpenCourseId(opening ? id : null);
    setSelectedLessonId(null);
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="outline-secondary" size="sm" onClick={onBack}>
          <i className="bi bi-arrow-left me-1" />Back
        </Button>
        <h5 className="mb-0">{program.title}</h5>
      </div>

      {program.courses.length === 0 ? (
        <p className="text-muted fst-italic">No courses in this program yet.</p>
      ) : (
        <div className="shadow-sm rounded overflow-hidden accordion-container">
          {program.courses.map((course: CourseWithLessons, idx: number) => (
            <CourseItem
              key={course.id}
              course={course}
              open={openCourseId === course.id}
              onToggle={() => toggleCourse(course.id)}
              selectedLessonId={selectedLessonId}
              onLessonSelect={setSelectedLessonId}
              onLessonAction={onLessonAction}
              borderTop={idx > 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
