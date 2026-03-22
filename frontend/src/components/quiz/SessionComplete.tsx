interface Props {
  isSaving:   boolean;
  onContinue: () => void;
}

export default function SessionComplete({ isSaving, onContinue }: Props) {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
      <h2 className="mb-4">Session Complete!</h2>
      <p className="mb-4">
        <img
          src={import.meta.env.BASE_URL + 'youdidit.gif'}
          alt="You did it!"
          style={{ maxWidth: '100%', borderRadius: '0.5rem' }}
        />
      </p>
      {isSaving ? (
        <p className="text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Saving progress…
        </p>
      ) : (
        <button className="btn btn-primary px-4" onClick={onContinue}>
          Continue
        </button>
      )}
    </div>
  );
}
