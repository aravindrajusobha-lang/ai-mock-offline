import NavBar from './NavBar.jsx';

export default function PageFrame({ children }) {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="page-content">{children}</main>
      <footer className="site-footer">
        <span>Private practice, right on your device.</span>
        <span className="offline-indicator">
          <span className="status-dot" aria-hidden="true" />
          Designed for offline use
        </span>
      </footer>
    </div>
  );
}
