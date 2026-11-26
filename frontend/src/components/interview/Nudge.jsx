export default function Nudge({ onHint }) {
  return (
    <aside className="nudge" aria-live="polite">
      <span className="nudge-icon" aria-hidden="true">?</span>
      <span>Take your time. Want a hint?</span>
      <button className="nudge-link" type="button" onClick={onHint}>Get a nudge</button>
    </aside>
  );
}
