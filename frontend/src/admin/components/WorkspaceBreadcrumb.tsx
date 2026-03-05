import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface BreadcrumbData {
  lessonTitle: string;
  courseTitle: string;
  programTitle: string;
}

interface Props {
  lessonId: string;
}

function WorkspaceBreadcrumb({ lessonId }: Props) {
  const [data, setData] = useState<BreadcrumbData | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from('lessons')
      .select('title, course:courses(title, program:programs(title))')
      .eq('id', lessonId)
      .single()
      .then(({ data: row }) => {
        if (!row) return;
        const course = Array.isArray(row.course) ? row.course[0] : row.course;
        const program = course ? (Array.isArray(course.program) ? course.program[0] : course.program) : null;
        setData({
          lessonTitle: row.title,
          courseTitle: course?.title ?? '',
          programTitle: program?.title ?? '',
        });
        setTitle(row.title);
      });
  }, [lessonId]);

  async function saveTitle() {
    if (!title.trim() || title === data?.lessonTitle) { setEditing(false); return; }
    await supabase.from('lessons').update({ title }).eq('id', lessonId);
    setData(d => d ? { ...d, lessonTitle: title } : d);
    setEditing(false);
  }

  if (!data) return <div className="text-muted small">Loading…</div>;

  return (
    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
      <Link to="/admin/content" className="text-decoration-none small">← Content</Link>
      <span className="text-muted small">/</span>
      <span className="text-muted small">{data.programTitle}</span>
      <span className="text-muted small">/</span>
      <span className="text-muted small">{data.courseTitle}</span>
      <span className="text-muted small">/</span>
      {editing ? (
        <input
          ref={inputRef}
          className="form-control form-control-sm d-inline-block w-auto"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false); }}
          autoFocus
        />
      ) : (
        <span
          className="fw-semibold"
          style={{ cursor: 'pointer' }}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {data.lessonTitle}
        </span>
      )}
    </div>
  );
}

export default WorkspaceBreadcrumb;
