export default function MissedPoints({ points }) {
  const items = Array.isArray(points)
    ? points
    : points === undefined || points === null || points === ''
      ? []
      : [points];

  return (
    <section className="coaching-card coaching-danger" aria-label="Missed points">
      <h2>Missed points</h2>
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => {
            const text = typeof item === 'string'
              ? item
              : item?.text ?? item?.point ?? item?.description ?? JSON.stringify(item);
            return <li key={`${index}-${text}`}>{text}</li>;
          })}
        </ul>
      ) : (
        <p className="coaching-empty">No missed points were returned for this session.</p>
      )}
    </section>
  );
}
