import { useEffect, useState } from 'react';
import { Accordion, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useLessonStore } from '../../stores/lessonStore';
import type { AdminProgram, AdminCourse, AdminLesson } from '../../types/admin.types';

interface ProgramNode extends AdminProgram {
  courses: (AdminCourse & { lessons: AdminLesson[] })[];
}

function ContentPage() {
  const [tree, setTree] = useState<ProgramNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setLessonContext = useLessonStore(s => s.setLessonContext);

  useEffect(() => {
    async function load() {
      const [progRes, courseRes, lessonRes] = await Promise.all([
        supabase.from('programs').select('*').order('position'),
        supabase.from('courses').select('*').order('position'),
        supabase.from('lessons').select('*').order('position'),
      ]);

      if (progRes.error || courseRes.error || lessonRes.error) {
        setError('Failed to load content');
        setLoading(false);
        return;
      }

      const programs = (progRes.data ?? []) as AdminProgram[];
      const courses = (courseRes.data ?? []) as AdminCourse[];
      const lessons = (lessonRes.data ?? []) as AdminLesson[];
      console.log('[ContentPage] fetched', { programs, courses, lessons });

      const built: ProgramNode[] = programs.map(p => ({
        ...p,
        courses: courses
          .filter(c => c.program_id === p.id)
          .map(c => ({
            ...c,
            lessons: lessons.filter(l => l.course_id === c.id),
          })),
      }));

      setTree(built);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-3"><Spinner animation="border" size="sm" /> Loading…</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h5 className="mb-3">Content</h5>
      <Accordion alwaysOpen>
        {tree.map(program => (
          <Accordion.Item key={program.id} eventKey={program.id}>
            <Accordion.Header>{program.title}</Accordion.Header>
            <Accordion.Body className="p-0">
              {program.courses.map(course => (
                <div key={course.id} className="border-bottom">
                  <div className="px-3 py-2 fw-semibold bg-light text-muted small text-start">{course.title}</div>
                  {course.lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      className="px-4 py-2 hover-bg-light cursor-pointer border-top small text-start"
                      style={{ cursor: 'pointer' }}
                      onClick={() => { setLessonContext(program.id, course.id); navigate(`/admin/lessons/${lesson.id}`); }}
                    >
                      {lesson.title}
                    </div>
                  ))}
                  {course.lessons.length === 0 && (
                    <div className="px-4 py-2 text-muted fst-italic small text-start">No lessons</div>
                  )}
                </div>
              ))}
              {program.courses.length === 0 && (
                <div className="px-3 py-2 text-muted fst-italic small text-start">No courses</div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}

export default ContentPage;
