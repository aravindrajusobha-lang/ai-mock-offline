export function buildPerformanceReport(answers = []) {
  if (!Array.isArray(answers)) throw new TypeError('Answers must be an array.');
  const valid = answers.filter(item => item?.evaluation && Number.isFinite(item.evaluation.contentScore));
  const average = valid.length ? Math.round(valid.reduce((sum, item) => sum + item.evaluation.contentScore, 0) / valid.length) : 0;
  const topicScores = new Map();
  const strongCounts = new Map();
  const weakCounts = new Map();
  for (const item of valid) {
    const topic = item.question?.topic ?? 'General';
    const scores = topicScores.get(topic) ?? [];
    scores.push(item.evaluation.contentScore);
    topicScores.set(topic, scores);
    for (const point of item.evaluation.matchedPoints ?? []) strongCounts.set(point, (strongCounts.get(point) ?? 0) + 1);
    for (const point of item.evaluation.missedPoints ?? []) weakCounts.set(point, (weakCounts.get(point) ?? 0) + 1);
  }
  const rank = map => [...map].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([concept, occurrences]) => ({ concept, occurrences }));
  const strengths = rank(strongCounts);
  const weaknesses = rank(weakCounts);
  return {
    answerCount: valid.length,
    overallScore: average,
    topicScores: Object.fromEntries([...topicScores].map(([topic, scores]) => [topic, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)])),
    strengths,
    weaknesses,
    recommendations: weaknesses.slice(0, 3).map(item => `Review and practice explaining: ${item.concept}`),
    rubricVersion: 'coverage-relevance-completeness-v1',
  };
}
