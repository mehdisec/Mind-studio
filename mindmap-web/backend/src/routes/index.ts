import { Router } from 'express';
import authRoutes from './authRoutes';
import pageRoutes from './pageRoutes';
import nodeRoutes from './nodeRoutes';
import edgeRoutes from './edgeRoutes';
import aiRoutes from './aiRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/pages', pageRoutes);
router.use('/nodes', nodeRoutes);
router.use('/edges', edgeRoutes);
router.use('/ai', aiRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MindMap Studio Backend API'
  });
});

export default router;
