import { parseNotes } from './notes/parser.js';
import { generateQuestions } from './questions/generator.js';
import { evaluateAnswer } from './answers/evaluator.js';
import { generateFeedback } from './feedback/generator.js';
import { buildPerformanceReport } from './performance/report.js';
import { selectNextQuestion } from './interviews/assistant.js';
import { prepareFromResume } from './resume/preparation.js';
import { getModelStatus, generateWithLocalModel } from './models/manager.js';

export function createAiRouter(express) {
  if (!express?.Router) throw new TypeError('Pass the Express module to createAiRouter(express).');
  const router = express.Router();
  const endpoint = handler => async (req, res) => {
    try { res.json(await handler(req)); }
    catch (error) {
      const status = error instanceof RangeError ? 413 : error instanceof TypeError ? 400 : 500;
      res.status(status).json({ error: { code: status === 500 ? 'AI_SERVICE_ERROR' : 'INVALID_REQUEST', message: error.message } });
    }
  };

  router.get('/health', endpoint(async () => ({ status: 'ok', mode: 'offline-template', modelRunner: await getModelStatus() })));
  router.post('/notes/parse', endpoint(async req => parseNotes(req.body?.text, { format: req.body?.format ?? 'paste' })));
  router.post('/questions/generate', endpoint(async req => generateQuestions(req.body ?? {})));
  router.post('/answers/evaluate', endpoint(async req => evaluateAnswer(req.body ?? {})));
  router.post('/feedback', endpoint(async req => generateFeedback(req.body?.evaluation, req.body?.context)));
  router.post('/interviews/next', endpoint(async req => selectNextQuestion(req.body ?? {})));
  router.post('/performance/report', endpoint(async req => buildPerformanceReport(req.body?.answers ?? [])));
  router.post('/resume/prepare', endpoint(async req => prepareFromResume(req.body ?? {})));
  router.get('/models', endpoint(async () => getModelStatus()));
  router.post('/models/generate', endpoint(async req => generateWithLocalModel(req.body ?? {})));
  return router;
}
