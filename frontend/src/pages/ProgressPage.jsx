import { Link } from 'react-router-dom';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import useProgress from '../hooks/useProgress.js';

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function display(value) {
  if (value === undefined || value === null || value === '') {
    return 'Not available';
  }
  return value;
}

function topicText(topic) {
  return typeof topic === 'string'
    ? topic
    : topic?.title ?? topic?.name ?? topic?.topic ?? 'Topic';
}

export default function ProgressPage() {
  const { progress, loading, error, refresh } = useProgress();
  const weakTopics = progress
    ? pick(progress.weakTopics, progress.weak_topics, progress.topicsToReview, [])
    : [];
  const average = progress
    ? pick(progress.averageScore, progress.average_score, progress.average, progress.averages?.score)
    : undefined;
  const sessions = progress
    ? pick(progress.sessionsCompleted, progress.sessions_completed, progress.totalSessions, progress.total_sessions)
    : undefined;

  return (
    <PageFrame>
      <section className="progress-page" aria-labelledby="progress-title">
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">Your practice at a glance</p>
            <h1 id="progress-title">Progress</h1>
            <p className="welcome-copy">Use your feedback to choose what to practice next.</p>
          </div>
          <Link className="button button-primary" to="/history">Practice history</Link>
        </div>

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {loading && !progress ? (
          <Loader label="Loading your progress..." />
        ) : progress ? (
          <>
            <div className="progress-metrics">
              <article className="progress-metric">
                <span>Average score</span>
                <strong>{display(average)}</strong>
                <small>As returned by TalkReady</small>
              </article>
              <article className="progress-metric">
                <span>Sessions completed</span>
                <strong>{display(sessions)}</strong>
                <small>Keep showing up for practice.</small>
              </article>
            </div>

            <section className="weak-topics" aria-labelledby="weak-topics-title">
              <div>
                <p className="eyebrow">Focus for next time</p>
                <h2 id="weak-topics-title">Topics to revisit</h2>
              </div>
              {Array.isArray(weakTopics) && weakTopics.length > 0 ? (
                <ul>
                  {weakTopics.map((topic, index) => <li key={`${index}-${topicText(topic)}`}>{topicText(topic)}</li>)}
                </ul>
              ) : (
                <p>No topics to revisit were returned yet. Keep practicing and check back here.</p>
              )}
            </section>
          </>
        ) : null}
      </section>
    </PageFrame>
  );
}
