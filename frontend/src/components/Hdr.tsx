import AudioControl from './AudioControl'
import AvatarMenu from './AvatarMenu'

interface HdrProps {
    audio: any;
    counter: number;
    isLoggedIn: boolean;
    userName: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    onSignOut: () => void;
}

function Hdr(props: HdrProps) {
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Lern-Studio</a>
                <AudioControl audio={props.audio} />
                <span className="counter mx-3">{props.counter}</span>
                {props.isLoggedIn && (
                    <AvatarMenu
                        userName={props.userName}
                        firstName={props.firstName}
                        lastName={props.lastName}
                        role={props.role}
                        score={props.counter}
                        onSignOut={props.onSignOut}
                    />
                )}
            </div>
        </nav>
    );
}

export default Hdr;
