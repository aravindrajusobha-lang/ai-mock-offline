import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Loader from '../components/common/Loader.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import CoachingCard from '../components/report/CoachingCard.jsx';
import MissedPoints from '../components/report/MissedPoints.jsx';
import ScoreCard from '../components/report/ScoreCard.jsx';
import { useInterview } from '../context/InterviewContext.jsx';
import useReport from '../hooks/useReport.js';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function getCoaching(report) {
  return report.coaching ?? report.coachingCards ?? report.coaching_cards ?? report;
}

function getRetryTarget(report) {
  const answers = report.answers ?? report.responses ?? report.questions ?? [];
  const answer = Array.isArray(answers)
    ? answers.find((item) => item?.questionId ?? item?.question_id ?? item?.question?.id ?? item?.question?._id)
    : null;
  const question = report.retryQuestion
    ?? report.retry_question
    ?? report.question
    ?? answer?.question
    ?? answer;

  return {
    noteSetId: firstDefined(
      report.noteSetId,
      report.note_set_id,
      report.session?.noteSetId,
      report.session?.note_set_id,
      question?.noteSetId,
      question?.note_set_id,
    ),
    topicId: firstDefined(
      report.topicId,
      report.topic_id,
      report.session?.topicId,
      report.session?.topic_id,
      question?.topicId,
      question?.topic_id,
    ),
    questionId: firstDefined(
      question?.questionId,
      question?.question_id,
      question?.id,
      question?._id,
    ),
    topicTitle: firstDefined(report.topicTitle, report.topic_title, question?.topicTitle, question?.topic_title),
    style: firstDefined(report.style, report.interviewStyle, report.interview_style, 'standard'),
  };
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { report, loading, error, refresh } = useReport(sessionId);
  const { startInterview } = useInterview();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const coaching = report ? getCoaching(report) : {};
  const retryTarget = report ? getRetryTarget(report) : null;

  async function retryQuestion() {
    if (!report || retrying) {
      return;
    }
    setRetrying(true);
    setRetryError(null);
    try {
      if (retryTarget?.noteSetId && retryTarget?.questionId) {
        const id = await startInterview({
          noteSetId: retryTarget.noteSetId,
          topicId: retryTarget.topicId ?? null,
          topicTitle: retryTarget.topicTitle ?? 'All topics',
          questionId: retryTarget.questionId,
          style: retryTarget.style,
          questionCount: 1,
        });
        navigate(`/interview/${encodeURIComponent(id)}`);
      } else {
        const params = new URLSearchParams();
        if (retryTarget?.noteSetId) {
          params.set('noteId', retryTarget.noteSetId);
        }
        if (retryTarget?.topicId) {
          params.set('topicId', retryTarget.topicId);
        }
        const query = params.toString();
        navigate(query ? `/setup?${query}` : '/setup');
      }
    } catch (requestError) {
      setRetryError(requestError);
    } finally {
      setRetrying(false);
    }
  }

  if (loading && !report) {
    return <PageFrame><Loader label="Loading your session report..." /></PageFrame>;
  }

  if (error && !report) {
    return (
      <PageFrame>
        <section className="report-error">
          <ErrorBanner error={error} onRetry={refresh} />
          <Link className="button button-text" to="/history">Back to history</Link>
        </section>
      </PageFrame>
    );
  }

  if (!report) {
    return <PageFrame><Loader label="Preparing your session report..." /></PageFrame>;
  }

  return (
    <PageFrame>
      <section className="report-page" aria-labelledby="report-title">
        <div className="report-heading">
          <div>
            <p className="eyebrow">Interview complete</p>
            <h1 id="report-title">{report.topicTitle ?? report.topic_title ?? 'Session report'}</h1>
          </div>
          <Link className="back-link" to="/history">Practice history</Link>
        </div>

        {error && <ErrorBanner error={error} onRetry={refresh} />}
        {retryError && (
          <ErrorBanner
            error={retryError}
            onRetry={retryQuestion}
          />
        )}

        <ScoreCard report={report} />
        <div className="coaching-grid">
          <CoachingCard
            title="What went well"
            tone="success"
            content={firstDefined(coaching.whatWentWell, coaching.what_went_well, coaching.wentWell, coaching.went_well)}
          />
          <CoachingCard
            title="What to improve"
            tone="warning"
            content={firstDefined(coaching.whatToImprove, coaching.what_to_improve, coaching.improvements)}
          />
          <MissedPoints points={firstDefined(coaching.missedPoints, coaching.missed_points, report.missedPoints, report.missed_points)} />
          <CoachingCard
            title="Structure tip"
            tone="primary"
            content={firstDefined(coaching.structureTip, coaching.structure_tip)}
          />
          <CoachingCard
            title="Say it better"
            tone="accent"
            content={firstDefined(coaching.sayItBetter, coaching.say_it_better)}
          />
        </div>

        <div className="report-actions">
          <Button onClick={retryQuestion} disabled={retrying}>
            {retrying ? 'Starting retry...' : 'Retry the question'}
          </Button>
          <Link
            className="button button-secondary"
            to={`/setup${retryTarget?.noteSetId ? `?noteId=${encodeURIComponent(retryTarget.noteSetId)}` : ''}`}
          >
            Start a new session
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
