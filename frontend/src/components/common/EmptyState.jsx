import { Link } from 'react-router-dom';

export default function EmptyState({ actionLabel, actionTo, description, title }) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <span className="empty-icon" aria-hidden="true">+</span>
      <h2 id="empty-title">{title}</h2>
      <p>{description}</p>
      <Link className="button button-primary" to={actionTo}>{actionLabel}</Link>
    </section>
  );
}
