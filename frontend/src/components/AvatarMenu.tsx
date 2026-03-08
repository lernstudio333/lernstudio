import Dropdown from 'react-bootstrap/Dropdown';
import { BsPersonCircle, BsGearFill, BsSpeedometer2, BsBoxArrowRight } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
    score: number;
}

function AvatarMenu({ score }: Props) {
    const { isLoggedIn, isInitializing, userName, firstName, lastName, role, signOut } = useAuth();
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || userName || '—';

    console.log('[AvatarMenu] render state:', { isInitializing, isLoggedIn, userName, role });

    // Loading: show non-clickable dimmed icon while session is being restored
    if (isInitializing) {
        return <BsPersonCircle size={28} className="text-muted opacity-50" />;
    }

    // Logged out: show plain icon (LoginModal handles login)
    if (!isLoggedIn) {
        return <BsPersonCircle size={28} className="text-muted" />;
    }

    // Logged in: full dropdown
    return (
        <Dropdown align="end">
            <Dropdown.Toggle
                as="button"
                id="avatar-dropdown"
                className="btn btn-link p-0 border-0 text-body d-flex align-items-center"
            >
                <BsPersonCircle size={28} />
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ minWidth: '220px' }} className="shadow-sm">
                <div className="text-center px-3 py-2">
                    <div className="fw-semibold">{displayName}</div>
                    <div className="text-muted small">{userName}</div>
                    <div className="small mt-1 text-secondary">Score: {score}</div>
                </div>

                <Dropdown.Divider />

                <Dropdown.Item href="#settings">
                    <BsGearFill className="me-2 text-secondary" />Settings
                </Dropdown.Item>

                {(role === 'admin' || role === 'course_editor') && (
                    <Dropdown.Item as={Link} to="/admin">
                        <BsSpeedometer2 className="me-2 text-secondary" />Admin Dashboard
                    </Dropdown.Item>
                )}

                <Dropdown.Divider />

                <Dropdown.Item onClick={signOut} className="text-danger">
                    <BsBoxArrowRight className="me-2" />Sign out
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default AvatarMenu;
