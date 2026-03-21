import { useState } from 'react';
import { Button } from 'react-bootstrap';
import type { ProgramWithCourses, CourseWithLessons, LessonSummary, StudyAction } from 'shared/features/programs';

// ── Circle chevron toggle ───────────────────────────────────────

function ChevronCircle({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--bs-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.15s',
      }}
    >
      {/* Two-line chevron drawn with CSS borders */}
      <div style={{
        width: 8, height: 8,
        borderRight: '2.5px solid white',
        borderBottom: '2.5px solid white',
        transform: isOpen ? 'rotate(-135deg) translateY(2px)' : 'rotate(45deg) translateY(-2px)',
        transition: 'transform 0.2s',
      }} />
    </div>
  );
}

// ── Letter-circle icon for courses ──────────────────────────────

function CourseIcon({ title, open }: { title: string; open: boolean }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: open ? 'rgba(255,255,255,0.3)' : 'var(--bs-primary)',
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.8rem', fontWeight: 700,
      flexShrink: 0,
    }}>
      {title.charAt(0).toUpperCase()}
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
    <div
      className={`border-top ${selected ? 'bg-primary bg-opacity-10' : 'bg-white'}`}
      style={{ transition: 'background 0.15s' }}
    >
      <div
        className="px-3 py-2"
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer' }}
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
          <Button size="sm" variant="primary"         onClick={() => onAction('NEW')}>    Learn New </Button>
          <Button size="sm" variant="outline-primary"  onClick={() => onAction('REPEAT')}> Repeat    </Button>
          <Button size="sm" variant="outline-secondary" onClick={() => onAction('LIST')}>   View Cards</Button>
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
      {/* Course header */}
      <div
        className={`d-flex align-items-center justify-content-between px-3 py-3 ${
          open ? 'bg-primary text-white' : 'bg-primary bg-opacity-10'
        }`}
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        aria-expanded={open}
      >
        <div className="d-flex align-items-center gap-2">
          <CourseIcon title={course.title} open={open} />
          <span className={`fw-medium small ${open ? 'text-white' : ''}`}>
            {course.title}
          </span>
        </div>
        <ChevronCircle isOpen={open} />
      </div>

      {/* Lesson list */}
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
  program: ProgramWithCourses;
  onBack: () => void;
  onLessonAction: (lessonId: string, action: StudyAction) => void;
}

export default function ProgramView({ program, onBack, onLessonAction }: Props) {
  const [openCourseId, setOpenCourseId]     = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  function toggleCourse(id: string) {
    const opening = openCourseId !== id;
    setOpenCourseId(opening ? id : null);
    setSelectedLessonId(null);   // deselect lesson when switching courses
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="outline-secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <h5 className="mb-0">{program.title}</h5>
      </div>

      {/* Course accordion */}
      {program.courses.length === 0 ? (
        <p className="text-muted">No courses in this program yet.</p>
      ) : (
        <div className="border rounded overflow-hidden">
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
