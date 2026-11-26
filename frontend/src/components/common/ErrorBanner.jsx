import { BackendUnreachableError } from '../../api/client.js';
import Button from './Button.jsx';

export default function ErrorBanner({ error, onRetry }) {
  const message = error instanceof BackendUnreachableError
    ? "Can't reach the TalkReady server"
    : error?.message || 'Something went wrong.';

  return (
    <div className="error-banner" role="alert">
      <span className="error-icon" aria-hidden="true">!</span>
      <div className="error-content">
        <strong>{message}</strong>
        {onRetry && (
          <Button className="retry-button" variant="text" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
