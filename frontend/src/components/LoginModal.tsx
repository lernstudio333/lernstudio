import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { supabase } from '../lib/supabase';

function LoginModal(props: any) {

    const [email, setEmail] = useState<string>(import.meta.env.DEV ? "test01@test.com" : "")
    const [password, setPassword] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleLogin() {
        setError(null)
        setLoading(true)

        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('gas_token, first_name, last_name, role')
            .single()

        props.setUserName(data.user.email)
        props.setToken(profile?.gas_token ?? null)
        props.setFirstName(profile?.first_name ?? null)
        props.setLastName(profile?.last_name ?? null)
        props.setRole(profile?.role ?? null)
        props.setIsLoggedIn(true)
        setLoading(false)
    }

    return (
        <Modal show={!props.isLoggedIn} centered>
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
