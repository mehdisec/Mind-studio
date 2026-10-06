import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MindNode } from '../../types';
import { Sparkles, FileText, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettingsStore } from '../../stores/useSettingsStore';

export interface CustomNodeData extends MindNode {
  onEdit?: (node: MindNode) => void;
  onDeepDive?: (node: MindNode) => void;
}

export const CustomMindNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const { language } = useSettingsStore();
  const node = data as unknown as CustomNodeData;
  const importance = node.importance || 5;

  // Visual styling based on Importance (1 to 10)
  const getImportanceStyles = (rating: number) => {
    if (rating >= 8) {
      return {
        bg: 'bg-gradient-to-br from-rose-950/90 via-slate-900/90 to-amber-950/80',
        border: 'border-rose-500/80',
        glow: 'shadow-[0_0_20px_rgba(244,63,94,0.45)]',
        badgeColor: 'text-rose-400 bg-rose-950/90 border-rose-800',
        accent: '#f43f5e',
      };
    } else if (rating >= 6) {
      return {
        bg: 'bg-gradient-to-br from-amber-950/80 via-slate-900/90 to-slate-900/90',
        border: 'border-amber-500/70',
        glow: 'shadow-[0_0_18px_rgba(245,158,11,0.35)]',
        badgeColor: 'text-amber-400 bg-amber-950/90 border-amber-800',
        accent: '#f59e0b',
      };
    } else if (rating >= 4) {
      return {
        bg: 'bg-gradient-to-br from-cyan-950/80 via-slate-900/90 to-slate-900/90',
        border: 'border-cyan-500/70',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.35)]',
        badgeColor: 'text-cyan-400 bg-cyan-950/90 border-cyan-800',
        accent: '#06b6d4',
      };
    } else {
      return {
        bg: 'bg-slate-900/90',
        border: 'border-slate-600/70',
        glow: 'shadow-[0_0_10px_rgba(148,163,184,0.2)]',
        badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
        accent: '#94a3b8',
      };
    }
  };

  const style = getImportanceStyles(importance);

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        node.onEdit?.(node);
      }}
      className={clsx(
        'group relative rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer min-w-[140px] max-w-[260px] p-3 text-right',
        style.bg,
        style.border,
        style.glow,
        selected && 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0B0F19] scale-[1.03]'
      )}
    >
      {/* Top and Bottom Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-cyan-400 !border-slate-900"
      />

      {/* Header with Title and Importance Rating */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span
          className={clsx(
            'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0',
            style.badgeColor
          )}
        >
          <Star className="w-2.5 h-2.5 fill-current" />
          {importance}
        </span>
        <h4 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-tight flex-1">
          {node.title}
        </h4>
      </div>

      {/* Note preview or tags */}
      {node.note ? (
        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-normal border-t border-slate-800/80 pt-1 font-light">
          {node.note.replace(/[#*`_]/g, '')}
        </p>
      ) : null}

      {/* Quick Action Overlay Icons on Hover */}
      <div className="absolute -top-3 -left-2 hidden group-hover:flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-lg p-1 shadow-lg z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.onEdit?.(node);
          }}
          title={language === 'fa' ? 'ویرایش یادداشت (Markdown)' : 'Edit Note (Markdown)'}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            node.onDeepDive?.(node);
          }}
          title={language === 'fa' ? 'تحلیل هوشمند (Gemini Deep-Dive)' : 'Smart Analysis (Gemini Deep-Dive)'}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

CustomMindNode.displayName = 'CustomMindNode';
