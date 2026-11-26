import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  finishInterview as finishInterviewRequest,
  getInterview,
  requestHint as requestHintApi,
  skipQuestion as skipQuestionApi,
  startInterview as startInterviewRequest,
  submitAnswer as submitAnswerRequest,
} from '../api/interviews.js';
import { ApiError } from '../api/client.js';

const InterviewContext = createContext(null);

function unwrapResponse(response) {
  return response?.data ?? response;
}

function getSessionId(response) {
  const data = unwrapResponse(response);
  const id = data?.sessionId
    ?? data?.session_id
    ?? data?.session?.id
    ?? data?.interview?.id
    ?? data?.id;
  if (id === undefined || id === null || id === '') {
    throw new ApiError('The TalkReady server did not return an interview identifier.', {
      code: 'INVALID_INTERVIEW_RESPONSE',
      details: response,
    });
  }
  return String(id);
}

export function getCurrentQuestion(response) {
  return response?.currentQuestion
    ?? response?.current_question
    ?? response?.nextQuestion
    ?? response?.next_question
    ?? response?.followUpQuestion
    ?? response?.follow_up_question
    ?? response?.followUp?.question
    ?? response?.follow_up?.question
    ?? response?.question
    ?? response?.session?.question
    ?? response?.interview?.question
    ?? (response?.question_text
      ? { text: response.question_text, type: response.question_type }
      : null)
    ?? null;
}

function questionKey(question) {
  return typeof question === 'string'
    ? question
    : question?.id ?? question?._id ?? question?.text ?? question?.question_text ?? null;
}

function mergeLatest(previous, response) {
  const incoming = unwrapResponse(response);
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new ApiError('The TalkReady server returned an invalid interview response.', {
      code: 'INVALID_INTERVIEW_RESPONSE',
      details: response,
    });
  }

  const previousQuestion = getCurrentQuestion(previous);
  const incomingQuestion = incoming.currentQuestion
    ?? incoming.current_question
    ?? incoming.nextQuestion
    ?? incoming.next_question
    ?? incoming.followUpQuestion
    ?? incoming.follow_up_question
    ?? incoming.followUp?.question
    ?? incoming.follow_up?.question
    ?? incoming.question
    ?? incoming.session?.question
    ?? incoming.interview?.question
    ?? (incoming.question_text
      ? { text: incoming.question_text, type: incoming.question_type }
      : null);
  const changedQuestion = incomingQuestion
    && questionKey(incomingQuestion) !== questionKey(previousQuestion);
  const latest = { ...previous, ...incoming };

  if (incomingQuestion) {
    latest.currentQuestion = incomingQuestion;
  } else if (previousQuestion) {
    latest.currentQuestion = previousQuestion;
  }
  if (changedQuestion) {
    latest.reaction = incoming.reaction ?? incoming.feedback ?? null;
    latest.hintLevel = incoming.hintLevel ?? incoming.hint_level ?? 0;
  }
  return latest;
}

export function isInterviewFinished(response) {
  const status = response?.status ?? response?.session?.status;
  return response?.finished === true
    || response?.isFinished === true
    || status === 'finished'
    || status === 'completed';
}

export function InterviewProvider({ children }) {
  const [activeInterview, setActiveInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startInterview = useCallback(async (options) => {
    setLoading(true);
    setError(null);
    try {
      const response = await startInterviewRequest(options);
      const id = getSessionId(response);
      let data = unwrapResponse(response);
      if (!getCurrentQuestion(data) && !isInterviewFinished(data)) {
        data = unwrapResponse(await getInterview(id));
      }
      if (!getCurrentQuestion(data) && !isInterviewFinished(data)) {
        throw new ApiError('The TalkReady server did not return the first interview question.', {
          code: 'INVALID_INTERVIEW_RESPONSE',
          details: data,
        });
      }
      setActiveInterview({ id, data });
      return id;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInterview = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInterview(id);
      const data = unwrapResponse(response);
      if (!getCurrentQuestion(data) && !isInterviewFinished(data)) {
        throw new ApiError('The TalkReady server did not return the current question.', {
          code: 'INVALID_INTERVIEW_RESPONSE',
          details: response,
        });
      }
      setActiveInterview({ id: String(id), data });
      return data;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const performAction = useCallback(async (action) => {
    if (!activeInterview) {
      throw new ApiError('There is no active interview session.', {
        code: 'NO_ACTIVE_INTERVIEW',
      });
    }
    setLoading(true);
    setError(null);
    try {
      const response = await action(activeInterview.id);
      const latest = mergeLatest(activeInterview.data, response);
      setActiveInterview({ id: activeInterview.id, data: latest });
      return latest;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [activeInterview]);

  const submitAnswer = useCallback(
    (answer) => performAction((id) => submitAnswerRequest(id, answer)),
    [performAction],
  );
  const requestHint = useCallback(
    (level) => performAction((id) => requestHintApi(id, level)),
    [performAction],
  );
  const skipQuestion = useCallback(
    () => performAction(skipQuestionApi),
    [performAction],
  );
  const finishInterview = useCallback(
    () => performAction(finishInterviewRequest),
    [performAction],
  );

  const clearInterview = useCallback(() => {
    setActiveInterview(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      activeInterview,
      loading,
      error,
      startInterview,
      loadInterview,
      submitAnswer,
      requestHint,
      skipQuestion,
      finishInterview,
      clearInterview,
    }),
    [
      activeInterview,
      loading,
      error,
      startInterview,
      loadInterview,
      submitAnswer,
      requestHint,
      skipQuestion,
      finishInterview,
      clearInterview,
    ],
  );

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider.');
  }
  return context;
}
