import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnswerBox from '../components/interview/AnswerBox.jsx';
import HintButton from '../components/interview/HintButton.jsx';
import Nudge from '../components/interview/Nudge.jsx';
import ProgressBar from '../components/interview/ProgressBar.jsx';
import QuestionCard from '../components/interview/QuestionCard.jsx';
import ReactionLine from '../components/interview/ReactionLine.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { getCurrentQuestion, isInterviewFinished, useInterview } from '../context/InterviewContext.jsx';

const HINT_LEVELS = ['nudge', 'clue', 'answer'];

function getGrantedHintLevel(data, localLevel) {
  const raw = data?.hintLevel
    ?? data?.hint_level
    ?? data?.hintsUsed
    ?? data?.hints_used
    ?? localLevel;
  if (typeof raw === 'string') {
    return raw.toLowerCase();
  }
  if (Number.isInteger(raw)) {
    return HINT_LEVELS[raw - 1] ?? (raw >= HINT_LEVELS.length ? 'answer' : null);
  }
  return null;
}

function getNextHintLevel(data, localLevel) {
  const granted = getGrantedHintLevel(data, localLevel);
  if (!granted) {
    return HINT_LEVELS[0];
  }
  const index = HINT_LEVELS.indexOf(granted);
  return index < 0 || index === HINT_LEVELS.length - 1
    ? 'done'
    : HINT_LEVELS[index + 1];
}

function getProgress(data) {
  const questionNumber = data?.questionNumber
    ?? data?.question_number
    ?? data?.currentQuestionNumber
    ?? data?.current_question_number
    ?? data?.currentPosition
    ?? data?.current_position
    ?? data?.progress?.current;
  const total = data?.questionCount
    ?? data?.question_count
    ?? data?.totalQuestions
    ?? data?.total_questions
    ?? data?.session?.questionCount
    ?? data?.session?.question_count
    ?? data?.progress?.total;
  const toNumber = (value) => (
    value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
      ? Number(value)
      : null
  );
  return {
    current: toNumber(questionNumber),
    total: toNumber(total),
  };
}

function getHintText(data) {
  const hint = data?.hint;
  return typeof hint === 'string'
    ? hint
    : hint?.text ?? hint?.message ?? data?.hintText ?? data?.hint_text ?? null;
}

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeInterview,
    loading,
    error,
    loadInterview,
    submitAnswer,
    requestHint,
    skipQuestion,
    finishInterview,
  } = useInterview();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [localHintLevel, setLocalHintLevel] = useState(null);
  const [showNudge, setShowNudge] = useState(false);
  const [restoreFocus, setRestoreFocus] = useState(false);
  const answerRef = useRef(null);
  const previousQuestionRef = useRef(null);

  const data = activeInterview?.id === id ? activeInterview.data : null;
  const question = getCurrentQuestion(data);
  const currentQuestionKey = question?.id ?? question?._id ?? question?.text ?? null;
  const progress = useMemo(() => getProgress(data), [data]);
  const nextHintLevel = getNextHintLevel(data, localHintLevel);
  const interactionBusy = busy || loading;
  const sessionId = activeInterview?.id === id ? activeInterview.id : id;

  const goToReport = useCallback((response = data) => {
    const reportId = response?.sessionId
      ?? response?.session?.id
      ?? response?.id
      ?? sessionId;
    navigate(`/report/${encodeURIComponent(reportId)}`, { replace: true });
  }, [data, navigate, sessionId]);

  useEffect(() => {
    if (!data) {
      void loadInterview(id).catch(() => {});
    }
  }, [data, id, loadInterview]);

  useEffect(() => {
    if (data && isInterviewFinished(data)) {
      goToReport(data);
    }
  }, [data, goToReport]);

  useEffect(() => {
    if (!currentQuestionKey) {
      return;
    }
    if (
      previousQuestionRef.current !== null
      && previousQuestionRef.current !== currentQuestionKey
    ) {
      setAnswer('');
      setLocalHintLevel(null);
      answerRef.current?.focus();
    }
    previousQuestionRef.current = currentQuestionKey;
  }, [currentQuestionKey]);

  useEffect(() => {
    if (!interactionBusy && restoreFocus) {
      answerRef.current?.focus();
      setRestoreFocus(false);
    }
  }, [interactionBusy, restoreFocus]);

  const retryLoad = useCallback(() => loadInterview(id).catch(() => {}), [id, loadInterview]);

  useEffect(() => {
    setShowNudge(false);
    if (!question || answer.trim()) {
      return undefined;
    }
    const timer = window.setTimeout(() => setShowNudge(true), 15000);
    return () => window.clearTimeout(timer);
  }, [answer, question]);

  const handleAnswerSubmit = useCallback(async (event) => {
    event.preventDefault();
    if (interactionBusy || !answer.trim()) {
      return;
    }
    setBusy(true);
    try {
      const response = await submitAnswer(answer.trim());
      if (isInterviewFinished(response)) {
        goToReport(response);
      } else {
        setRestoreFocus(true);
      }
    } catch {
      setRestoreFocus(true);
    } finally {
      setBusy(false);
    }
  }, [answer, goToReport, interactionBusy, submitAnswer]);

  const handleHint = useCallback(async () => {
    if (interactionBusy || nextHintLevel === 'done') {
      return;
    }
    setBusy(true);
    try {
      const response = await requestHint(nextHintLevel);
      setLocalHintLevel(response?.hintLevel ?? response?.hint_level ?? nextHintLevel);
      setRestoreFocus(true);
    } catch {
      setRestoreFocus(true);
    } finally {
      setBusy(false);
    }
  }, [interactionBusy, nextHintLevel, requestHint]);

  const handleSkip = useCallback(async () => {
    if (interactionBusy) {
      return;
    }
    setBusy(true);
    try {
      const response = await skipQuestion();
      if (isInterviewFinished(response)) {
        goToReport(response);
      } else {
        setRestoreFocus(true);
      }
    } catch {
      setRestoreFocus(true);
    } finally {
      setBusy(false);
    }
  }, [goToReport, interactionBusy, skipQuestion]);

  const handleFinish = useCallback(async () => {
    if (interactionBusy) {
      return;
    }
    setBusy(true);
    try {
      const response = await finishInterview();
      goToReport(response);
    } catch {
      setRestoreFocus(true);
    } finally {
      setBusy(false);
    }
  }, [finishInterview, goToReport, interactionBusy]);

  if (!data && loading) {
    return <PageFrame><Loader label="Opening your interview..." /></PageFrame>;
  }

  if (!data && error) {
    return (
      <PageFrame>
        <section className="interview-error">
          <ErrorBanner error={error} onRetry={retryLoad} />
          <button className="button button-text" type="button" onClick={() => navigate('/setup')}>
            Return to setup
          </button>
        </section>
      </PageFrame>
    );
  }

  if (!data || !question) {
    return <PageFrame><Loader label="Preparing your next question..." /></PageFrame>;
  }

  const reaction = data.reaction ?? data.feedback?.reaction ?? data.feedback ?? null;
  const hintText = getHintText(data);

  return (
    <PageFrame>
      <section className="interview-page" aria-labelledby="interview-heading">
        <div className="interview-heading">
          <div>
            <p className="eyebrow">Practice session</p>
            <h1 id="interview-heading">You've got this</h1>
          </div>
          <ProgressBar current={progress.current} total={progress.total} />
        </div>

        {error && <ErrorBanner error={error} onRetry={retryLoad} />}
        <QuestionCard question={question} />
        {hintText && (
          <div className="hint-response" role="status" aria-live="polite">
            <span className="hint-response-label">Hint</span>
            <p>{hintText}</p>
          </div>
        )}
        <ReactionLine reaction={reaction} />
        {showNudge && nextHintLevel !== 'done' && <Nudge onHint={handleHint} />}
        <AnswerBox
          answer={answer}
          disabled={interactionBusy}
          inputRef={answerRef}
          onAnswerChange={setAnswer}
          onSubmit={handleAnswerSubmit}
          submitting={interactionBusy}
        />
        <div className="interview-actions">
          <HintButton
            disabled={interactionBusy}
            level={nextHintLevel}
            onClick={handleHint}
          />
          <div className="interview-secondary-actions">
            <button
              className="button button-text"
              type="button"
              disabled={interactionBusy}
              onClick={handleSkip}
            >
              Skip question
            </button>
            <button
              className="button button-danger"
              type="button"
              disabled={interactionBusy}
              onClick={handleFinish}
            >
              Finish interview
            </button>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
