function valuesFrom(content) {
  if (Array.isArray(content)) {
    return content.map((item) => (
      typeof item === 'string'
        ? item
        : item?.text ?? item?.message ?? item?.point ?? JSON.stringify(item)
    ));
  }
  if (content && typeof content === 'object') {
    if (Array.isArray(content.items)) {
      return valuesFrom(content.items);
    }
    return [content.text ?? content.message ?? content.tip ?? JSON.stringify(content)];
  }
  return content === undefined || content === null || content === '' ? [] : [String(content)];
}

export default function CoachingCard({ content, title, tone }) {
  const points = valuesFrom(content);
  return (
    <section className={`coaching-card coaching-${tone}`} aria-label={title}>
      <h2>{title}</h2>
      {points.length > 0 ? (
        points.length === 1 ? (
          <p>{points[0]}</p>
        ) : (
          <ul>{points.map((point, index) => <li key={`${index}-${point}`}>{point}</li>)}</ul>
        )
      ) : (
        <p className="coaching-empty">No feedback was provided for this section.</p>
      )}
    </section>
  );
}
