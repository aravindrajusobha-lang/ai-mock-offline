import { normalize, stableId, unique } from '../core/text.js';

const ROLE_BANK = {
  'software engineer': ['How would you debug a defect that only appears in production?', 'How do you decide what to test when time is limited?'],
  'frontend developer': ['How do you make an interface usable with a keyboard?', 'How would you investigate a slow page render?'],
  'backend developer': ['How would you design an API endpoint to handle invalid input safely?', 'How would you investigate a slow database-backed request?'],
  'data analyst': ['How do you check whether a dataset is reliable before drawing conclusions?', 'How would you explain an unexpected trend to a non-technical stakeholder?'],
  'hr': ['Tell me about a time you handled a disagreement respectfully.', 'What kind of team helps you do your best work?'],
};

function questionRecord({ text, type, topic, difficulty, sourceChunkId = null, expectedPoints = [], role = null }) {
  const normalized = normalize(text);
  return { id: stableId('q', `${normalized}\0${topic}\0${sourceChunkId ?? ''}`), role, topic, type, difficulty, question: text, sourceChunkId, expectedAnswerPoints: expectedPoints };
}

export function generateQuestions({ chunks = [], role = 'General', skills = [], difficulty = 'intermediate', count = 5, previousQuestionIds = [], selectedTopics = [] } = {}) {
  if (![5, 10, 15].includes(count)) throw new RangeError('Question count must be 5, 10, or 15.');
  if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) throw new TypeError('Difficulty must be beginner, intermediate, or advanced.');
  if (!Array.isArray(chunks) || chunks.length > 500) throw new TypeError('Chunks must be an array with no more than 500 items.');
  const selected = chunks.filter(chunk => chunk && typeof chunk.text === 'string' && chunk.text.trim() && (!selectedTopics.length || selectedTopics.includes(chunk.topic)));
  const output = [];
  const seen = new Set(previousQuestionIds);
  const add = question => {
    const key = normalize(question.question);
    if (!seen.has(question.id) && !output.some(item => normalize(item.question) === key)) {
      seen.add(question.id);
      output.push(question);
    }
  };
  const level = { beginner: 1, intermediate: 2, advanced: 3 }[difficulty];
  for (const chunk of selected) {
    const points = chunk.text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 4).slice(0, 4);
    if (!points.length) continue;
    const definition = chunk.text.match(/([\w+#.-]{2,40})\s+(?:is|are|means|refers to)\s+([^.!?]{8,180})/i);
    if (definition) add(questionRecord({ text: `According to your notes, what is ${definition[1]}?`, type: 'definition', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: points.slice(0, 2), role }));
    add(questionRecord({ text: `Explain the main idea in ${chunk.topic} in your own words.`, type: 'explain_simple', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: points.slice(0, 2), role }));
    if (/\b(for example|such as|for instance|e\.g\.)\b/i.test(chunk.text)) add(questionRecord({ text: `Give a concrete example from ${chunk.topic} and explain why it fits.`, type: 'example', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: points.slice(0, 2), role }));
    if (/\b(because|therefore|so that|in order to|allows?|enables?|helps?|purpose|important)\b/i.test(chunk.text)) add(questionRecord({ text: `Why is the key idea in ${chunk.topic} useful?`, type: 'why', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: points.slice(0, 2), role }));
    if (/\b(whereas|compared with|unlike|versus|\bvs\.?\b)\b/i.test(chunk.text)) add(questionRecord({ text: `Compare the concepts discussed in ${chunk.topic}.`, type: 'compare', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: points.slice(0, 3), role }));
    add(questionRecord({ text: `Complete this statement from ${chunk.topic}: “${points[0].slice(0, 120)}…”`, type: 'rapid_fire', topic: chunk.topic, difficulty: level, sourceChunkId: chunk.id, expectedPoints: [points[0]], role }));
  }
  const bank = ROLE_BANK[normalize(role)] ?? [];
  const skillList = unique(skills.map(s => String(s).trim()).filter(Boolean));
  const roleQuestions = [...bank, ...skillList.map(skill => `Describe a project where you used ${skill}. What trade-off did you make?`)];
  for (const text of roleQuestions) add(questionRecord({ text, type: 'interview_style', topic: role, difficulty: level, role }));
  return { questions: output.slice(0, count), requestedCount: count, explanation: output.length < count ? `The selected notes and role bank support ${output.length} distinct questions; fewer than requested were returned.` : null };
}
