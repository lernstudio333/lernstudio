import Dropdown from 'react-bootstrap/Dropdown';
import { BsPersonCircle, BsGearFill, BsSpeedometer2, BsBoxArrowRight } from 'react-icons/bs';
import { supabase } from '../lib/supabase';

interface Props {
    userName: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    score: number;
    onSignOut: () => void;
}

function AvatarMenu({ userName, firstName, lastName, role, score, onSignOut }: Props) {
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || userName || '—';

    async function handleSignOut() {
        await supabase.auth.signOut();
        onSignOut();
    }

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

                {role === 'admin' && (
                    <Dropdown.Item href="#admin">
                        <BsSpeedometer2 className="me-2 text-secondary" />Admin Dashboard
                    </Dropdown.Item>
                )}

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleSignOut} className="text-danger">
                    <BsBoxArrowRight className="me-2" />Sign out
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default AvatarMenu;
