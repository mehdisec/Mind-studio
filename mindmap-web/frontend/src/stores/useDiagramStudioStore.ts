import { create } from 'zustand';

export type DiagramSidebarTab = 'templates' | 'shapes' | 'doodles' | 'themes' | 'export';

export interface DiagramAction {
  id: number;
  type:
    | 'selectTemplate'
    | 'changeTheme'
    | 'addShape'
    | 'addDoodle'
    | 'autoLayout'
    | 'exportPNG'
    | 'exportJSON'
    | 'importJSON'
    | 'exportMD'
    | 'importMD'
    | 'clearCanvas';
  payload?: any;
}

interface DiagramStudioStore {
  activeTemplateId: string;
  activeThemeId: string | null;
  activeTab: DiagramSidebarTab;
  pendingAction: DiagramAction | null;

  setActiveTemplateId: (id: string) => void;
  setActiveThemeId: (themeId: string | null) => void;
  setActiveTab: (tab: DiagramSidebarTab) => void;
  triggerAction: (type: DiagramAction['type'], payload?: any) => void;
  clearPendingAction: () => void;
}

export const useDiagramStudioStore = create<DiagramStudioStore>((set) => ({
  activeTemplateId: 'milestone-plane',
  activeThemeId: 'grid',
  activeTab: 'shapes',
  pendingAction: null,

  setActiveTemplateId: (id) => set({ activeTemplateId: id }),
  setActiveThemeId: (themeId) => set({ activeThemeId: themeId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  triggerAction: (type, payload) =>
    set({
      pendingAction: {
        id: Date.now() + Math.random(),
        type,
        payload,
      },
    }),
  clearPendingAction: () => set({ pendingAction: null }),
}));
