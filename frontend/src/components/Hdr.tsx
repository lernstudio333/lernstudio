import AudioControl from './AudioControl'
import AvatarMenu from './AvatarMenu'

interface HdrProps {
    audio: any;
    counter: number;
}

function Hdr({ audio, counter }: HdrProps) {
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Lern-Studio</a>
                <AudioControl audio={audio} />
                <span className="counter mx-3">{counter}</span>
                <AvatarMenu score={counter} />
            </div>
        </nav>
    );
}

export default Hdr;
