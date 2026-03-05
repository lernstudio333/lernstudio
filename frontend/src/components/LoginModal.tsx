import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../contexts/AuthContext';

function LoginModal() {
    const { isLoggedIn, login } = useAuth();
    const [email, setEmail] = useState<string>(import.meta.env.DEV ? "test01@test.com" : "")
    const [password, setPassword] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        setError(null)
        setLoading(true)
        const err = await login(email, password)
        if (err) setError(err)
        setLoading(false)
    }

    return (
        <Modal show={!isLoggedIn} centered>
            <Modal.Header>
                <Modal.Title>Lernstudio</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                <Form onSubmit={e => { e.preventDefault(); handleLogin() }}>
                    <Form.Group className="mb-3" controlId="login.Email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
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
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="primary"
                    onClick={handleLogin}
                    disabled={loading || !email || !password}
                    className="w-100"
                >
                    {loading ? 'Signing in…' : 'Sign in'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default LoginModal;
