import { contentWords, normalize, sentences, unique } from '../core/text.js';

const SYNONYMS = new Map([
  ['utilize', 'use'], ['utilizes', 'use'], ['utilizes', 'use'], ['utilized', 'use'], ['commence', 'start'],
  ['begin', 'start'], ['purchase', 'buy'], ['retrieve', 'get'], ['query', 'ask'], ['rapid', 'fast'],
]);
const canonical = word => SYNONYMS.get(word) ?? word;

function pointCoverage(point, answerTokens) {
  const tokens = unique(contentWords(point).map(canonical));
  if (!tokens.length) return 0;
  const matched = tokens.filter(token => answerTokens.has(token)).length;
  return matched / tokens.length;
}

function completenessFactor(question, answer, matchedCount, totalPoints) {
  let factor = Math.min(1, answer.trim().split(/\s+/).length / 24);
  if (totalPoints) factor = Math.max(factor, matchedCount / totalPoints);
  if (question.type === 'compare' && matchedCount < 2) factor *= 0.5;
  if (question.type === 'example' && !/\b(for example|such as|imagine|instance|e\.g\.)\b/i.test(answer)) factor *= 0.65;
  return Math.min(1, factor);
}

export function evaluateAnswer({ question, answer, sourceText = '' } = {}) {
  if (!question || typeof question !== 'object') throw new TypeError('A question object is required.');
  if (!Array.isArray(question.expectedAnswerPoints) || !question.expectedAnswerPoints.length) throw new TypeError('Question must include expectedAnswerPoints for evaluation.');
  if (typeof answer !== 'string' || !answer.trim()) throw new TypeError('Answer cannot be blank.');
  if (answer.length > 20_000) throw new RangeError('Answer exceeds the 20000 character limit.');
  const normalizedAnswer = normalize(answer);
  const tokens = new Set(normalizedAnswer.split(' ').map(canonical));
  const matchedPoints = [];
  const missedPoints = [];
  const pointScores = question.expectedAnswerPoints.map(point => {
    const coverage = pointCoverage(point, tokens);
    const record = { point, coverage: Number(coverage.toFixed(2)) };
    (coverage >= 0.35 ? matchedPoints : missedPoints).push(point);
    return record;
  });
  const coverage = pointScores.reduce((sum, item) => sum + item.coverage, 0) / pointScores.length;
  const sourceTokens = new Set(contentWords(sourceText).map(canonical));
  const answerContent = unique([...tokens].filter(token => token.length > 2));
  const relevance = answerContent.length ? answerContent.filter(token => sourceTokens.has(token)).length / answerContent.length : 0;
  const completeness = completenessFactor(question, answer, matchedPoints.length, pointScores.length);
  const clarity = Math.min(1, (sentences(answer).length > 1 ? 0.7 : 0.35) + (answer.trim().split(/\s+/).length >= 12 ? 0.3 : 0));
  const contradictions = question.expectedAnswerPoints.filter(point => {
    const pointTerms = contentWords(point).map(canonical).filter(word => tokens.has(word));
    return pointTerms.length && new RegExp(`\\b(?:not|never|cannot|can't)\\s+(?:\\w+\\s+){0,2}(?:${pointTerms.map(escapeRegex).join('|')})\\b`, 'i').test(normalizedAnswer);
  }).length;
  const technicalAccuracy = Math.max(0, coverage - contradictions / pointScores.length);
  const weights = { expected_point_coverage: 0.5, source_relevance: 0.2, completeness: 0.15, clarity: 0.1, consistency: 0.05 };
  const raw = coverage * weights.expected_point_coverage + relevance * weights.source_relevance + completeness * weights.completeness + clarity * weights.clarity + technicalAccuracy * weights.consistency;
  const score = Math.round(Math.max(0, Math.min(100, raw * 100)));
  const missedConcepts = unique(missedPoints.flatMap(contentWords)).slice(0, 8);
  const words = answer.trim().split(/\s+/).length;
  const explanation = `${matchedPoints.length} of ${question.expectedAnswerPoints.length} expected points were covered. Rubric: expected-point coverage ${Math.round(coverage * 100)}%, source relevance ${Math.round(relevance * 100)}%, completeness ${Math.round(completeness * 100)}%, clarity ${Math.round(clarity * 100)}%.`;
  const sampleAnswerOutline = unique([...matchedPoints, ...missedPoints]).slice(0, 3);
  return {
    contentScore: score,
    dimensionScores: { expectedPointCoverage: Math.round(coverage * 100), sourceRelevance: Math.round(relevance * 100), completeness: Math.round(completeness * 100), clarity: Math.round(clarity * 100), technicalConsistency: Math.round(technicalAccuracy * 100) },
    weightsUsed: weights,
    matchedPoints,
    missedPoints,
    missedConcepts,
    explanation,
    improvement: missedPoints.length ? `Add the missing idea: ${missedPoints[0]}` : words < 12 ? 'Explain one point in more detail and include a concrete example.' : 'Make the answer more specific with a clear example or practical detail.',
    sampleAnswerOutline,
    followUpSuggestion: missedPoints.length ? `Can you explain this point: ${missedPoints[0]}` : `Can you give a concrete example related to ${question.topic ?? 'this topic'}?`,
    deliveryMetrics: null,
    rubricVersion: 'coverage-relevance-completeness-v1',
  };
}

function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
