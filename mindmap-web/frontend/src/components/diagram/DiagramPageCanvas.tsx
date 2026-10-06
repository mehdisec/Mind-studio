import React, { useMemo, useRef, useCallback } from 'react';
import { MindPage } from '../../types';
import { useGraphStore } from '../../stores/useGraphStore';
// @ts-ignore
import HandDrawnDiagramCanvas from '../sketch-diagram/App';
import '../sketch-diagram/index.css';

interface DiagramPageCanvasProps {
  page: MindPage;
}

export const DiagramPageCanvas: React.FC<DiagramPageCanvasProps> = ({ page }) => {
  const { updatePageDiagramData } = useGraphStore();
  const saveTimeoutRef = useRef<number | null>(null);

  // Parse stored diagram data if it exists
  const parsedData = useMemo(() => {
    if (!page.diagramData) return null;
    try {
      const data = typeof page.diagramData === 'string' ? JSON.parse(page.diagramData) : page.diagramData;
      return data && typeof data === 'object' ? data : null;
    } catch (err) {
      console.warn('Failed to parse page diagramData:', err);
      return null;
    }
  }, [page.diagramData]);

  // Debounced auto-save on any node/edge/template change
  const handleStateChange = useCallback(
    (diagramState: any) => {
      if (!diagramState) return;

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        const payload = JSON.stringify({
          nodes: diagramState.nodes || [],
          edges: diagramState.edges || [],
          templateId: diagramState.templateId || page.diagramType || 'pastel-mindmap',
          theme: diagramState.theme || null,
          title: diagramState.title || page.title,
        });

        // Only update if actually changed
        if (payload !== page.diagramData) {
          updatePageDiagramData(page.id, payload);
        }
      }, 600);
    },
    [page.id, page.diagramType, page.title, page.diagramData, updatePageDiagramData]
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#FAF9F5] select-none">
      <HandDrawnDiagramCanvas
        key={page.id}
        initialTemplateId={parsedData?.templateId || page.diagramType || 'pastel-mindmap'}
        initialTheme={parsedData?.theme || 'grid'}
        initialTitle={parsedData?.title || page.title}
        initialNodes={parsedData?.nodes || null}
        initialEdges={parsedData?.edges || null}
        onStateChange={handleStateChange}
      />
    </div>
  );
};
