import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { extractNotes, getNotes } from '../api/notes.js';
import { useAuth } from './AuthContext.jsx';

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const { status: authStatus } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshNotes = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      setNotes([]);
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      setNotes(extractNotes(await getNotes()));
      return true;
    } catch (requestError) {
      setError(requestError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void refreshNotes();
    } else {
      setNotes([]);
      setError(null);
      setLoading(false);
    }
  }, [authStatus, refreshNotes]);

  const value = useMemo(
    () => ({ notes, loading, error, refreshNotes }),
    [notes, loading, error, refreshNotes],
  );
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider.');
  }
  return context;
}
