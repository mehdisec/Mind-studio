import { Router } from 'express';
import {
  generateSubTopics,
  generateSocraticQuestions,
  generateDeepDive,
  generateLineageExpansion,
  testAIConnection,
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.post('/test-connection', testAIConnection as any);
router.post('/sub-topics', generateSubTopics as any);
router.post('/socratic-questions', generateSocraticQuestions as any);
router.post('/deep-dive', generateDeepDive as any);
router.post('/lineage-expansion', generateLineageExpansion as any);

export default router;
