import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNotes, extractResumeProfile } from '../src/notes/parser.js';
import { generateQuestions } from '../src/questions/generator.js';
import { evaluateAnswer } from '../src/answers/evaluator.js';
import { generateFeedback } from '../src/feedback/generator.js';
import { buildPerformanceReport } from '../src/performance/report.js';
import { selectNextQuestion, createFollowUp } from '../src/interviews/assistant.js';
import { prepareFromResume } from '../src/resume/preparation.js';
import { getModelStatus, generateWithLocalModel } from '../src/models/manager.js';

test('notes preserve headings and stable source chunk IDs', () => {
  const input = '# SQL\n\nSQL is a language for querying relational databases. It retrieves data from tables.';
  const a = parseNotes(input, { format: 'md' });
  const b = parseNotes(input, { format: 'md' });
  assert.equal(a.topics[0], 'SQL');
  assert.deepEqual(a.chunks, b.chunks);
  assert.match(a.chunks[0].id, /^chunk_/);
});

test('notes reject blank and oversized input', () => {
  assert.throws(() => parseNotes('  '), /cannot be blank/i);
  assert.throws(() => parseNotes('x'.repeat(10), { maxChars: 5 }), /character limit/i);
});

test('question generation is grounded, stable, avoids duplicates, and returns fewer for short notes', () => {
  const chunk = parseNotes('SQL is a language for querying relational databases.').chunks[0];
  const result = generateQuestions({ chunks: [chunk], count: 5 });
  assert.ok(result.questions.length < 5);
  assert.ok(result.explanation);
  assert.ok(result.questions.every(q => q.sourceChunkId === chunk.id && q.expectedAnswerPoints.length));
  assert.equal(new Set(result.questions.map(q => q.question)).size, result.questions.length);
  assert.deepEqual(generateQuestions({ chunks: [chunk], count: 5 }).questions, result.questions);
});

test('answer evaluation is repeatable and rewards note-grounded, complete answers', () => {
  const chunk = parseNotes('SQL is a language for querying relational databases. It retrieves data from tables.').chunks[0];
  const question = generateQuestions({ chunks: [chunk], count: 5 }).questions[0];
  const good = evaluateAnswer({ question, answer: 'SQL is a language for querying relational databases. It retrieves data from tables.', sourceText: chunk.text });
  const weak = evaluateAnswer({ question, answer: 'I like cooking because it is relaxing.', sourceText: chunk.text });
  assert.ok(good.contentScore > weak.contentScore);
  assert.deepEqual(good, evaluateAnswer({ question, answer: 'SQL is a language for querying relational databases. It retrieves data from tables.', sourceText: chunk.text }));
  assert.equal(good.deliveryMetrics, null);
  assert.ok(good.rubricVersion);
});

test('evaluation validates blank answers and rejects missing expected points', () => {
  assert.throws(() => evaluateAnswer({ question: {}, answer: 'hello' }), /expectedAnswerPoints/i);
  assert.throws(() => evaluateAnswer({ question: { expectedAnswerPoints: ['important concept'] }, answer: ' ' }), /blank/i);
});

test('feedback and performance report summarize strengths and weaknesses', () => {
  const chunk = parseNotes('A cache stores frequently used data in memory. This reduces repeated database work.').chunks[0];
  const question = generateQuestions({ chunks: [chunk], count: 5 }).questions[0];
  const evaluation = evaluateAnswer({ question, answer: 'A cache stores frequently used data in memory.', sourceText: chunk.text });
  const feedback = generateFeedback(evaluation, { topic: 'Caching' });
  const report = buildPerformanceReport([{ question, evaluation }]);
  assert.equal(feedback.score, evaluation.contentScore);
  assert.equal(report.answerCount, 1);
  assert.equal(report.overallScore, evaluation.contentScore);
});

test('interview assistant chooses a difficulty adapted to latest score and a relevant follow-up', () => {
  const questions = [1, 2, 3].map(difficulty => ({ id: `q${difficulty}`, difficulty }));
  const next = selectNextQuestion({ questions, answered: [{ questionId: 'prior', evaluation: { contentScore: 90 } }] });
  assert.equal(next.question.id, 'q3');
  assert.match(createFollowUp({ question: { topic: 'SQL' }, evaluation: { matchedPoints: [], missedPoints: ['query plan'] } }).question, /query plan/);
});

test('resume analysis extracts basic profile details and generates tailored questions', () => {
  const text = 'Skills: JavaScript, React, SQL\nEducation:\nBSc Computer Science\nExperience:\nIntern developer\nProjects:\nBuilt a React dashboard.';
  const profile = extractResumeProfile(text);
  assert.ok(profile.skills.includes('React'));
  assert.match(profile.projects, /dashboard/i);
  assert.ok(prepareFromResume({ text, role: 'Frontend Developer', count: 5 }).questions.length > 0);
});

test('local model manager checks only loopback and never downloads missing models', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push(String(url));
    if (String(url).endsWith('/api/tags')) return { ok: true, json: async () => ({ models: [{ name: 'local-small' }] }) };
    return { ok: true, json: async () => ({ message: { content: 'local response' } }) };
  };
  const status = await getModelStatus({ fetchImpl });
  assert.equal(status.available, true);
  await assert.rejects(() => generateWithLocalModel({ model: 'missing', messages: [{ role: 'user', content: 'hi' }], fetchImpl }), /not installed locally/i);
  assert.equal(calls.filter(url => url.endsWith('/api/chat')).length, 0);
  const answer = await generateWithLocalModel({ model: 'local-small', messages: [{ role: 'user', content: 'hi' }], fetchImpl });
  assert.equal(answer.content, 'local response');
  assert.ok(calls.every(url => url.startsWith('http://127.0.0.1:11434/')));
  await assert.rejects(() => getModelStatus({ baseUrl: 'https://example.com', fetchImpl }), /loopback/i);
});
