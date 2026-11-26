import { Navigate, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import NotesImportPage from './pages/NotesImportPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import InterviewPage from './pages/InterviewPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import ProgressPage from './pages/ProgressPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/"
        element={<ProtectedRoute><HomePage /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<AdminRoute><AdminPage /></AdminRoute>}
      />
      <Route
        path="/notes"
        element={<ProtectedRoute><NotesPage /></ProtectedRoute>}
      />
      <Route
        path="/notes/new"
        element={<ProtectedRoute><NotesImportPage /></ProtectedRoute>}
      />
      <Route
        path="/setup"
        element={<ProtectedRoute><SetupPage /></ProtectedRoute>}
      />
      <Route
        path="/interview/:id"
        element={<ProtectedRoute><InterviewPage /></ProtectedRoute>}
      />
      <Route
        path="/report/:sessionId"
        element={<ProtectedRoute><ReportPage /></ProtectedRoute>}
      />
      <Route
        path="/history"
        element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
      />
      <Route
        path="/progress"
        element={<ProtectedRoute><ProgressPage /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
