import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import useHistory from '../hooks/useHistory.js';

function formatDate(value) {
  if (!value) {
    return 'Date not provided';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date not provided'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function getSessionId(session) {
  return session.sessionId ?? session.session_id ?? session.id;
}

function getScore(session) {
  return session.totalScore
    ?? session.total_score
    ?? session.score?.total
    ?? (typeof session.score === 'object' ? null : session.score)
    ?? null;
}

export default function HistoryPage() {
  const { sessions, loading, error, refresh } = useHistory();

  return (
    <PageFrame>
      <section className="history-page" aria-labelledby="history-title">
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">Look how far you have come</p>
            <h1 id="history-title">Practice history</h1>
            <p className="welcome-copy">Open a report to revisit the feedback from a session.</p>
          </div>
          <Link className="button button-primary" to="/setup">Start a session</Link>
        </div>

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {loading ? (
          <Loader label="Loading your practice history..." />
        ) : sessions.length === 0 && !error ? (
          <EmptyState
            title="Your first practice session is waiting"
            description="Start an interview to build a history you can learn from."
            actionLabel="Start practicing"
            actionTo="/setup"
          />
        ) : (
          <div className="history-list">
            {sessions.map((session, index) => {
              const id = getSessionId(session);
              const title = session.topicTitle ?? session.topic_title ?? session.title ?? 'Interview practice';
              const score = getScore(session);
              return (
                <article className="history-card" key={id ?? `${title}-${index}`}>
                  <div className="history-card-copy">
                    <span className="history-date">{formatDate(session.finishedAt ?? session.finished_at ?? session.startedAt ?? session.started_at)}</span>
                    <h2>{title}</h2>
                    <span className="history-status">{session.status ?? 'Session complete'}</span>
                  </div>
                  <div className="history-card-end">
                    {score !== null && <span className="history-score">Score: {score}</span>}
                    {id !== undefined && id !== null ? (
                      <Link className="button button-secondary" to={`/report/${encodeURIComponent(id)}`}>
                        Open report
                      </Link>
                    ) : (
                      <span className="history-status">Report unavailable</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
