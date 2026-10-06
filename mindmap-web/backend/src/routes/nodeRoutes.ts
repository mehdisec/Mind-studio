import { Router } from 'express';
import {
  getNodes,
  createNode,
  updateNode,
  deleteNode,
  batchUpdatePositions,
  clearPageNodes
} from '../controllers/nodeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getNodes as any);
router.post('/', createNode as any);
router.post('/batch-positions', batchUpdatePositions as any);
router.post('/clear-page', clearPageNodes as any);
router.put('/:id', updateNode as any);
router.delete('/:id', deleteNode as any);

export default router;
