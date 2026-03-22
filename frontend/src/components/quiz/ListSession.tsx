import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { FetchStudyCardsResponse, StudyCardWithLearning } from 'shared/features/study';
import { toBasicCard } from './sessionUtils';
import CardAnswer from './CardAnswer';

interface Props {
  lessonId: string;
  onClose:  () => void;
}

export default function ListSession({ lessonId, onClose }: Props) {
  const [cards,    setCards]    = useState<StudyCardWithLearning[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  useEffect(() => {
    supabase.functions
      .invoke<FetchStudyCardsResponse>('fetch-study-cards', {
        body: { lessonId, quizMode: 'LIST' },
      })
      .then(({ data, error: fnError }) => {
        if (fnError || !data) {
          setError(fnError?.message ?? 'Failed to load cards');
        } else {
          setCards(data.studyCards);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>← Back</button>
        <h5 className="mb-0">Cards ({cards.length})</h5>
      </div>

      {loading && (
        <div className="text-center py-5">
          <span className="spinner-border" role="status" />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && cards.length === 0 && (
        <p className="text-muted">No cards in this lesson yet.</p>
      )}

      <div className="d-flex flex-column gap-3">
        {cards.map((card, i) => (
          <div key={card.id} className="card shadow-sm">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <span className="text-muted small">{i + 1}</span>
                <div className="flex-grow-1">
                  <p className="mb-2 fw-medium">{card.question}</p>
                  <div className="text-muted small">
                    <CardAnswer answer={toBasicCard(card).answer} />
                  </div>
                </div>
                {card.learning && (
                  <span className="badge bg-secondary-subtle text-secondary-emphasis">
                    {card.learning.score}
                  </span>
                )}
              </div>

              {card.tip && (
                <div className="d-flex justify-content-end mt-2">
                  <button
                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => toggleExpanded(card.id)}
                  >
                    {expanded.has(card.id) ? 'show less' : 'show more'}
                  </button>
                </div>
              )}

              {card.tip && expanded.has(card.id) && (
                <>
                  <hr className="my-2" />
                  <p className="mb-0 text-muted small fst-italic" style={{ whiteSpace: 'pre-line' }}>{card.tip}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
