import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { useInterview } from '../context/InterviewContext.jsx';
import { useNotes } from '../context/NotesContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';

const interviewStyles = [
  { value: 'friendly_coach', label: 'Friendly Coach' },
  { value: 'standard', label: 'Standard' },
  { value: 'strict', label: 'Strict' },
  { value: 'rapidfire', label: 'Rapidfire' },
];

function getTopics(note) {
  const topics = note?.topics ?? note?.topicList ?? note?.topic_titles ?? [];
  return Array.isArray(topics)
    ? topics.map((topic, index) => (
      typeof topic === 'string'
        ? { id: '', title: topic, key: `${index}-${topic}` }
        : {
          id: topic?.id ?? topic?._id ?? '',
          title: topic?.title ?? topic?.name ?? `Topic ${index + 1}`,
          key: String(topic?.id ?? topic?._id ?? `${index}-${topic?.title ?? topic?.name}`),
        }
    ))
    : [];
}

export default function SetupPage() {
  const { notes, loading: notesLoading, error: notesError, refreshNotes } = useNotes();
  const { startInterview, loading: starting, clearInterview } = useInterview();
  const { preferences } = usePreferences();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [noteSetId, setNoteSetId] = useState(searchParams.get('noteId') || '');
  const [topicId, setTopicId] = useState(searchParams.get('topicId') || '');
  const [style, setStyle] = useState(preferences.interviewStyle);
  const [questionCount, setQuestionCount] = useState(String(preferences.questionCount));
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (notes.length > 0 && !notes.some((note) => String(note.id) === noteSetId)) {
      setNoteSetId(String(notes[0].id));
    }
  }, [noteSetId, notes]);

  const selectedNote = notes.find((note) => String(note.id) === noteSetId);
  const topics = useMemo(() => getTopics(selectedNote), [selectedNote]);
  const selectedTopic = topics.find((topic) => String(topic.id || topic.title) === topicId);

  async function submit(event) {
    event.preventDefault();
    setFormError(null);
    if (!selectedNote || selectedNote.id === undefined || selectedNote.id === null) {
      setFormError(new Error('Choose a note set before starting an interview.'));
      return;
    }

    try {
      clearInterview();
      const id = await startInterview({
        noteSetId: selectedNote.id,
        topicId: selectedTopic?.id || null,
        topicTitle: selectedTopic?.title ?? 'All topics',
        style,
        questionCount: Number(questionCount),
      });
      navigate(`/interview/${encodeURIComponent(id)}`);
    } catch (requestError) {
      setFormError(requestError);
    }
  }

  if (notesLoading && notes.length === 0) {
    return <PageFrame><Loader label="Loading your practice notes..." /></PageFrame>;
  }

  return (
    <PageFrame>
      <section className="setup-panel" aria-labelledby="setup-title">
        <p className="eyebrow">Interview setup</p>
        <h1 id="setup-title">Choose what to practice</h1>
        <p className="welcome-copy">
          Set the pace and focus. TalkReady will guide you through each answer.
        </p>

        {notesError && notes.length > 0 && <ErrorBanner error={notesError} onRetry={refreshNotes} />}
        {formError && (
          <ErrorBanner
            error={formError}
            onRetry={formError.code === 'BACKEND_UNREACHABLE'
              ? () => formRef.current?.requestSubmit()
              : undefined}
          />
        )}
        {notes.length === 0 ? (
          notesError ? (
            <section className="setup-notes-error">
              <ErrorBanner error={notesError} onRetry={refreshNotes} />
            </section>
          ) : (
            <EmptyState
              title="Import notes before you practice"
              description="Choose a study guide or paste your notes to build an interview session."
              actionLabel="Import notes"
              actionTo="/notes/new"
            />
          )
        ) : (
          <form ref={formRef} className="setup-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="note-set">Notes</label>
              <select
                id="note-set"
                value={noteSetId}
                onChange={(event) => {
                  setNoteSetId(event.target.value);
                  setTopicId('');
                  setFormError(null);
                }}
                required
              >
                {notes.map((note) => (
                  <option key={note.id} value={String(note.id)}>{note.title || 'Untitled note set'}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="topic">Topic</label>
              <select
                id="topic"
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
              >
                <option value="">All topics</option>
                {topics.map((topic) => (
                  <option key={topic.key} value={String(topic.id || topic.title)}>
                    {topic.title}
                  </option>
                ))}
              </select>
              {topics.length === 0 && (
                <span className="field-hint">This note set has no topic list; the interview will use all topics.</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="interview-style">Interview style</label>
              <select
                id="interview-style"
                value={style}
                onChange={(event) => setStyle(event.target.value)}
              >
                {interviewStyles.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <fieldset className="question-count-field">
              <legend>Number of questions</legend>
              <div className="question-count-options">
                {['5', '10', '15'].map((count) => (
                  <label key={count} className={questionCount === count ? 'count-option selected' : 'count-option'}>
                    <input
                      type="radio"
                      name="question-count"
                      value={count}
                      checked={questionCount === count}
                      onChange={(event) => setQuestionCount(event.target.value)}
                    />
                    <span>{count}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Button className="setup-submit" type="submit" disabled={starting || notes.length === 0}>
              {starting ? 'Starting interview...' : 'Start interview'}
            </Button>
          </form>
        )}
      </section>
    </PageFrame>
  );
}
