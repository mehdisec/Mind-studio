import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export interface CustomEdgeData {
  label?: string;
  weight?: number;
  onDelete?: (id: string) => void;
}

export const CustomMindEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as CustomEdgeData | undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#06b6d4',
          strokeWidth: 2,
          opacity: 0.7,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group/edge flex items-center gap-1"
        >
          {edgeData?.label ? (
            <span className="bg-[#0b0f19] text-[#38bdf8] text-[11px] font-semibold px-1 py-0.5 rounded border border-[#38bdf8]/60 shadow-sm leading-none">
              {edgeData.label}
            </span>
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation();
              edgeData?.onDelete?.(id);
            }}
            title={useSettingsStore.getState().language === 'fa' ? 'حذف اتصال' : 'Delete Connection'}
            className="hidden group-hover/edge:flex items-center justify-center w-4 h-4 bg-rose-950 text-rose-400 border border-rose-800 rounded-full hover:bg-rose-900 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
