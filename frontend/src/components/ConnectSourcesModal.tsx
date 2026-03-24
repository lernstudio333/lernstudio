import { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { BsClipboard, BsCheckLg } from 'react-icons/bs';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LessonInfo {
    title:   string;
    courses: { title: string; programs: { title: string } | null } | null;
}

interface Integration {
    id:         string;
    doc_name:   string;
    doc_id:     string;
    lesson_id:  string | null;
    last_sync:  string | null;
    created_at: string;
    lessons:    LessonInfo | null;
}

interface Props {
    show:   boolean;
    onHide: () => void;
}

type Status = 'loading' | 'ready' | 'error';

export default function ConnectSourcesModal({ show, onHide }: Props) {
    const { firstName, lastName, userName } = useAuth();
    const linkedAccount = [firstName, lastName].filter(Boolean).join(' ') || userName || '—';

    const [status, setStatus]             = useState<Status>('loading');
    const [pairingCode, setPairingCode]   = useState<string | null>(null);
    const [countdown, setCountdown]       = useState(300);
    const [copied, setCopied]             = useState(false);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!show) return;
        void requestPairingCode();
        void loadIntegrations();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [show]);

    async function requestPairingCode() {
        setStatus('loading');
        setPairingCode(null);
        setCountdown(300);
        setCopied(false);
        if (timerRef.current) clearInterval(timerRef.current);

        const { data, error } = await supabase.functions.invoke('integration-pairing-codes', {
            body: {},
        });

        if (error || !data?.pairing_code) {
            setStatus('error');
            return;
        }

        setPairingCode(data.pairing_code as string);
        setStatus('ready');

        const expiresAt = new Date(data.expires_at as string).getTime();
        timerRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining === 0 && timerRef.current) clearInterval(timerRef.current);
        }, 1000);
    }

    async function loadIntegrations() {
        const { data } = await supabase
            .from('integrations')
            .select('id, doc_name, doc_id, lesson_id, last_sync, created_at, lessons(title, courses(title, programs(title)))')
            .order('created_at', { ascending: false });
        setIntegrations((data as Integration[]) ?? []);
    }

    function handleCopy() {
        if (!pairingCode) return;
        navigator.clipboard.writeText(pairingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function formatCountdown(seconds: number) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function formatSync(ts: string | null) {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString();
    }

    function formatLesson(integration: Integration) {
        const l = integration.lessons;
        if (!l) return <span className="text-danger fst-italic">Lesson deleted</span>;
        const course   = l.courses;
        const program  = course?.programs;
        const breadcrumb = [program?.title, course?.title, l.title].filter(Boolean).join(' › ');
        return (
            <>
                <div>{breadcrumb}</div>
                <div className="font-monospace text-muted" style={{ fontSize: '0.7em' }}>{integration.lesson_id}</div>
            </>
        );
    }

    return (
        <Modal show={show} onHide={onHide} centered size="xl" animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Connect Sources</Modal.Title>
            </Modal.Header>
            <Modal.Body>

                {/* ── Pairing code ── */}
                <div className="mb-4">
                    {status === 'loading' && (
                        <div className="d-flex align-items-center gap-2 text-muted">
                            <Spinner animation="border" size="sm" />
                            <span className="small">Code requested…</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="d-flex align-items-center gap-3">
                            <span className="text-danger small">Failed to generate pairing code.</span>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => void requestPairingCode()}>
                                Retry
                            </button>
                        </div>
                    )}

                    {status === 'ready' && pairingCode && (
                        <>
                            <div className="fw-semibold mb-2">Pairing Code</div>
                            <div className="d-flex align-items-center gap-3 mb-2">
                                <div className="d-flex gap-1">
                                    {pairingCode.split('').map((digit, i) => (
                                        <span
                                            key={i}
                                            className="d-flex align-items-center justify-content-center rounded border fw-bold fs-5"
                                            style={{ width: 40, height: 48, background: '#f8f9fa' }}
                                        >
                                            {digit}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                                    onClick={handleCopy}
                                    title="Copy code"
                                >
                                    {copied ? <BsCheckLg /> : <BsClipboard />}
                                </button>
                                <span className="text-muted small">
                                    Expires in {formatCountdown(countdown)}
                                </span>
                            </div>
                            <p className="text-muted small mb-0">
                                Copy this code and paste it into the sidebar of your Google Doc.
                                <br />
                                <em>(This code expires in 5 minutes and can be used once.)</em>
                            </p>
                        </>
                    )}
                </div>

                {/* ── Connected docs ── */}
                <div className="fw-semibold mb-2">Connected Docs</div>
                {integrations.length === 0 ? (
                    <p className="text-muted small mb-0">No docs connected yet.</p>
                ) : (
                    <Table size="sm" className="mb-0">
                        <thead>
                            <tr className="text-muted small">
                                <th>Doc Name</th>
                                <th>Doc ID</th>
                                <th>Target Lesson</th>
                                <th>Linked Account</th>
                                <th>Last Sync</th>
                            </tr>
                        </thead>
                        <tbody className="small">
                            {integrations.map((doc) => (
                                <tr key={doc.id}>
                                    <td>{doc.doc_name}</td>
                                    <td className="font-monospace text-muted" style={{ fontSize: '0.75em' }}>
                                        {doc.doc_id}
                                    </td>
                                    <td>{formatLesson(doc)}</td>
                                    <td>{linkedAccount}</td>
                                    <td>{formatSync(doc.last_sync)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

            </Modal.Body>
        </Modal>
    );
}
