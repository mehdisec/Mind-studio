import { Router } from 'express';
import { getEdges, createEdge, updateEdge, deleteEdge } from '../controllers/edgeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getEdges as any);
router.post('/', createEdge as any);
router.put('/:id', updateEdge as any);
router.delete('/:id', deleteEdge as any);

export default router;
