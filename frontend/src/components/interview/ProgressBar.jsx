export default function ProgressBar({ current, total }) {
  const valid = Number.isFinite(current) && Number.isFinite(total) && total > 0;
  const progress = valid ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <div className="progress-block">
      <div className="progress-label">
        <span>Interview progress</span>
        <span>{valid ? `Question ${current} of ${total}` : 'Progress updates as you go'}</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Interview progress"
        aria-valuemin="0"
        aria-valuemax={valid ? total : 100}
        aria-valuenow={valid ? current : progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
