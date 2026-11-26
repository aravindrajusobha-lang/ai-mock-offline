const qualityLabels = {
  strong: 'Strong answer',
  partial: 'Partly there',
  weak: 'Keep building',
};

export default function ReactionLine({ reaction }) {
  if (!reaction) {
    return null;
  }

  const quality = typeof reaction === 'object'
    ? reaction.quality ?? reaction.label ?? reaction.type
    : null;
  const message = typeof reaction === 'string'
    ? reaction
    : reaction.message ?? reaction.text ?? reaction.reaction;
  const label = qualityLabels[quality] || 'Coach feedback';

  return (
    <div className={`reaction-line reaction-${quality || 'neutral'}`} role="status" aria-live="polite">
      <span className="reaction-label">{label}</span>
      {message && <span>{message}</span>}
    </div>
  );
}
