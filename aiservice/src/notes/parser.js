import { ensureText, stableId, sentences } from '../core/text.js';

export function parseNotes(rawText, { format = 'paste', maxWords = 180, maxChars } = {}) {
  if (!['paste', 'txt', 'md', 'pdf'].includes(format)) throw new TypeError('Supported formats are paste, txt, md, or extracted pdf text.');
  const text = ensureText(rawText, 'Notes', maxChars);
  const sections = [];
  let topic = 'General';
  let lines = [];
  const flush = () => {
    const body = lines.join('\n').trim();
    if (body) sections.push({ topic, body });
    lines = [];
  };
  for (const line of text.split('\n')) {
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/) || line.match(/^\s*([A-Z][\w &()/,-]{1,60}):\s*$/);
    if (heading) {
      flush();
      topic = (heading[2] ?? heading[1]).trim();
    } else lines.push(line);
  }
  flush();
  if (!sections.length) sections.push({ topic: 'General', body: text });

  const chunks = [];
  for (const section of sections) {
    const paragraphs = section.body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      let part = [];
      let wordCount = 0;
      for (const sentence of sentences(paragraph)) {
        const count = sentence.split(/\s+/).length;
        if (part.length && wordCount + count > maxWords) {
          chunks.push(makeChunk(section.topic, part.join(' ')));
          part = [];
          wordCount = 0;
        }
        part.push(sentence);
        wordCount += count;
      }
      if (part.length) chunks.push(makeChunk(section.topic, part.join(' ')));
    }
  }
  return { topics: [...new Set(chunks.map(chunk => chunk.topic))], chunks, charCount: text.length };
}

function makeChunk(topic, text) {
  return { id: stableId('chunk', `${topic}\0${text}`), topic, text, wordCount: text.split(/\s+/).length };
}

export function extractResumeProfile(rawText) {
  const text = ensureText(rawText, 'Resume', 50_000);
  const skillsDictionary = ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB', 'SQL', 'Python', 'Java', 'C++', 'C#', 'Express', 'REST API', 'HTML', 'CSS', 'Git', 'Docker', 'AWS', 'communication', 'leadership', 'problem solving'];
  const lower = text.toLocaleLowerCase('en');
  const skills = skillsDictionary.filter(skill => lower.includes(skill.toLocaleLowerCase('en')));
  const sections = {};
  const patterns = {
    education: /(?:education|academic background)\s*[:\n]([\s\S]*?)(?=\n\s*(?:experience|projects|skills|certifications)\b|$)/i,
    experience: /(?:experience|employment|work history)\s*[:\n]([\s\S]*?)(?=\n\s*(?:education|projects|skills|certifications)\b|$)/i,
    projects: /(?:projects|selected projects)\s*[:\n]([\s\S]*?)(?=\n\s*(?:education|experience|skills|certifications)\b|$)/i,
  };
  for (const [key, pattern] of Object.entries(patterns)) sections[key] = text.match(pattern)?.[1]?.trim() ?? null;
  return { skills, education: sections.education, experience: sections.experience, projects: sections.projects, sourceText: text };
}
