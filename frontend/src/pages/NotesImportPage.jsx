import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { createNote, extractImportPreview, uploadNote } from '../api/notes.js';
import { useNotes } from '../context/NotesContext.jsx';

const ACCEPTED_EXTENSIONS = /\.(txt|md)$/i;

function getValidationError(mode, text, file) {
  if (mode === 'paste') {
    return text.trim() ? null : 'Paste some notes before importing.';
  }
  if (!file) {
    return 'Choose a .txt or .md file to import.';
  }
  if (!ACCEPTED_EXTENSIONS.test(file.name)) {
    return 'Choose a .txt or .md file. Other formats are not supported.';
  }
  if (file.size === 0) {
    return 'This file is empty. Choose a file that contains your notes.';
  }
  return null;
}

export default function NotesImportPage() {
  const { refreshNotes } = useNotes();
  const formRef = useRef(null);
  const [mode, setMode] = useState('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  function chooseFile(event) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFileError('');
    setFormError(null);
    setPreview(null);
    if (selected && !ACCEPTED_EXTENSIONS.test(selected.name)) {
      setFileError('Choose a .txt or .md file. Other formats are not supported.');
    } else if (selected?.size === 0) {
      setFileError('This file is empty. Choose a file that contains your notes.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    setFormError(null);
    setPreview(null);
    setRefreshError(null);

    const validationError = mode === 'file'
      ? fileError || getValidationError(mode, text, file)
      : getValidationError(mode, text, file);
    if (validationError) {
      setFormError(new Error(validationError));
      return;
    }

    async function retryRefresh() {
      setRefreshError(null);
      if (!await refreshNotes()) {
        setRefreshError(new Error('Your notes were imported, but the library could not be refreshed.'));
      }
    }

    setSubmitting(true);
    try {
      const response = mode === 'paste'
        ? await createNote(text)
        : await uploadNote(file);
      setPreview(extractImportPreview(response));
      const refreshed = await refreshNotes();
      if (!refreshed) {
        setRefreshError(new Error('Your notes were imported, but the library could not be refreshed.'));
      }
    } catch (requestError) {
      setFormError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <section className="import-panel" aria-labelledby="import-title">
        <Link className="back-link" to="/notes">Back to notes</Link>
        <p className="eyebrow">Add to your library</p>
        <h1 id="import-title">Import notes</h1>
        <p className="welcome-copy">
          Paste a study guide or choose a plain text or Markdown file.
        </p>

        {preview && (
          <section className="import-preview" aria-live="polite">
            <span className="preview-check" aria-hidden="true" />
            <div>
              <h2>Import complete</h2>
              {preview.topicCount !== null && preview.questionCount !== null ? (
                <p>
                  <strong>{preview.title}</strong>: we found{' '}
                  <strong>{preview.topicCount} topics</strong> and{' '}
                  <strong>{preview.questionCount} possible questions</strong>.
                </p>
              ) : (
                <p>
                  <strong>{preview.title}</strong> was saved. The server did not
                  include a topic and question preview.
                </p>
              )}
            </div>
          </section>
        )}
        {refreshError && <ErrorBanner error={refreshError} onRetry={retryRefresh} />}
        {formError && (
          <ErrorBanner
            error={formError}
            onRetry={formError.code === 'BACKEND_UNREACHABLE'
              ? () => formRef.current?.requestSubmit()
              : undefined}
          />
        )}

        <form ref={formRef} className="import-form" onSubmit={submit} noValidate>
          <fieldset className="source-picker">
            <legend>Choose an import method</legend>
            <label>
              <input
                type="radio"
                name="import-mode"
                value="paste"
                checked={mode === 'paste'}
                onChange={() => {
                  setMode('paste');
                  setFormError(null);
                  setPreview(null);
                }}
              />
              Paste text
            </label>
            <label>
              <input
                type="radio"
                name="import-mode"
                value="file"
                checked={mode === 'file'}
                onChange={() => {
                  setMode('file');
                  setFormError(null);
                  setPreview(null);
                }}
              />
              Choose a file
            </label>
          </fieldset>

          {mode === 'paste' ? (
            <div className="field">
              <label htmlFor="notes-text">Paste your notes</label>
              <textarea
                id="notes-text"
                rows="12"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setFormError(null);
                  setPreview(null);
                }}
                placeholder="Paste your study guide or class notes here..."
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="notes-file">Choose a .txt or .md file</label>
              <input
                id="notes-file"
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={chooseFile}
              />
              {file && !fileError && (
                <span className="file-selected">{file.name}</span>
              )}
              {fileError && <span className="field-error" role="alert">{fileError}</span>}
            </div>
          )}

          <Button className="import-submit" type="submit" disabled={submitting}>
            {submitting ? 'Importing...' : 'Import notes'}
          </Button>
        </form>
      </section>
    </PageFrame>
  );
}
