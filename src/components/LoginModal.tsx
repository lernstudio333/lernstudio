import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

function LoginModal(props: any) {
   
    const [userName, setUserName] = useState<string>("")
    const [token, setToken] = useState<string>("")


    function handleClose() {
        console.log("SUBMIT")
        console.log(token)
        props.setUserName(userName)
        props.setToken(token)
        props.setIsLoggedIn(true)
        
    };
    
    return (
        <>
            <Modal 
                show={!props.isLoggedIn} 
                onHide={handleClose}
                centered
            >
                <Modal.Header>
                    <Modal.Title>Login</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3" controlId="modalLogin.Email">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="name@example.com"
                                autoFocus
                                value={userName}
                                onChange={ e => setUserName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group
                            className="mb-3"
                            controlId="modalLogin.Token"
                        >
                            <Form.Label>Token</Form.Label>
                            <Form.Control 
                                type="password"
                                placeholder="Password"
                                value={token}
                                onChange={ e => setToken(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleClose}>
                        Login
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default LoginModal;