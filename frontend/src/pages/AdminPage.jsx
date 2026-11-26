import { useCallback, useEffect, useState } from 'react';
import { getUserCount } from '../api/admin.js';
import Button from '../components/common/Button.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';

function parseUserCount(response) {
  const count = Number.isSafeInteger(response)
    ? response
    : response?.userCount ?? response?.count ?? response?.data?.userCount;
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error('The TalkReady server returned an invalid user count.');
  }
  return count;
}

export default function AdminPage() {
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUserCount(parseUserCount(await getUserCount()));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  return (
    <PageFrame>
      <section className="admin-panel" aria-labelledby="admin-title">
        <p className="eyebrow">Administration</p>
        <h1 id="admin-title">Admin overview</h1>
        <p className="welcome-copy">View-only information for TalkReady.</p>
        {loading ? (
          <Loader label="Loading user count..." />
        ) : error ? (
          <ErrorBanner error={error} onRetry={loadCount} />
        ) : (
          <div className="user-count-card" aria-live="polite">
            <span className="user-count-label">Registered users</span>
            <strong>{userCount}</strong>
          </div>
        )}
        {!loading && !error && (
          <Button variant="text" onClick={loadCount}>Refresh count</Button>
        )}
      </section>
    </PageFrame>
  );
}
