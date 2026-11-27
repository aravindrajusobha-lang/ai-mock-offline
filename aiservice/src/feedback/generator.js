export function generateFeedback(evaluation, { topic = 'this topic', role = 'your target role' } = {}) {
  if (!evaluation || typeof evaluation.contentScore !== 'number') throw new TypeError('A completed evaluation is required.');
  const strengths = evaluation.matchedPoints.slice(0, 3);
  const weaknesses = evaluation.missedPoints.slice(0, 3);
  const nextSteps = weaknesses.length
    ? weaknesses.map(point => `Review ${point}`)
    : [`Practice explaining ${topic} with a concrete example`, `Connect your answer to a responsibility in ${role}`];
  return {
    score: evaluation.contentScore,
    summary: evaluation.contentScore >= 80 ? 'Strong answer with relevant supporting detail.' : evaluation.contentScore >= 55 ? 'You have a useful foundation; add more complete, note-based detail.' : 'Revisit the key ideas and structure your answer around them.',
    strengths,
    weaknesses,
    improvement: evaluation.improvement,
    exampleAnswerOutline: evaluation.sampleAnswerOutline,
    topicsToReview: [...new Set(weaknesses.map(() => topic))],
    nextSteps,
  };
}
