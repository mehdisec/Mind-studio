import { create } from 'zustand';
import { User, UserStats } from '../types';
import { authService } from '../services/authService';
import { useGraphStore } from './useGraphStore';
import { useSettingsStore } from './useSettingsStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string, captchaId?: string, captchaAnswer?: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  updateProfile: (data: string | { name?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (avatarUrl: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  getStats: () => Promise<UserStats | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('mindmap_token'),
  isAuthenticated: !!localStorage.getItem('mindmap_token'),
  isLoading: false,
  error: null,

  login: async (email, password, captchaId, captchaAnswer) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password, captchaId, captchaAnswer);
      localStorage.setItem('mindmap_token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const isFa = useSettingsStore.getState().language === 'fa';
      const message = err.response?.data?.error || (isFa ? 'ورود ناموفق بود. لطفاً ایمیل و رمزعبور را بررسی کنید.' : 'Login failed. Please check your email and password.');
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(email, password, name);
      localStorage.setItem('mindmap_token', data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      const isFa = useSettingsStore.getState().language === 'fa';
      const message = err.response?.data?.error || (isFa ? 'ثبت‌نام ناموفق بود.' : 'Registration failed.');
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('mindmap_token');
    set({ user: null, token: null, isAuthenticated: false, error: null });
    useGraphStore.getState().resetGraph();
  },

  checkAuth: async (): Promise<boolean> => {
    const token = localStorage.getItem('mindmap_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const { user } = await authService.getProfile();
      set({ user, isAuthenticated: true });
      return true;
    } catch (err) {
      localStorage.removeItem('mindmap_token');
      set({ user: null, token: null, isAuthenticated: false });
      useGraphStore.getState().resetGraph();
      return false;
    }
  },

  updateProfile: async (data: string | { name?: string; avatarUrl?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.updateProfile(data);
      set({ user, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const isFa = useSettingsStore.getState().language === 'fa';
      const message = err.response?.data?.error || (isFa ? 'خطا در به‌روزرسانی پروفایل' : 'Error updating profile');
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  updateAvatar: async (avatarUrl: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authService.updateProfile({ avatarUrl });
      set({ user, isLoading: false });
      return { success: true };
    } catch (err: any) {
      const isFa = useSettingsStore.getState().language === 'fa';
      const message = err.response?.data?.error || (isFa ? 'خطا در ذخیره تصویر پروفایل' : 'Error saving profile picture');
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
      return { success: true };
    } catch (err: any) {
      const isFa = useSettingsStore.getState().language === 'fa';
      const message = err.response?.data?.error || (isFa ? 'خطا در تغییر رمز عبور' : 'Error changing password');
      set({ isLoading: false });
      return { success: false, error: message };
    }
  },

  getStats: async () => {
    try {
      return await authService.getStats();
    } catch (err) {
      console.error('Failed to get stats:', err);
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
