import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useGraphStore } from '../../stores/useGraphStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../common/Button';
import {
  Brain,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  User,
  LogIn,
  Sliders,
  Moon,
  Sun,
  Globe,
  FileCode,
  PenTool,
  Download,
  Upload,
  Cpu,
  Workflow,
  Sticker,
} from 'lucide-react';

interface LandingPageProps {
  onEnterStudio: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterStudio, onOpenAuth }) => {
  const { language, setLanguage, themeMode, setThemeMode } = useSettingsStore();
  const { isAuthenticated, user } = useAuthStore();
  const { isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';

  const [previewTab, setPreviewTab] = useState<'mindmap' | 'diagram' | 'ai' | 'portability'>('mindmap');

  useEffect(() => {
    // Enable smooth scrolling while on Landing Page
    document.body.style.overflow = 'auto';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.overflow = 'auto';
    }

    return () => {
      // Revert to strictly disabled scroll when switching into Studio Workspace
      document.body.style.overflow = 'hidden';
      if (rootEl) {
        rootEl.style.overflow = 'hidden';
      }
    };
  }, []);

  const isFa = language === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <div
      id="landing-scroll-root"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden selection:bg-sky-500 selection:text-white transition-colors duration-300 z-30 ${
        isLight
          ? 'bg-slate-50 text-slate-800'
          : 'bg-[#0B0F19] text-slate-100'
      }`}
      style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-40 -start-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${
            isLight ? 'bg-sky-400' : 'bg-cyan-600'
          }`}
        />
        <div
          className={`absolute top-1/3 -end-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 ${
            isLight ? 'bg-purple-300' : 'bg-purple-800'
          }`}
        />
        <div
          className={`absolute -bottom-40 start-1/3 w-96 h-96 rounded-full blur-3xl opacity-15 ${
            isLight ? 'bg-indigo-300' : 'bg-blue-600'
          }`}
        />
      </div>

      {/* Header / Navbar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
          isLight
            ? 'bg-white/85 border-slate-200 shadow-sm'
            : 'bg-[#0B0F19]/80 border-slate-800/80 shadow-lg shadow-black/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-35 group-hover:opacity-75 transition duration-300" />
              <img
                src="/logo.png"
                alt="Mind Map Studio Logo"
                className="relative w-16 h-16 rounded-2xl object-contain shadow-lg border border-white/20 bg-slate-900 p-1"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Mind Map Studio
                </span>
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v2.5
                </span>
              </div>
              <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isFa ? 'استودیوی جامع گراف دانشی، دیاگرام و هوش مصنوعی' : 'Knowledge Graph, Diagram Studio & Gemini AI'}
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Hidden on small mobile) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a
              href="#features"
              className={`transition-colors hover:text-sky-500 ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {isFa ? 'ویژگی‌های کلیدی' : 'Features'}
            </a>
            <a
              href="#showcase"
              className={`transition-colors hover:text-sky-500 ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {isFa ? 'نمایش قابلیت‌ها' : 'Showcase'}
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={isFa ? 'تغییر زبان به انگلیسی' : 'Switch to Persian'}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{language === 'fa' ? 'EN' : 'فارسی'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
              className={`p-2 rounded-xl border transition-colors ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title={isLight ? 'حالت تاریک' : 'حالت روشن'}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Direct Login or Enter Studio Trigger */}
            <button
              type="button"
              onClick={isAuthenticated ? onEnterStudio : onOpenAuth}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105 ${
                isAuthenticated
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-sky-600/20'
              }`}
            >
              {isAuthenticated ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ورود به محیط استودیو' : 'Enter Studio'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isFa ? 'ورود / ثبت‌نام' : 'Sign In / Register'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left / Main Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            {/* Release Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>
                {isFa
                  ? 'نسل جدید مهندسی دانش — گراف فیزیکی ۶۰ فریم + بوم دیاگرام دستی + هوش مصنوعی Gemini'
                  : 'Next-Gen Knowledge Engine — 60 FPS Physics Graph + Diagram Studio + Gemini AI'}
              </span>
            </div>

            {/* Main Headline - Kept Exactly as user requested */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {isFa ? (
                <>
                  ایده‌های خود را به{' '}
                  <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                    نقشه‌های بصری زنده
                  </span>{' '}
                  و دیاگرام‌های ژورنالی تبدیل کنید.
                </>
              ) : (
                <>
                  Transform Your Ideas into{' '}
                  <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                    Living Visual Graphs
                  </span>{' '}
                  and Editorial Diagrams.
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0 ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {isFa
                ? 'پلتفرمی مدرن برای تجسم ایده‌ها و ساختاردهی افکار پیچیده با شبیه‌سازی گرانش صفر فیزیک، استودیوی رسم دیاگرام و استیکرهای متنوع، واکاوی سقراطی و ترسیم نقشه راه با هوش مصنوعی Google Gemini، و همگام‌سازی کامل با Markdown و JSON.'
                : 'A state-of-the-art platform for complex thought structuring, combining Zero-G physics simulation, freeform diagram studio with handwritten stickers, Gemini Socratic AI deep-dive, and full Markdown/JSON portability.'}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={isAuthenticated ? onEnterStudio : onOpenAuth}
                className={`font-extrabold px-8 py-3.5 text-base flex items-center gap-2.5 rounded-xl text-white shadow-xl hover:scale-105 transition-all cursor-pointer ${
                  isAuthenticated
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:from-sky-500 hover:to-cyan-500 shadow-sky-600/30'
                }`}
              >
                {isAuthenticated ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{isFa ? 'ورود به محیط استودیو' : 'Enter Studio Workspace'}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{isFa ? 'ورود یا ثبت‌نام در سامانه' : 'Sign In / Register'}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              <a
                href="#showcase"
                className={`px-6 py-3.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
                  isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>{isFa ? 'مشاهده قابلیت‌ها و بوم‌ها' : 'Explore Capabilities'}</span>
              </a>
            </div>

            {/* Highlights pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                {isFa ? 'فیزیک ذرات ۶۰ فریم' : '60 FPS Physics Engine'}
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
                {isFa ? '۴ سبک بصری گراف' : '4 Graph Archetypes'}
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <CheckCircle2 className="w-4 h-4" />
                {isFa ? 'هوش مصنوعی Gemini 2.5' : 'Gemini AI Socratic Engine'}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
                {isFa ? 'حساب کاربری امن و ضدبات' : 'Secure Auth & Anti-Bot Guard'}
              </span>
            </div>
          </div>

          {/* Right Hero: Floating Studio Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Outer Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse" />

              <div className={`relative rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${
                isLight
                  ? 'bg-white/95 border-slate-200 shadow-slate-300/50'
                  : 'bg-[#111827]/90 border-slate-700/80 shadow-black/60'
              }`}>
                {/* Card Header with Logo */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="Mind Map Studio"
                      className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-slate-700 p-0.5 shadow-sm"
                    />
                    <div>
                      <h3 className="text-sm font-black bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                        Mind Map Studio
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {isFa ? 'بوم تعاملی و هوش مصنوعی' : 'Interactive Graph & AI'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Physics Engine Live
                  </span>
                </div>

                {/* Mini Canvas Simulation */}
                <div className={`mt-4 rounded-xl p-4 border relative overflow-hidden h-52 flex flex-col justify-between ${
                  isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                }`}>
                  {/* Decorative interconnected nodes simulation */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-sky-500/30 stroke-1">
                    <line x1="50%" y1="50%" x2="25%" y2="25%" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" />
                    <line x1="50%" y1="50%" x2="20%" y2="75%" />
                    <line x1="50%" y1="50%" x2="80%" y2="75%" />
                  </svg>

                  {/* Nodes */}
                  <div className="absolute top-[18%] start-[20%] px-2.5 py-1 rounded-lg bg-purple-600/80 text-white text-[10px] font-bold shadow-md shadow-purple-600/30 border border-purple-400/40 animate-bounce" style={{ animationDuration: '3s' }}>
                    {isFa ? 'تحلیل دانشی' : 'Knowledge Graph'}
                  </div>
                  <div className="absolute top-[18%] end-[15%] px-2.5 py-1 rounded-lg bg-emerald-600/80 text-white text-[10px] font-bold shadow-md shadow-emerald-600/30 border border-emerald-400/40 animate-bounce" style={{ animationDuration: '4s' }}>
                    {isFa ? 'نقشه راه اجرایی' : 'Roadmap 2026'}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white text-xs font-black shadow-lg shadow-sky-600/50 border border-sky-300/40 z-10 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Mind Map Studio</span>
                  </div>
                  <div className="absolute bottom-[18%] start-[15%] px-2.5 py-1 rounded-lg bg-rose-600/80 text-white text-[10px] font-bold shadow-md shadow-rose-600/30 border border-rose-400/40">
                    {isFa ? 'رسم دیاگرام دستی' : 'Diagram Studio'}
                  </div>
                  <div className="absolute bottom-[18%] end-[18%] px-2.5 py-1 rounded-lg bg-amber-600/80 text-white text-[10px] font-bold shadow-md shadow-amber-600/30 border border-amber-400/40">
                    {isFa ? 'هوش مصنوعی Gemini' : 'Gemini AI'}
                  </div>
                </div>

                {/* Features inside card */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      {isFa ? '۴ سبک بصری و اتصالات' : '4 Visual Archetypes'}
                    </span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}>
                    <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-semibold text-[11px]">
                      {isFa ? 'بوم دیاگرام و استیکرها' : 'Diagram & Stickers'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={isAuthenticated ? onEnterStudio : onOpenAuth}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAuthenticated ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFa ? 'باز کردن میزکار استودیو' : 'Open Studio Workspace'}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isFa ? 'ورود به حساب کاربری جهت دسترسی به استودیو' : 'Sign In to Access Studio'}</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Showcase Section */}
      <section id="showcase" className={`py-16 border-y ${
        isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/40 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {isFa ? 'محیط کاری هوشمند، منعطف و چندبُعدی' : 'Intelligent, Flexible Multi-Engine Workspace'}
            </h2>
            <p className={`text-sm sm:text-base ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isFa
                ? 'جابجایی بی‌درنگ میان گراف فیزیکی ارگانیک، بوم دیاگرام دستی، دستیار هوش مصنوعی و انتقال جامع داده‌ها'
                : 'Seamlessly switch between organic physics graph, manual diagram canvas, Gemini AI assistant, and data portability'}
            </p>

            {/* Toggle Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPreviewTab('mindmap')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  previewTab === 'mindmap'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>{isFa ? '۱. گراف فیزیکی و ۴ سبک بصری' : '1. Physics Graph & 4 Archetypes'}</span>
              </button>
              <button
                onClick={() => setPreviewTab('diagram')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  previewTab === 'diagram'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>{isFa ? '۲. استودیوی دیاگرام و استیکرها' : '2. Diagram Studio & Stickers'}</span>
              </button>
              <button
                onClick={() => setPreviewTab('ai')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  previewTab === 'ai'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? '۳. هوش مصنوعی سقراطی و نقشه راه' : '3. Gemini Socratic AI & Roadmap'}</span>
              </button>
              <button
                onClick={() => setPreviewTab('portability')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  previewTab === 'portability'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    : isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>{isFa ? '۴. پشتیبان‌گیری و همگام‌سازی Markdown/JSON' : '4. Markdown & JSON Portability'}</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#111827] border-slate-800'
          }`}>
            {previewTab === 'mindmap' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black">{isFa ? 'موتور فیزیک ۶۰ فریم و ۴ سبک ساختاری' : '60 FPS Physics Engine & 4 Archetypes'}</h3>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {isFa
                      ? 'شبیه‌سازی کامل دافعه الکترواستاتیک کولن، کشسانی فنری هوک و انیمیشن‌های شناوری آرام. هر صفحه می‌تواند به یکی از ۴ قالب ساختاری تبدیل شود: شبکه شناور، درخت پله‌ای ۹۰ درجه، شاخه‌های منحنی ارگانیک و مدار شش‌ضلعی سایبر.'
                      : 'Real-time electrostatic Coulomb repulsion, spring elasticity, and floating drift. Every page supports 4 distinct archetypes: Floating Force Network, Structured Step-Tree (90°), Organic Curved Branches, and Cyber Circuit Hexagons.'}
                  </p>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li className="flex items-center gap-2 text-sky-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'امواج حلقوی نرم دور نودهای تگ انتخابی' : 'Soft ripple waves highlighting filtered tags'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sky-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'اتصال هوشمند نودها با Shift + Drag' : 'Interactive node connection via Shift + Drag'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-sky-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? '۴ پس‌زمینه بوم: مشبک، کیهانی، بلوپرینت و ساده' : '4 canvas backgrounds: Grid, Cosmos, Blueprint & Minimal'}</span>
                    </li>
                  </ul>
                </div>
                <div className={`rounded-xl border p-4 flex flex-col justify-center items-center min-h-[260px] relative overflow-hidden ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-500/10 text-center">
                      <div className="text-xs font-black text-sky-400">Floating Force</div>
                      <div className="text-[10px] text-slate-400 mt-1">{isFa ? 'شبکه ارگانیک دایره‌ای' : 'Elastic spring nodes'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-center">
                      <div className="text-xs font-black text-purple-400">Step-Tree</div>
                      <div className="text-[10px] text-slate-400 mt-1">{isFa ? 'درخت ساختاریافته ۹۰°' : 'Orthogonal 90° hierarchy'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center">
                      <div className="text-xs font-black text-emerald-400">Curved Mindmap</div>
                      <div className="text-[10px] text-slate-400 mt-1">{isFa ? 'شاخه‌های کپسولی منحنی' : 'Organic Bezier branches'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-center">
                      <div className="text-xs font-black text-cyan-400">Cyber Hexagon</div>
                      <div className="text-[10px] text-slate-400 mt-1">{isFa ? 'مدارهای سایبر ۴۵°' : 'Futuristic tech traces'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'diagram' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black">{isFa ? 'استودیوی دیاگرام و استیکرهای دست‌نویس' : 'Manual Diagram Studio & Sticker Dock'}</h3>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {isFa
                      ? 'بوم اختصاصی برای رسم دیاگرام‌های آزاد، جابجایی آزادانه المان‌ها، اتصال فلش‌های هوشمند و درج مجموعه کاملی از استیکرهای اشکال، فلش‌ها و آیکون‌های دست‌نویس از طریق کلیک راست روی صفحه.'
                      : 'Dedicated freeform diagram canvas with manual connector routing, custom shape placement, and a rich handwriting sticker dock directly accessible via the canvas right-click menu.'}
                  </p>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li className="flex items-center gap-2 text-purple-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'داک شناور کلیک راست برای افزودن سریع نود و استیکر' : 'Right-click radial dock for instant node & sticker insertion'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-purple-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'اتصال مستقیم فلش‌ها و خطوط رابط میان اشکال' : 'Direct interactive connector lines and arrows'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-purple-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'شخصی‌سازی رنگ‌ها، حاشیه‌ها و یادداشت‌های تفصیلی' : 'Custom colors, borders, importance scores & markdown'}</span>
                    </li>
                  </ul>
                </div>
                <div className={`rounded-xl border p-4 flex flex-col justify-center items-center min-h-[260px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-center flex flex-col items-center gap-1">
                      <Sticker className="w-5 h-5 text-purple-400" />
                      <div className="text-xs font-black text-purple-400">{isFa ? 'استیکرهای متنوع' : 'Handwriting Stickers'}</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'فلش‌ها، کادرها و نشان‌ها' : 'Arrows, badges & frames'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-500/10 text-center flex flex-col items-center gap-1">
                      <Workflow className="w-5 h-5 text-sky-400" />
                      <div className="text-xs font-black text-sky-400">{isFa ? 'رسم آزاد دیاگرام' : 'Freeform Connectors'}</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'فلوچارت و ساختار درختی' : 'Flowcharts & Mindmaps'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center flex flex-col items-center gap-1">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      <div className="text-xs font-black text-emerald-400">{isFa ? 'داک شناور کلیک‌راست' : 'Context Radial Menu'}</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'دسترسی در هر نقطه از بوم' : 'Instant workspace actions'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-center flex flex-col items-center gap-1">
                      <Layers className="w-5 h-5 text-amber-400" />
                      <div className="text-xs font-black text-amber-400">{isFa ? 'صفحات چندگانه' : 'Multi-Page Workspaces'}</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'مدیریت تب‌های اختصاصی' : 'Dedicated canvas tabs'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'ai' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black">{isFa ? 'تحلیل شناختی و تولید نقشه راه با هوش مصنوعی' : 'Gemini 2.5 Cognitive Analysis & Roadmap'}</h3>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {isFa
                      ? 'موتور هوش مصنوعی Google Gemini 2.5 Flash در دو حالت اختصاصی عمل می‌کند: ۱. واکاوی عمیق و طرح ۵ سوال بنیادین سقراطی برای به چالش کشیدن فرضیات. ۲. تولید نقشه راه چندفازه به همراه مایلستون‌ها و خروجی‌های اجرایی با قابلیت ادغام شعاعی در گراف.'
                      : 'Powered by Gemini 2.5 Flash in two distinct modes: Foundational Deep Dive with 5 Socratic questions challenging core premises, and Execution Roadmap generation with phased milestones and one-click radial merging.'}
                  </p>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li className="flex items-center gap-2 text-amber-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? '۵ سوال ژرف سقراطی برای شکستن نقاط کور فکری' : '5 Socratic probing questions to uncover blindspots'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'تولید نقشه راه چندفازه و مایلستون‌های اجرایی' : 'Multi-phase actionable roadmaps with deliverables'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-amber-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'ادغام شعاعی گزاره‌های هوش مصنوعی با یک کلیک' : '1-Click radial merge directly into active canvas'}</span>
                    </li>
                  </ul>
                </div>
                <div className={`rounded-xl border p-4 flex flex-col justify-center items-center min-h-[260px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="w-full max-w-sm space-y-2">
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
                      <span className="font-bold text-amber-400">❓ {isFa ? 'پرسش سقراطی ۱:' : 'Socratic Question 1:'}</span>
                      <p className="text-slate-300 text-[11px] mt-1">{isFa ? 'اصلی‌ترین پیش‌فرض اثبات‌نشده در این معماری چیست؟' : 'What is the most critical unproven assumption here?'}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs">
                      <span className="font-bold text-sky-400">🚀 {isFa ? 'مایلستون فاز ۱ (MVP):' : 'Milestone Phase 1 (MVP):'}</span>
                      <p className="text-slate-300 text-[11px] mt-1">{isFa ? 'پیاده‌سازی پروتوتایپ هسته و اعتبارسنجی فرضیات با کاربران' : 'Core prototype implementation & hypothesis validation'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'portability' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black">{isFa ? 'پشتیبان‌گیری و همگام‌سازی Markdown و JSON' : 'Full Markdown & JSON Portability'}</h3>
                  <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {isFa
                      ? 'مالکیت ۱۰۰٪ داده‌ها در دست شماست. برون‌بری و درون‌ریزی فایل‌های استاندارد Markdown (کاملاً سازگار با نرم‌افزار Obsidian و ساختار YAML Frontmatter) و ذخیره/بازیابی کامل میزکار با فرمت JSON.'
                      : 'Complete data ownership. Seamlessly export/import Markdown files with YAML Frontmatter for Obsidian compatibility, and perform complete workspace snapshot backups with structured JSON.'}
                  </p>
                  <ul className="space-y-2 text-xs font-semibold">
                    <li className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'ایمپورت و اکسپورت فایل‌های Markdown سازگار با Obsidian' : 'Obsidian-compatible Markdown import & export'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'پشتیبان‌گیری کامل میزکار به همراه استیکرها در قالب JSON' : 'Full workspace snapshot backup & restore with JSON'}</span>
                    </li>
                    <li className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFa ? 'ویرایشگر یادداشت غنی درون سایدبار و پنجره پیشرفته' : 'Rich markdown inspector in sidebar & modal'}</span>
                    </li>
                  </ul>
                </div>
                <div className={`rounded-xl border p-4 flex flex-col justify-center items-center min-h-[260px] ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center flex flex-col items-center gap-1">
                      <Download className="w-5 h-5 text-emerald-400" />
                      <div className="text-xs font-black text-emerald-400">JSON Export</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'پشتیبان‌گیری کامل' : 'Full backup'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-sky-500/30 bg-sky-500/10 text-center flex flex-col items-center gap-1">
                      <Upload className="w-5 h-5 text-sky-400" />
                      <div className="text-xs font-black text-sky-400">JSON Import</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'بازیابی سریع میزکار' : 'Restore canvas'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 text-center flex flex-col items-center gap-1">
                      <FileCode className="w-5 h-5 text-purple-400" />
                      <div className="text-xs font-black text-purple-400">Markdown (.md)</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'همگام با Obsidian' : 'Obsidian sync'}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-center flex flex-col items-center gap-1">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <div className="text-xs font-black text-amber-400">Data Privacy</div>
                      <div className="text-[10px] text-slate-400">{isFa ? 'ذخیره‌سازی امن محلی' : 'Local & secure'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className={`py-16 border-t ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0E131F] border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black">
              {isFa ? 'امکانات و قابلیت‌های پیشرفته Mind Map Studio' : 'Advanced Mind Map Studio Features'}
            </h2>
            <p className={`text-sm mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isFa
                ? 'طراحی شده برای متخصصان، پژوهشگران، معماران نرم‌افزار، مدیران محصول و طراحان خلاق'
                : 'Engineered for researchers, software architects, product managers, and visual thinkers'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'شبیه‌ساز فیزیک ذرات ۶۰ فریم' : '60 FPS Physics Engine'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'دافعه الکترواستاتیک کولن، کشسانی فنری هوک و جلوگیری هوشمند از هم‌پوشانی نودها در شبکه‌های متراکم دانشی.'
                  : 'Real-time electrostatic Coulomb repulsion, spring-damped elasticity, and automatic collision avoidance.'}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-4">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'بوم دیاگرام و استیکرهای دست‌نویس' : 'Diagram Studio & Stickers'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'رسم آزاد فلوچارت‌ها و دیاگرام‌ها با خطوط اتصال منعطف و کاتالوگ غنی استیکرها از منوی کلیک راست.'
                  : 'Freeform flowchart & diagram drawing with manual connector routing and rich handwriting sticker dock.'}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'تحلیل شناختی با هوش مصنوعی' : 'Gemini Socratic AI Engine'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'طرح ۵ سوال عمیق سقراطی برای به چالش کشیدن فرضیات و تولید نقشه راه چندفازه با مایلستون‌های اجرایی.'
                  : '5 foundational Socratic questions and multi-phase roadmap generation with one-click radial merge.'}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'حساب کاربری امن و محافظت‌شده' : 'Secure Account & Anti-Bot Guard'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'احراز هویت استاندارد و ایمن، رعایت الزامات گذرواژه قوی با چک‌لیست زنده و کپچای پویا جهت حفاظت در برابر حملات ورود.'
                  : 'Standard secure authentication, strong password policy verification with live checklist, and dynamic anti-bot protection.'}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'انتقال و پشتیبان‌گیری JSON و MD' : 'Markdown & JSON Sync'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'پشتیبان‌گیری کامل میزکار در قالب فایل JSON و تبادل فایل‌های Markdown سازگار با Obsidian و فرانت‌متر.'
                  : 'Full JSON workspace snapshot backup/restore and Obsidian-compatible Markdown import/export.'}
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold mb-1.5">{isFa ? 'تنظیمات دوزبانه و بدون اسکرول' : 'Zero-Scroll Bilingual UI'}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isFa
                  ? 'رابط کاربری دوزبانه فارسی/انگلیسی، تم‌های Cyber Dark و Light، همراه با ۴ پس‌زمینه اختصاصی بوم.'
                  : 'Seamless RTL/LTR bilingual UI, sleek Cyber Dark & Light themes with 4 curated canvas backgrounds.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-10 border-t ${
        isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-[#0B0F19] border-slate-800 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Mind Map Studio"
              className="w-8 h-8 rounded-lg object-contain bg-slate-900 p-0.5"
            />
            <span className="font-extrabold text-sm text-slate-200">
              Mind Map Studio
            </span>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} Mind Map Studio. {isFa ? 'کلیه حقوق محفوظ است.' : 'All rights reserved.'}
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs"
          >
            {isFa ? 'بازگشت به بالا' : 'Back to top'}
          </Button>
        </div>
      </footer>
    </div>
  );
};

