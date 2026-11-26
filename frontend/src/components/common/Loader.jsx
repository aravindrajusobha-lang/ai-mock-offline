export default function Loader({ label = 'Loading TalkReady...' }) {
  return (
    <main className="route-message" role="status" aria-live="polite">
      <span className="loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </main>
  );
}
