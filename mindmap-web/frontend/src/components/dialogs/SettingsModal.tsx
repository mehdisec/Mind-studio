import React, { useState, useEffect, useRef } from 'react';
import {
  useSettingsStore,
  DEFAULT_GEMINI_API_KEY,
  DEFAULT_GEMINI_MODEL,
} from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTranslation } from '../../utils/i18n';
import { aiService } from '../../services/aiService';
import { UserStats } from '../../types';
import {
  Settings,
  X,
  Globe,
  Sun,
  Moon,
  Check,
  Sparkles,
  User as UserIcon,
  Lock,
  Bot,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Brain,
  Code2,
  Heart,
  Upload,
  Mail,
  Github,
  Layers,
  Network,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

import { validatePassword } from '../../utils/passwordValidator';

export type SettingsTab = 'profile' | 'appearance' | 'ai' | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const {
    language,
    themeMode,
    canvasBackground,
    geminiApiKey,
    geminiModel,
    setLanguage,
    setThemeMode,
    setCanvasBackground,
    setGeminiApiKey,
    setGeminiModel,
  } = useSettingsStore();
  const { user, updateProfile, changePassword, getStats, isAuthenticated } = useAuthStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl || '/about-logo.jpg');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProfileLoading(true);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(reader.result as string);
            const minDim = Math.min(img.width, img.height);
            ctx.drawImage(
              img,
              (img.width - minDim) / 2,
              (img.height - minDim) / 2,
              minDim,
              minDim,
              0,
              0,
              160,
              160
            );
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => reject(new Error('Failed to parse image'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      setProfileAvatar(dataUrl);
      const res = await updateProfile({
        name: profileName.trim() || user?.name || '',
        avatarUrl: dataUrl,
      });
      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 2500);
      }
    } catch {
      setProfileError(isFa ? 'خطا در بارگذاری تصویر' : 'Failed to upload avatar');
    } finally {
      setProfileLoading(false);
    }
  };

  // Stats State
  const [stats, setStats] = useState<UserStats | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const pwdValidation = validatePassword(newPassword);

  // AI & API Settings State
  const [inputApiKey, setInputApiKey] = useState(geminiApiKey || DEFAULT_GEMINI_API_KEY);
  const [selectedModel, setSelectedModel] = useState(geminiModel || DEFAULT_GEMINI_MODEL);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (user) {
        setProfileName(user.name || '');
        setProfileAvatar(user.avatarUrl || '/about-logo.jpg');
      }
      setProfileSuccess(false);
      setProfileError(null);
      setPasswordSuccess(false);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setInputApiKey(geminiApiKey || DEFAULT_GEMINI_API_KEY);
      setSelectedModel(geminiModel || DEFAULT_GEMINI_MODEL);
      setAiSaveSuccess(false);
      setAiTestResult(null);
    }
  }, [isOpen, initialTab, user, geminiApiKey, geminiModel]);

  useEffect(() => {
    if (isOpen && activeTab === 'profile' && isAuthenticated) {
      getStats().then((data) => setStats(data));
    }
  }, [isOpen, activeTab, isAuthenticated, getStats]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setProfileLoading(true);
    setProfileError(null);
    const res = await updateProfile({
      name: profileName.trim(),
      avatarUrl: profileAvatar,
    });
    setProfileLoading(false);
    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } else {
      setProfileError(res.error || 'Error updating profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError(isFa ? 'لطفاً رمز عبور فعلی را وارد کنید' : 'Please enter current password');
      return;
    }
    if (!pwdValidation.isValid) {
      setPasswordError(t.passwordLengthError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordMatchError);
      return;
    }
    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);
    if (res.success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } else {
      setPasswordError(res.error || (isFa ? 'رمز عبور فعلی نامعتبر است' : 'Invalid current password'));
    }
  };

  const handleSaveAi = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(inputApiKey.trim());
    setGeminiModel(selectedModel);
    setAiSaveSuccess(true);
    setTimeout(() => setAiSaveSuccess(false), 2500);
  };

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await aiService.testConnection(inputApiKey.trim(), selectedModel);
      setAiTestResult({ success: res.success, message: res.message });
    } catch {
      setAiTestResult({
        success: false,
        message: isFa ? 'خطا در برقراری ارتباط با API' : 'Connection failed',
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t.settingsTabProfile, icon: <UserIcon className="w-4 h-4" /> },
    { id: 'appearance', label: t.settingsTabAppearance, icon: <Sparkles className="w-4 h-4" /> },
    { id: 'ai', label: t.settingsTabAI, icon: <Bot className="w-4 h-4" /> },
    { id: 'about', label: t.settingsTabAbout, icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`w-full max-w-3xl h-[530px] rounded-2xl flex flex-col shadow-2xl border overflow-hidden transition-all select-none ${
          isLight
            ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-slate-400/30'
            : 'bg-[#0F172A] border-slate-800 text-slate-100 shadow-cyan-950/40'
        }`}
      >
        {/* Header with Title & Tab Bar */}
        <div
          className={`shrink-0 px-5 pt-4 pb-2 border-b flex flex-col gap-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isLight ? 'bg-sky-100 text-sky-600' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  {t.settingsModalTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.settingsModalDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation: Profile is first on the right in RTL */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    active
                      ? isLight
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Fixed viewport, strictly zero-scroll */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col justify-between">
          {/* TAB 1: PROFILE & SECURITY (MERGED) */}
          {activeTab === 'profile' && (
            <div className="h-full flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-4 h-[350px]">
                {/* Column 1: Profile & Workspace Stats */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <form onSubmit={handleUpdateProfile} className="space-y-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200">{t.profileTitle}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative group shrink-0">
                        <img
                          src={profileAvatar}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/80 shadow-md bg-slate-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/about-logo.jpg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFile}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.profileNameLabel}</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder={t.profileNamePlaceholder}
                            className={`flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg border outline-none ${
                              isLight
                                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                                : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={profileLoading}
                            className="py-1 px-2.5 rounded-lg font-bold text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white transition-all shrink-0"
                          >
                            {profileLoading ? '...' : (isFa ? 'ذخیره' : 'Save')}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                      <span>{t.profileEmailLabel}</span>
                      <span className="font-mono font-bold text-slate-200">{user?.email || 'Guest User'}</span>
                    </div>

                    {profileSuccess && (
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t.profileSuccessMsg}</span>
                      </div>
                    )}
                  </form>

                  {/* Stats Mini Grid */}
                  <div className="pt-2 border-t border-slate-700/40">
                    <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>{t.profileStatsTitle}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        {t.workspacePrivateBadge}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div className="text-sm font-bold text-cyan-300 font-mono">{stats?.pagesCount ?? 1}</div>
                        <div className="text-[9px] text-slate-400 truncate">{t.statPages}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="text-sm font-bold text-purple-300 font-mono">{stats?.nodesCount ?? 0}</div>
                        <div className="text-[9px] text-slate-400 truncate">{t.statNodes}</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-sm font-bold text-emerald-300 font-mono">{stats?.edgesCount ?? 0}</div>
                        <div className="text-[9px] text-slate-400 truncate">{t.statEdges}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Security & Password Management */}
                <form
                  onSubmit={handleChangePassword}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200">{t.securityTitle}</span>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SSL / TLS</span>
                      </span>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.currentPasswordLabel}</label>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t.currentPasswordPlaceholder}
                        className={`w-full px-2.5 py-1 pe-8 text-xs font-mono rounded-lg border outline-none ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                            : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute end-2 top-6 text-slate-400 hover:text-slate-200"
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.newPasswordLabel}</label>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="8+ کاراکتر..."
                          className={`w-full px-2.5 py-1 pe-7 text-xs font-mono rounded-lg border outline-none ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                              : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute end-1.5 top-6 text-slate-400 hover:text-slate-200"
                        >
                          {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-0.5">{t.confirmPasswordLabel}</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="تکرار رمز..."
                          className={`w-full px-2.5 py-1 text-xs font-mono rounded-lg border outline-none ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                              : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Micro Password Policy Rules */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] pt-1">
                      <div className={`flex items-center gap-1 ${pwdValidation.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <span>{pwdValidation.hasMinLength ? '✓' : '•'} ۸+ کاراکتر</span>
                      </div>
                      <div className={`flex items-center gap-1 ${pwdValidation.hasUpper && pwdValidation.hasLower ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <span>{pwdValidation.hasUpper && pwdValidation.hasLower ? '✓' : '•'} حروف بزرگ/کوچک</span>
                      </div>
                      <div className={`flex items-center gap-1 ${pwdValidation.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <span>{pwdValidation.hasNumber ? '✓' : '•'} حداقل یک عدد</span>
                      </div>
                      <div className={`flex items-center gap-1 ${pwdValidation.hasSpecial ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                        <span>{pwdValidation.hasSpecial ? '✓' : '•'} نماد خاص (@#$...)</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback & Action Button */}
                  <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between">
                    <div className="text-[10px]">
                      {passwordSuccess && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.passwordChangeSuccess}
                        </span>
                      )}
                      {passwordError && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {passwordError}
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="py-1.5 px-4 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all shrink-0"
                    >
                      {passwordLoading ? (isFa ? 'در حال تغییر...' : 'Updating...') : (isFa ? 'به‌روزرسانی رمز' : 'Update Password')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Status banner */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'حساب کاربری امن با رمزنگاری دوطرفه و همگام‌سازی لحظه‌ای' : 'Secure user profile with end-to-end encrypted session and instant cloud sync.'}</span>
                </div>
                <span className="text-[11px] font-bold text-cyan-400 font-mono">Protected</span>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="h-full flex flex-col justify-between">
              {/* Row 1: Language & Theme Mode */}
              <div className="grid grid-cols-2 gap-4">
                {/* Language Selection */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold">{t.sectionLanguage}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('fa')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isFa
                          ? isLight
                            ? 'bg-sky-50 border-sky-500 text-sky-700'
                            : 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {isFa && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>فارسی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isFa
                          ? isLight
                            ? 'bg-sky-50 border-sky-500 text-sky-700'
                            : 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {!isFa && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Theme Mode */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold">{t.sectionTheme}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isLight
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isFa ? 'تاریک' : 'Dark'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isLight
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-sm shadow-sky-500/10'
                          : 'bg-slate-800/40 border-slate-750 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isFa ? 'روشن' : 'Light'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Canvas Background Grid Selector */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{t.sectionCanvasBg}</span>
                  <span className="text-[11px] text-slate-400">
                    {t.sectionCanvasBgDesc}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'nebula', name: isFa ? 'کیهانی' : 'Nebula', color: 'from-purple-900 via-indigo-950 to-slate-950' },
                    { id: 'grid', name: isFa ? 'شبکه دیجیتال' : 'Blueprint Grid', color: 'from-sky-950 via-slate-900 to-slate-950' },
                    { id: 'dots', name: isFa ? 'ماتریس نقاط' : 'Dot Matrix', color: 'from-emerald-950 via-slate-900 to-slate-950' },
                    { id: 'obsidian', name: isFa ? 'آبسیدین خالص' : 'Obsidian', color: 'from-slate-900 via-slate-950 to-black' },
                  ].map((bg) => {
                    const active = canvasBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setCanvasBackground(bg.id as any)}
                        className={`h-20 rounded-xl border p-2 flex flex-col justify-between text-start transition-all bg-gradient-to-br ${bg.color} ${
                          active
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-md'
                            : 'border-slate-700/60 hover:border-slate-500 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-white truncate">{bg.name}</span>
                          {active && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/20" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Note */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'تنظیمات ظاهری به‌صورت خودکار در مرورگر شما ذخیره می‌شوند.' : 'Appearance settings are saved automatically in your browser.'}</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">v2.0 Pro</span>
              </div>
            </div>
          )}

          {/* TAB 3: AI & API */}
          {activeTab === 'ai' && (
            <form onSubmit={handleSaveAi} className="h-full flex flex-col justify-between">
              {/* API Key Input */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>{t.aiApiKeyLabel}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputApiKey(DEFAULT_GEMINI_API_KEY)}
                    className="text-[11px] text-cyan-500 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isFa ? 'بازنشانی کلید رسمی' : 'Reset default key'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    dir="ltr"
                    placeholder="AIzaSy..."
                    className={`w-full px-3 py-2 pe-10 text-xs font-mono rounded-lg border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Select & Quick Test */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-500" />
                    <span>{t.aiModelLabel}</span>
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    dir="ltr"
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-none font-medium ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-cyan-400'
                    }`}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Super Fast)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                  </select>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{isFa ? 'بررسی اتصال' : 'Connection Status'}</span>
                    {aiTestResult && (
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          aiTestResult.success ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {aiTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {aiTestResult.success ? (isFa ? 'متصل' : 'Online') : (isFa ? 'خطا' : 'Failed')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleTestAi}
                    disabled={isTestingAi}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isTestingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Cpu className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{isTestingAi ? t.aiTestingBtn : t.aiTestConnectionBtn}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons & Message */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  {aiSaveSuccess && (
                    <span className="text-emerald-500 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.aiSavedSuccess}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 active:scale-95 transition-all"
                >
                  {t.aiSaveBtn}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ABOUT US */}
          {activeTab === 'about' && (
            <div className="h-full flex flex-col justify-between">
              <div className="grid grid-cols-12 gap-4 h-[350px]">
                {/* Brand & Author Side Column (4 cols) */}
                <div
                  className={`col-span-4 p-3 rounded-xl border flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-48 rounded-xl overflow-hidden bg-[#0A0F1D] border border-cyan-500/30 flex items-center justify-center p-1 shadow-lg shadow-cyan-950/40">
                      <img
                        src="/about-logo.jpg"
                        alt="Mind Map Studio Logo"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    </div>
                  </div>

                  <div className="w-full pt-2 border-t border-slate-700/40 space-y-1 text-xs text-start">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold truncate">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Mehdi Mirzaei</span>
                    </div>
                    <a
                      href="https://github.com/mehdisec"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-slate-400 hover:text-purple-400 transition-colors truncate"
                    >
                      <Github className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px] truncate">@mehdisec</span>
                    </a>
                    <a
                      href="mailto:Mehdisec@gmail.com"
                      className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono text-[11px] truncate">Mehdisec@gmail.com</span>
                    </a>
                  </div>
                </div>

                {/* Personal Story & Project Mission (8 cols) */}
                <div
                  className={`col-span-8 p-4 rounded-xl border flex flex-col justify-between overflow-hidden text-xs leading-relaxed ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-2.5 text-start">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="font-bold text-slate-200">
                        {isFa ? 'داستان شکل‌گیری Mind Map Studio' : 'The Story of Mind Map Studio'}
                      </span>
                    </div>

                    {isFa ? (
                      <p className="text-[12px] leading-5 text-slate-300 text-justify">
                        سلام! من مهدی هستم. داستان شکل‌گیری Mind Map Studio از یک نیاز شخصی شروع شد. توی دنیای شلوغ امروزی، ذهنمون پر از ایده‌ها، طرح‌های پیچیده و افکار مختلفیه که مدام توی سر می‌چرخن. من همیشه به ابزاری نیاز داشتم که بتونه این افکار پراکنده رو سریع، روان و به شکلی بصری منظم کنه؛ ابزاری که هم به اندازه کافی هوشمند باشه تا بتونه با کمک هوش مصنوعی ایده‌پردازی رو گسترش بده، و هم آزادی عمل لازم رو برای کشیدن دستی دیاگرام‌ها و ساختارها بهم بده.
                        <br />
                        Mind Map Studio نتیجه همین دغدغه‌ست: پلتفرمی ساده، سریع و قدرتمند برای اینکه افکارت رو به تصویر بکشی، بدون اینکه تکنولوژی مانع جریان خلاقیتت بشه.
                      </p>
                    ) : (
                      <p className="text-[12px] leading-5 text-slate-300 text-justify">
                        Hi! I'm Mehdi. The story of Mind Map Studio began with a personal need. In today's fast-paced world, our minds are overflowing with ideas, complex schemes, and scattered thoughts. I always needed a tool that could organize these thoughts quickly, smoothly, and visually — a tool smart enough to expand brainstorms with AI, while offering total freedom to draw diagrams and structures by hand.
                        <br />
                        Mind Map Studio is the result: a simple, fast, and powerful platform to visualize your thinking effortlessly without tech friction.
                      </p>
                    )}
                  </div>

                  {/* Single Line Perfectly Aligned Footer Card */}
                  <div
                    className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 mt-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <span className="truncate">
                      {isFa
                        ? 'این اپلیکیشن با عشق و دقت ساخته شده تا ایده‌هات رو با خیال راحت به تصویر بکشی.'
                        : 'Crafted with passion & precision to bring your ideas into clear reality.'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[10px] font-bold shrink-0 whitespace-nowrap">
                      MIT License
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Copyright Note */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  isLight ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300'
                }`}
              >
                <span>Mind Map Studio &copy; 2026 Mehdi Mirzaei — All rights reserved.</span>
                <span className="text-cyan-400 font-semibold text-[11px]">Web 2.0 Pro</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
