import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../contexts/AuthContext';

const LAST_EMAIL_KEY = 'lastLoginEmail';

function LoginModal() {
    const { isLoggedIn, isInitializing, login } = useAuth();
    const [email, setEmail] = useState<string>(() =>
        import.meta.env.DEV ? 'test01@test.com' : (localStorage.getItem(LAST_EMAIL_KEY) ?? '')
    );
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleLogin() {
        setError(null);
        setLoading(true);
        const err = await login(email, password);
        if (err) {
            setError(err);
        } else {
            localStorage.setItem(LAST_EMAIL_KEY, email);
        }
        setLoading(false);
    }

    // Single modal, always mounted — avoids Bootstrap mount/unmount flash.
    // animation={false} prevents fade transitions that can briefly expose content.
    return (
        <Modal show={isInitializing || !isLoggedIn} centered animation={false}>
            <Modal.Header>
                <Modal.Title className={isInitializing ? 'text-muted' : ''}>Lernstudio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isInitializing ? (
                    <div className="placeholder-glow d-flex flex-column gap-3 py-1">
                        <div className="placeholder col-4 rounded" style={{ height: '14px' }} />
                        <div className="placeholder col-12 rounded" style={{ height: '36px' }} />
                        <div className="placeholder col-3 rounded" style={{ height: '14px' }} />
                        <div className="placeholder col-12 rounded" style={{ height: '36px' }} />
                    </div>
                ) : (
                    <>
                        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                        <Form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
                            <Form.Group className="mb-3" controlId="login.Email">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    autoComplete="username"
                                    placeholder="name@example.com"
                                    autoFocus
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="login.Password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </Form.Group>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                {isInitializing ? (
                    <div className="placeholder-glow w-100">
                        <div className="placeholder col-12 rounded" style={{ height: '38px' }} />
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        onClick={handleLogin}
                        disabled={loading || !email || !password}
                        className="w-100"
                    >
                        {loading ? 'Signing in…' : 'Sign in'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
}

export default LoginModal;
