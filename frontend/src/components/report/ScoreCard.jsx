function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

export default function ScoreCard({ report }) {
  const score = firstValue(
    report.totalScore,
    report.total_score,
    report.score?.total,
    report.score?.value,
    typeof report.score === 'number' || typeof report.score === 'string' ? report.score : null,
  );
  const maxScore = firstValue(report.maxScore, report.max_score, report.score?.maximum);
  const band = firstValue(report.band, report.scoreBand, report.score_band, report.score?.band);

  return (
    <section className="score-card" aria-labelledby="score-title">
      <p className="eyebrow">Session result</p>
      <h2 id="score-title">Your score</h2>
      <div className="score-value">
        <strong>{score === undefined ? '—' : score}</strong>
        {maxScore !== undefined && <span>of {maxScore}</span>}
      </div>
      {band && <p className="score-band">{band}</p>}
      {score === undefined && (
        <p className="score-unavailable">The server did not include a score for this session.</p>
      )}
    </section>
  );
}
