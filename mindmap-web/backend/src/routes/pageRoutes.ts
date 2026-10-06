import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPages,
  createPage,
  updatePage,
  deletePage,
} from '../controllers/pageController';

const router = Router();

router.use(authenticateToken);

router.get('/', getPages);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;
