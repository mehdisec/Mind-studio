import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../common/Button';
import {
  Brain,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Settings,
  Info,
} from 'lucide-react';

import { SettingsTab } from '../dialogs/SettingsModal';
import { Home } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenLanding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenSettings, onOpenLanding }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);

  const isLight = themeMode === 'light';

  return (
    <header
      dir="rtl"
      className={`h-12 border-b px-4 flex items-center justify-between gap-2.5 shrink-0 z-30 transition-colors w-full max-w-full overflow-hidden relative ${isLight
          ? 'bg-[#F8FAFD] border-[#CBD5E1] text-[#0B192C] shadow-sm'
          : 'bg-[#0E1322] border-slate-800/80 text-slate-100'
        }`}
    >
      {/* 1. Start: Landing Page Link Button */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenLanding && (
          <button
            type="button"
            onClick={onOpenLanding}
            title={language === 'fa' ? 'مشاهده لندینگ پیج و معرفی' : 'View Landing Page'}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
              isLight
                ? 'bg-white border-[#CBD5E1] text-slate-700 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 hover:border-cyan-500/60'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-bold">
              {language === 'fa' ? 'صفحه اصلی / لندینگ' : 'Landing'}
            </span>
          </button>
        )}
      </div>

      {/* 2. Centered MindMap Studio Logo in the middle of the header row */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-auto">
        <img
          src="/logo.png"
          alt="MindMap Studio Logo"
          className="w-9 h-9 rounded-xl object-contain shrink-0 shadow-md transition-transform hover:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex items-center gap-2">
          <h1 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#0B192C]' : 'text-slate-100'}`}>
            MindMap Studio
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLight
                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
              }`}
          >
            {t.appBadge}
          </span>
        </div>
      </div>

      {/* 3. Controls: About Us, Settings Gear & User Profile */}
      <div className="flex items-center gap-2 shrink-0 z-10">
        {/* About Us Button */}
        <button
          type="button"
          onClick={() => onOpenSettings('about')}
          title={language === 'fa' ? 'درباره ما و مشخصات پروژه' : 'About Us & Project Info'}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
            isLight
              ? 'bg-white border-[#CBD5E1] text-slate-700 hover:text-purple-600 hover:bg-purple-50 hover:border-purple-300'
              : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-purple-400 hover:bg-slate-800 hover:border-purple-500/60'
          }`}
        >
          <Info className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden md:inline font-bold">
            {language === 'fa' ? 'درباره ما' : 'About Us'}
          </span>
        </button>

        {/* Settings Gear Button */}
        <button
          type="button"
          onClick={() => onOpenSettings('appearance')}
          title={t.settingsTooltip}
          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${isLight
              ? 'bg-white border-[#CBD5E1] text-[#0F172A] hover:text-sky-600 hover:border-sky-400 hover:bg-sky-50 shadow-sm'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:bg-slate-800'
            }`}
        >
          <Settings className="w-4 h-4 transition-transform hover:rotate-90 duration-300" />
        </button>

        {/* Auth / Profile Area */}
        {isAuthenticated && user ? (
          <div
            className={`flex items-center gap-1.5 border rounded-xl p-1 ps-2 ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-slate-900/90 border-slate-800'
              }`}
          >
            <button
              type="button"
              onClick={() => onOpenSettings('profile')}
              title={t.profileTooltip}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <img
                src={user.avatarUrl || '/default-avatar.png'}
                alt={user.name || 'User'}
                className="w-5 h-5 rounded-full object-cover border border-cyan-400/80 shrink-0 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              <span className={`text-xs font-semibold max-w-[120px] truncate ${isLight ? 'text-[#0B192C]' : 'text-slate-200'}`}>
                {user.name || user.email}
              </span>
            </button>
            <button
              onClick={() => {
                logout();
                if (onOpenLanding) {
                  onOpenLanding();
                }
              }}
              title={t.logoutTooltip}
              className="p-1.5 hover:bg-slate-800/50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors ms-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={onOpenAuth} className="gap-1.5">
            <UserIcon className="w-4 h-4 text-cyan-500" />
            <span>{t.loginSignup}</span>
          </Button>
        )}
      </div>
    </header>
  );
};

