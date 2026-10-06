import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
  trend?: string;
  onClick?: () => void;
}

const colorStyles = {
  cyan: {
    iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    glow: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
    val: 'text-cyan-400',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    glow: 'hover:border-indigo-500/40 hover:shadow-indigo-500/10',
    val: 'text-indigo-400',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    glow: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    val: 'text-emerald-400',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    glow: 'hover:border-amber-500/40 hover:shadow-amber-500/10',
    val: 'text-amber-400',
  },
  rose: {
    iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    glow: 'hover:border-rose-500/40 hover:shadow-rose-500/10',
    val: 'text-rose-400',
  },
  purple: {
    iconBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    glow: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
    val: 'text-purple-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'cyan',
  trend,
  onClick,
}) => {
  const { themeMode } = useSettingsStore();
  const isLight = themeMode === 'light';
  const c = colorStyles[color] || colorStyles.cyan;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isLight
          ? 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
          : 'bg-[#0f172a]/70 border-slate-800/80 backdrop-blur-md hover:bg-slate-900/90 hover:shadow-xl'
      } ${c.glow}`}
    >
      {/* Decorative gradient blur in background */}
      <div
        className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none transition-opacity group-hover:opacity-30 ${
          color === 'cyan'
            ? 'bg-cyan-500'
            : color === 'indigo'
            ? 'bg-indigo-500'
            : color === 'emerald'
            ? 'bg-emerald-500'
            : color === 'amber'
            ? 'bg-amber-500'
            : 'bg-purple-500'
        }`}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 min-w-0">
          <p
            className={`text-xs font-medium tracking-wide truncate ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3
              className={`text-2xl font-bold tracking-tight font-mono ${
                isLight ? 'text-slate-900' : 'text-slate-100'
              }`}
            >
              {value}
            </h3>
            {trend && (
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p
              className={`text-[11px] truncate pt-0.5 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110 ${c.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
