import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
}) => {
  const { themeMode } = useSettingsStore();
  const isLight = themeMode === 'light';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/40 shrink-0">
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pb-0.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-600">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? isLight
                        ? 'text-cyan-600 font-semibold'
                        : 'text-cyan-400 font-semibold'
                      : ''
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}
          >
            {title}
          </h1>
          {badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  : 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        {subtitle && (
          <p
            className={`text-xs sm:text-sm font-light leading-relaxed max-w-2xl ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
