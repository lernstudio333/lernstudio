import AudioControl from './AudioControl';
import AvatarMenu from './AvatarMenu';
import './Hdr.css';

interface HdrProps {
  audio:      any;
  counter:    number;
  rewardIcon: string | null;
}

function Hdr({ audio, counter, rewardIcon }: HdrProps) {
  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">Lern-Studio</a>
        <AudioControl audio={audio} />

        <div className="flex-grow-1" />

        {/* Score + reward icon */}
        <div className="d-flex align-items-center gap-1 me-3">
          <span className="counter">{counter}</span>
          {/* Reserve fixed-width space so score doesn't jump when icon appears */}
          <span className="reward-icon-slot">
            {rewardIcon && (
              <span className="reward-icon" key={rewardIcon + counter}>
                {rewardIcon}
              </span>
            )}
          </span>
        </div>

        <AvatarMenu score={counter} />
      </div>
    </nav>
  );
}

export default Hdr;
