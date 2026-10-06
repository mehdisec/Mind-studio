import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useGraphStore } from '../../stores/useGraphStore';
import { Button } from '../common/Button';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { authService } from '../../services/authService';
import { validatePassword } from '../../utils/passwordValidator';
import {
  X,
  Lock,
  Mail,
  User,
  LogIn,
  UserPlus,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { fetchPages } = useGraphStore();
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Captcha for login
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const pwdValidation = validatePassword(password);
  const passwordsMatch = mode === 'login' || (password === confirmPassword && confirmPassword.length > 0);

  const fetchNewCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await authService.getCaptcha();
      if (res && res.captchaId) {
        setCaptchaId(res.captchaId);
        setCaptchaSvg(res.captchaSvg);
        setCaptchaAnswer('');
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      clearError();
      setClientError(null);
      if (mode === 'login') {
        fetchNewCaptcha();
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setClientError(null);

    if (mode === 'register') {
      if (!pwdValidation.isValid) {
        setClientError(t.passwordLengthError);
        return;
      }
      if (password !== confirmPassword) {
        setClientError(t.passwordMatchError);
        return;
      }
    }

    let success = false;
    if (mode === 'login') {
      success = await login(email.trim(), password, captchaId, captchaAnswer.trim());
      if (!success) {
        fetchNewCaptcha();
      }
    } else {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      success = await register(email.trim(), password, fullName);
    }

    if (success) {
      await fetchPages();
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-all my-auto ${
          isLight
            ? 'bg-white border-[#CBD5E1] text-[#0F172A] shadow-slate-400/30'
            : 'bg-[#111827] border-slate-700/80 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isLight ? 'bg-[#F8FAFD] border-[#CBD5E1]' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Mind Map Studio Logo"
              className="w-8 h-8 rounded-lg object-contain bg-slate-950 border border-cyan-500/30 p-0.5 shadow-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h2 className={`text-sm font-extrabold ${isLight ? 'text-[#0B192C]' : 'text-slate-100'}`}>
                {mode === 'login' ? t.authLoginTitle : t.authRegisterTitle}
              </h2>
              <p className={`text-[11px] ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                {t.authModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-3.5">
          {/* Mode Switcher Tabs */}
          <div
            className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
              isLight ? 'bg-slate-100 border-[#CBD5E1]' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setClientError(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.authTabLogin}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
                setClientError(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.authTabRegister}</span>
            </button>
          </div>

          {/* Errors */}
          {(error || clientError) && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{clientError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* REGISTER FIELDS: First Name & Last Name */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                    {t.authFirstNameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t.authFirstNamePlaceholder}
                      className={`w-full border rounded-xl ps-8 pe-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                    {t.authLastNameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t.authLastNamePlaceholder}
                      className={`w-full border rounded-xl ps-8 pe-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                {t.authEmailLabel}
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.authEmailPlaceholder}
                  className={`w-full border rounded-xl ps-8 pe-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 ${
                    isLight
                      ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                      : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
              </div>
            </div>

            {/* Password Field with Toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                  {t.authPasswordLabel}
                </label>
                {mode === 'register' && password.length > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      pwdValidation.isValid ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {t[pwdValidation.strengthLabelKey]}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? t.authPasswordPlaceholder : '••••••••'}
                  className={`w-full border rounded-xl ps-8 pe-9 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 ${
                    isLight
                      ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                      : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* REGISTER-ONLY: Confirm Password & Password Strength Checklist */}
            {mode === 'register' && (
              <>
                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                      {t.authConfirmPasswordLabel}
                    </label>
                    {confirmPassword.length > 0 && (
                      <span
                        className={`text-[10px] font-bold flex items-center gap-0.5 ${
                          passwordsMatch ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {passwordsMatch ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {passwordsMatch ? (isFa ? 'یکسان' : 'Match') : (isFa ? 'مغایرت' : 'Mismatch')}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.authConfirmPasswordPlaceholder}
                      className={`w-full border rounded-xl ps-8 pe-9 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 ${
                        isLight
                          ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Progress Bar & Live Rules */}
                <div
                  className={`p-2.5 rounded-xl border space-y-2 text-[11px] ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Visual 4-Segment Strength Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span>{t.authPasswordReqTitle}</span>
                      <span className="font-mono">{pwdValidation.score} / 4</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            pwdValidation.score >= step
                              ? pwdValidation.strengthColor
                              : isLight
                              ? 'bg-slate-200'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 4 Interactive Checklist Chips */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <div
                      className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                        pwdValidation.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          pwdValidation.hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pwdValidation.hasMinLength ? <Check className="w-2.5 h-2.5" /> : '•'}
                      </div>
                      <span>{t.authReqLength}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                        pwdValidation.hasUpper && pwdValidation.hasLower ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          pwdValidation.hasUpper && pwdValidation.hasLower ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pwdValidation.hasUpper && pwdValidation.hasLower ? <Check className="w-2.5 h-2.5" /> : '•'}
                      </div>
                      <span>{t.authReqUpperLower}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                        pwdValidation.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          pwdValidation.hasNumber ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pwdValidation.hasNumber ? <Check className="w-2.5 h-2.5" /> : '•'}
                      </div>
                      <span>{t.authReqNumber}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 text-[10px] transition-colors ${
                        pwdValidation.hasSpecial ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          pwdValidation.hasSpecial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {pwdValidation.hasSpecial ? <Check className="w-2.5 h-2.5" /> : '•'}
                      </div>
                      <span>{t.authReqSpecial}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* LOGIN-ONLY: Captcha Protection */}
            {mode === 'login' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-[#0B192C]' : 'text-slate-300'}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                    <span>{language === 'fa' ? 'کد امنیتی (ضد بروت‌فورس)' : 'Security Code (Anti-Brute Force)'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={fetchNewCaptcha}
                    disabled={loadingCaptcha}
                    className="text-[11px] text-sky-500 hover:text-sky-400 flex items-center gap-1 transition-colors"
                    title={language === 'fa' ? 'تغییر کد امنیتی' : 'Refresh Captcha'}
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                    <span>{language === 'fa' ? 'تغییر کد' : 'Refresh'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-10 px-2 rounded-xl flex items-center justify-center border overflow-hidden shrink-0 select-none shadow-inner ${
                      isLight ? 'bg-slate-100 border-[#CBD5E1]' : 'bg-slate-900 border-slate-700'
                    }`}
                    style={{ minWidth: '130px' }}
                  >
                    {captchaSvg ? (
                      <img
                        src={
                          captchaSvg.startsWith('data:')
                            ? captchaSvg
                            : `data:image/svg+xml;utf8,${encodeURIComponent(captchaSvg)}`
                        }
                        alt="Security Captcha"
                        className="h-8 w-auto object-contain rounded"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">...</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={captchaAnswer}
                    onChange={(e) => {
                      let val = e.target.value;
                      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
                      for (let i = 0; i < 10; i++) {
                        val = val.replace(new RegExp(persianDigits[i], 'g'), String(i)).replace(new RegExp(arabicDigits[i], 'g'), String(i));
                      }
                      setCaptchaAnswer(val.toUpperCase().trim());
                    }}
                    placeholder={language === 'fa' ? 'کد تصویر' : 'Code'}
                    maxLength={6}
                    autoComplete="off"
                    className={`w-full h-10 border rounded-xl px-3 text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-1 ${
                      isLight
                        ? 'bg-white border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 focus:ring-sky-500'
                        : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="cyber"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{t.authSubmitLogin}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{t.authSubmitRegister}</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
