import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { deleteNote } from '../api/notes.js';
import { useNotes } from '../context/NotesContext.jsx';

function isBuiltIn(note) {
  return note?.source_type === 'builtin'
    || note?.sourceType === 'builtin'
    || Boolean(note?.builtin_key ?? note?.builtinKey)
    || note?.isBuiltin === true;
}

export default function NotesPage() {
  const { notes, loading, error, refreshNotes } = useNotes();
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');

  async function retryLoad() {
    setActionError(null);
    await refreshNotes();
  }

  async function removeNote(note) {
    const id = note.id;
    if (id === undefined || id === null) {
      setActionError(new Error('This note set has no identifier and cannot be deleted.'));
      return;
    }
    if (!window.confirm(`Delete "${note.title || 'this note set'}"?`)) {
      return;
    }

    setDeletingId(id);
    setActionError(null);
    try {
      await deleteNote(id);
      await refreshNotes();
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setDeletingId(null);
    }
  }

  function openNote(note) {
    if (note.id === undefined || note.id === null) {
      setActionError(new Error('This note set has no identifier and cannot be opened.'));
      return;
    }
    navigate(`/setup?noteId=${encodeURIComponent(note.id)}`);
  }

  const visibleNotes = notes.filter((note) => (
    source === 'builtin'
      ? isBuiltIn(note)
      : source === 'personal'
        ? !isBuiltIn(note)
        : true
  ));
  const title = source === 'builtin'
    ? 'Prebuilt notes'
    : source === 'personal'
      ? 'My notes'
      : 'Notes';

  return (
    <PageFrame>
      <section className="notes-page" aria-labelledby="notes-title">
        <div className="page-heading-row">
          <div>
            <p className="eyebrow">Your library</p>
            <h1 id="notes-title">{title}</h1>
            <p className="welcome-copy">Choose notes to shape your next practice session.</p>
          </div>
          <Link className="button button-primary" to="/notes/new">Import notes</Link>
        </div>

        {actionError && <ErrorBanner error={actionError} onRetry={retryLoad} />}
        {error && <ErrorBanner error={error} onRetry={refreshNotes} />}
        {loading ? (
          <Loader label="Loading your notes..." />
        ) : visibleNotes.length === 0 && !error ? (
          <EmptyState
            title={source === 'builtin' ? 'No prebuilt notes are available yet' : 'Your library is ready for its first notes'}
            description={source === 'builtin'
              ? 'You can still import study notes or check back after adding built-in sets.'
              : 'Import a study guide or paste your notes to start practicing.'}
            actionLabel="Import notes"
            actionTo="/notes/new"
          />
        ) : (
          <div className="notes-grid">
            {visibleNotes.map((note) => {
              const builtIn = isBuiltIn(note);
              const id = note.id;
              return (
                <article className="note-card" key={id ?? note.title}>
                  <div className="note-card-heading">
                    <span className={`note-tag ${builtIn ? 'note-tag-built-in' : 'note-tag-personal'}`}>
                      {builtIn ? 'Prebuilt' : 'My notes'}
                    </span>
                    <h2>{note.title || 'Untitled note set'}</h2>
                  </div>
                  <p className="note-meta">
                    {Number.isInteger(note.char_count ?? note.charCount)
                      ? `${note.char_count ?? note.charCount} characters`
                      : 'Ready to practice'}
                  </p>
                  <div className="note-actions">
                    <Button onClick={() => openNote(note)}>Open</Button>
                    {!builtIn && (
                      <Button
                        variant="danger"
                        disabled={deletingId === id}
                        onClick={() => removeNote(note)}
                      >
                        {deletingId === id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
