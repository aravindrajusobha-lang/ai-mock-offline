import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { deleteAllData } from '../api/settings.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

const interviewStyles = [
  { value: 'friendly_coach', label: 'Friendly Coach' },
  { value: 'standard', label: 'Standard' },
  { value: 'strict', label: 'Strict' },
  { value: 'rapidfire', label: 'Rapidfire' },
];

const questionCounts = [5, 10, 15];

export default function SettingsPage() {
  const { preferences, error: preferencesError, savePreferences, resetPreferences } = usePreferences();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [style, setStyle] = useState(preferences.interviewStyle);
  const [questionCount, setQuestionCount] = useState(preferences.questionCount);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function save(event) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    try {
      savePreferences({ interviewStyle: style, questionCount: Number(questionCount) });
      setSaved(true);
    } catch (error) {
      setFormError(error);
    }
  }

  function retryPreferenceSave() {
    try {
      savePreferences({ interviewStyle: style, questionCount: Number(questionCount) });
      setFormError(null);
      setSaved(true);
    } catch (error) {
      setFormError(error);
    }
  }

  async function executeDelete() {
    if (deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    let preferenceResetError = null;
    try {
      await deleteAllData();
      try {
        resetPreferences();
      } catch (error) {
        preferenceResetError = error;
      }
      logout();
      navigate('/login', {
        replace: true,
        state: {
          notice: 'Your TalkReady data has been deleted.',
          warning: preferenceResetError
            ? 'The server data was deleted, but local preferences could not be reset.'
            : null,
        },
      });
    } catch (error) {
      setDeleteError(error);
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    if (window.confirm('Delete all TalkReady notes and practice data? This cannot be undone.')) {
      void executeDelete();
    }
  }

  return (
    <PageFrame>
      <section className="settings-page" aria-labelledby="settings-title">
        <p className="eyebrow">Make TalkReady yours</p>
        <h1 id="settings-title">Settings</h1>
        <p className="welcome-copy">Choose defaults for new practice sessions.</p>

        {preferencesError && <ErrorBanner error={preferencesError} onRetry={retryPreferenceSave} />}
        {formError && <ErrorBanner error={formError} />}
        {deleteError && <ErrorBanner error={deleteError} onRetry={executeDelete} />}
        {saved && <p className="settings-success" role="status">Preferences saved on this device.</p>}

        <form className="settings-form" onSubmit={save}>
          <div className="field">
            <label htmlFor="default-style">Default interview style</label>
            <select
              id="default-style"
              value={style}
              onChange={(event) => {
                setStyle(event.target.value);
                setSaved(false);
              }}
            >
              {interviewStyles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <fieldset className="question-count-field">
            <legend>Default number of questions</legend>
            <div className="question-count-options">
              {questionCounts.map((count) => (
                <label key={count} className={questionCount === count ? 'count-option selected' : 'count-option'}>
                  <input
                    type="radio"
                    name="default-question-count"
                    value={count}
                    checked={questionCount === count}
                    onChange={() => {
                      setQuestionCount(count);
                      setSaved(false);
                    }}
                  />
                  <span>{count}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit">Save preferences</Button>
        </form>

        <section className="delete-data-panel" aria-labelledby="delete-data-title">
          <div>
            <p className="eyebrow">Destructive action</p>
            <h2 id="delete-data-title">Delete all data</h2>
            <p>
              Remove your notes, interview sessions, and reports from TalkReady.
              This action cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            disabled={deleting}
            onClick={confirmDelete}
          >
            {deleting ? 'Deleting data...' : 'Delete all data'}
          </Button>
        </section>
      </section>
    </PageFrame>
  );
}
