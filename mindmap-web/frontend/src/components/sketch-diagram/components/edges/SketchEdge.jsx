import React, { useState } from 'react';
import { BaseEdge, getBezierPath, getSmoothStepPath, getStraightPath } from '@xyflow/react';

export default function SketchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  selected,
}) {
  const isOrthogonal =
    data.pathType === 'step' ||
    data.pathType === 'smoothstep' ||
    data.isOrthogonal ||
    data.styleType === 'dashed-orthogonal' ||
    data.styleType === 'solid-orthogonal' ||
    (data.isCorp && data.styleType !== 'bezier');

  // Generate either sharp orthogonal step path or smooth organic bezier
  let edgePath = '';
  if (data.pathType === 'straight') {
    [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (isOrthogonal) {
    [edgePath] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: data.borderRadius !== undefined ? data.borderRadius : 0, // Sharp 90-deg angles
    });
  } else {
    [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.35,
    });
  }

  const [isHovered, setIsHovered] = useState(false);

  const isDashed = data.styleType === 'dashed' || data.styleType === 'dashed-orthogonal';
  const hasArrow = data.styleType === 'solid-arrow' || data.hasArrow;
  const isCrisp = isOrthogonal || data.isCorp;
  
  // Highlight edge on hover or when selected
  let strokeColor = data.strokeColor || style?.stroke || '#1A1A1A';
  if (isHovered && !selected) {
    strokeColor = '#4A6B3A';
  }

  const strokeWidth = selected ? (data.strokeWidth || 3) + 1.2 : (data.strokeWidth || (isDashed ? 2 : 2.8));
  const markerId = `sketch-arrow-${id.replace(/[^a-zA-Z0-9-_]/g, '_')}`;

  const edgeStyle = {
    ...style,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: isDashed ? '5,5' : undefined,
    strokeLinecap: 'round',
    strokeLinejoin: 'miter',
    filter: isCrisp ? 'none' : 'url(#hand-drawn-filter)',
    transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
    cursor: 'pointer',
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="sketch-edge-group"
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Selected Halo Outline */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={strokeWidth + 5}
          strokeOpacity={0.45}
          strokeLinecap="round"
        />
      )}

      {/* Invisible wider stroke path for easy hovering and selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />

      {/* Visible Edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyle}
        markerEnd={hasArrow ? `url(#${markerId})` : undefined}
      />
    </g>
  );
}
