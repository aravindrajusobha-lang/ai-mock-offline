import { extractResumeProfile } from '../notes/parser.js';
import { generateQuestions } from '../questions/generator.js';

export function prepareFromResume({ text, role, difficulty = 'intermediate', count = 5 } = {}) {
  const profile = extractResumeProfile(text);
  const tailored = generateQuestions({ role: role || 'General', skills: profile.skills, chunks: [], difficulty, count });
  const projectText = profile.projects ?? profile.experience;
  const resumeQuestion = projectText ? [{ id: `resume_${Buffer.from(projectText).toString('base64url').slice(0, 12)}`, role: role ?? 'General', topic: 'Resume projects', type: 'resume_project', difficulty: { beginner: 1, intermediate: 2, advanced: 3 }[difficulty], question: `Walk me through a project from your resume that is relevant to ${role ?? 'your target role'}. What was your contribution and outcome?`, sourceChunkId: null, expectedAnswerPoints: [projectText.slice(0, 400)] }] : [];
  const questions = [...resumeQuestion, ...tailored.questions].slice(0, count);
  return { profile: { skills: profile.skills, education: profile.education, experience: profile.experience, projects: profile.projects }, questions, explanation: questions.length < count ? `Resume content supported ${questions.length} distinct questions.` : null };
}
