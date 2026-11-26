import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function NavBar() {
  const { user, status, logout } = useAuth();

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="TalkReady home">
        <span className="brand-mark" aria-hidden="true">T</span>
        <span>TalkReady</span>
      </Link>
      <span className="header-caption">Interview practice, at your pace</span>
      <nav className="header-actions" aria-label="Account">
        {status === 'authenticated' ? (
          <>
            <Link className="header-link" to="/notes">Notes</Link>
            <Link className="header-link" to="/setup">Practice</Link>
            <Link className="header-link" to="/history">History</Link>
            <Link className="header-link" to="/progress">Progress</Link>
            <Link className="header-link" to="/settings">Settings</Link>
            {user?.role === 'admin' || user?.isAdmin === true ? (
              <Link className="header-link" to="/admin">Admin</Link>
            ) : null}
            <Button className="logout-button" variant="text" onClick={logout}>
              Log out
            </Button>
          </>
        ) : status === 'unauthenticated' ? (
          <>
            <Link className="header-link" to="/login">Sign in</Link>
            <Link className="header-link" to="/register">Create account</Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
