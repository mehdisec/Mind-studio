import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';
import { AuthRequest } from '../middleware/auth';
import { generateCaptcha, verifyCaptcha } from '../utils/captcha';
import { seedSampleMindmapForPage } from '../utils/defaultSampleMindmap';

export async function getCaptcha(req: Request, res: Response): Promise<void> {
  try {
    const captcha = generateCaptcha();
    res.json(captcha);
  } catch (error) {
    console.error('getCaptcha error:', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
}

export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'رمز عبور باید شامل حداقل یک حرف بزرگ انگلیسی (A-Z) باشد' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'رمز عبور باید شامل حداقل یک حرف کوچک انگلیسی (a-z) باشد' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'رمز عبور باید شامل حداقل یک عدد (0-9) باشد' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, error: 'رمز عبور باید شامل حداقل یک کاراکتر خاص (@, #, $, %, ...) باشد' };
  }
  return { valid: true };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      res.status(400).json({ error: policy.error });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: name?.trim() || cleanEmail.split('@')[0],
        avatarUrl: avatarUrl?.trim() || '/default-avatar.png',
      }
    });

    // Automatically create a private default Page 1 with sample mindmap for the new user's workspace
    const defaultPage = await prisma.page.create({
      data: {
        userId: user.id,
        title: 'Page 1',
        order: 0,
        theme: 'cyberpunk'
      }
    });

    await seedSampleMindmapForPage(user.id, defaultPage.id);

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl || '/default-avatar.png',
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'ایمیل/نام کاربری و رمز عبور الزامی است' });
      return;
    }

    // Verify Captcha to protect against brute-force attacks
    if (captchaId) {
      const isCaptchaValid = verifyCaptcha(captchaId, captchaAnswer || '');
      if (!isCaptchaValid) {
        res.status(400).json({ error: 'کد امنیتی کپچا اشتباه است یا منقضی شده است. لطفاً مجدداً امتحان کنید.' });
        return;
      }
    }

    const cleanInput = email.trim().toLowerCase();
    
    // Check if input is an alias for the primary admin account
    const isAdminAlias = [
      'mehdisec',
      'mehdi',
      'admin',
      'admin@mindmap.local',
      'mehdisec@gmail.com'
    ].includes(cleanInput);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          ...(isAdminAlias ? [{ email: 'mehdisec@gmail.com' }] : []),
          { name: cleanInput }
        ]
      }
    });

    if (!user) {
      res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl || '/default-avatar.png',
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        ...user,
        avatarUrl: user.avatarUrl || '/default-avatar.png'
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, avatarUrl } = req.body;
    const dataToUpdate: any = {};

    if (name !== undefined && typeof name === 'string') {
      dataToUpdate.name = name.trim();
    }

    if (avatarUrl !== undefined && typeof avatarUrl === 'string') {
      dataToUpdate.avatarUrl = avatarUrl.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      res.status(400).json({ error: policy.error });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.user.userId;
    const [pagesCount, nodesCount, edgesCount] = await Promise.all([
      prisma.page.count({ where: { userId } }),
      prisma.node.count({ where: { userId } }),
      prisma.edge.count({ where: { userId } })
    ]);

    res.json({ pagesCount, nodesCount, edgesCount });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}
