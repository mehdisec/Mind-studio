import { Router } from 'express';
import { register, login, getProfile, updateProfile, changePassword, getStats, getCaptcha } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/captcha', getCaptcha);
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken as any, getProfile as any);
router.put('/profile', authenticateToken as any, updateProfile as any);
router.put('/password', authenticateToken as any, changePassword as any);
router.get('/stats', authenticateToken as any, getStats as any);

export default router;
