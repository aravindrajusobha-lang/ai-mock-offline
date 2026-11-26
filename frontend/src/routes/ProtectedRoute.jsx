import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';

export default function ProtectedRoute({ children }) {
  const { status, restoreError, refreshUser } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Loader label="Restoring your TalkReady session..." />;
  }

  if (status === 'error') {
    return (
      <main className="route-message">
        <ErrorBanner error={restoreError} onRetry={refreshUser} />
      </main>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
