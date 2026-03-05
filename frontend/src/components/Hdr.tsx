import AudioControl from './AudioControl'
import AvatarMenu from './AvatarMenu'
import { useAuth } from '../contexts/AuthContext';

interface HdrProps {
    audio: any;
    counter: number;
}

function Hdr({ audio, counter }: HdrProps) {
    const { isLoggedIn } = useAuth();
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Lern-Studio</a>
                <AudioControl audio={audio} />
                <span className="counter mx-3">{counter}</span>
                {isLoggedIn && (
                    <AvatarMenu score={counter} />
                )}
            </div>
        </nav>
    );
}

export default Hdr;
