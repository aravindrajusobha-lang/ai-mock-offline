import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin' && user?.isAdmin !== true) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminOnly>{children}</AdminOnly>
    </ProtectedRoute>
  );
}
