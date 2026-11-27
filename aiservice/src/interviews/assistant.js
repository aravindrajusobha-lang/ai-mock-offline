import { generateQuestions } from '../questions/generator.js';

export function selectNextQuestion({ questions = [], answered = [], recentQuestionIds = [], targetCount = 5 } = {}) {
  if (!Array.isArray(questions) || !Array.isArray(answered)) throw new TypeError('questions and answered must be arrays.');
  if (answered.length >= targetCount) return { done: true, question: null, difficulty: null };
  const used = new Set([...answered.map(item => item.questionId), ...recentQuestionIds]);
  const pending = questions.filter(question => !used.has(question.id));
  if (!pending.length) return { done: true, question: null, difficulty: null, reason: 'No unused questions remain.' };
  const latestScore = answered.at(-1)?.evaluation?.contentScore;
  let targetDifficulty = 2;
  if (typeof latestScore === 'number') targetDifficulty = latestScore >= 80 ? 3 : latestScore < 50 ? 1 : 2;
  const question = pending.find(item => item.difficulty === targetDifficulty) ?? pending[0];
  return { done: false, question, difficulty: question.difficulty, completedCount: answered.length, targetCount };
}

export function createFollowUp({ question, evaluation }) {
  if (!question || !evaluation) throw new TypeError('Question and evaluation are required.');
  if (evaluation.missedPoints?.length) return { type: 'clarify', question: `You mentioned ${evaluation.matchedPoints?.[0] ?? 'part of the idea'}. Can you also explain ${evaluation.missedPoints[0]}?`, topic: question.topic };
  return { type: 'example', question: `Can you give a specific example of ${question.topic ?? 'that idea'} from a project or class?`, topic: question.topic };
}

export function generateRoleQuestions(options) { return generateQuestions(options); }
