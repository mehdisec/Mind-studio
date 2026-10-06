declare module '../sketch-diagram/App' {
  import React from 'react';
  
  export interface HandDrawnDiagramCanvasProps {
    initialNodes?: any[];
    initialEdges?: any[];
    onStateChange?: (state: { nodes: any[]; edges: any[] }) => void;
  }

  const HandDrawnDiagramCanvas: React.FC<HandDrawnDiagramCanvasProps>;
  export default HandDrawnDiagramCanvas;
}
