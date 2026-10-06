import { api } from './api';
import { AuthResponse, User, UserStats } from '../types';

export const authService = {
  async getCaptcha(): Promise<{ captchaId: string; captchaSvg: string }> {
    const res = await api.get<{ captchaId: string; captchaSvg: string }>('/auth/captcha');
    return res.data;
  },

  async login(
    email: string,
    password: string,
    captchaId?: string,
    captchaAnswer?: string
  ): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
      captchaId,
      captchaAnswer,
    });
    return res.data;
  },

  async register(email: string, password: string, name?: string, avatarUrl?: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { email, password, name, avatarUrl });
    return res.data;
  },

  async getProfile(): Promise<{ user: User }> {
    const res = await api.get<{ user: User }>('/auth/profile');
    return res.data;
  },

  async updateProfile(data: string | { name?: string; avatarUrl?: string }): Promise<{ user: User }> {
    const payload = typeof data === 'string' ? { name: data } : data;
    const res = await api.put<{ user: User }>('/auth/profile', payload);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await api.put<{ success: boolean; message: string }>('/auth/password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  async getStats(): Promise<UserStats> {
    const res = await api.get<UserStats>('/auth/stats');
    return res.data;
  },
};
