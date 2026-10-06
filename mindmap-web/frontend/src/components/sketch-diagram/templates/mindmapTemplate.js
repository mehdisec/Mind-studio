import { initialNodes, initialEdges } from '../data/initialData';

export const mindmapTemplate = {
  id: 'mindmap-sketch',
  name: 'Mind Map (Original)',
  nameFa: 'نقشه ذهنی دست‌ساز (مدل قبلی)',
  description: 'Original mind mapping canvas with expandable branches and hierarchical subnodes.',
  category: 'Mind Map',
  thumbnail: '🧠',
  backgroundStyle: 'grid',
  defaultNodes: initialNodes,
  defaultEdges: initialEdges,
  shapes: [
    { type: 'root', label: 'Central Root', icon: 'Sparkles' },
    { type: 'branch', label: 'Branch Node', icon: 'FolderGit2' },
    { type: 'subnode', label: 'Sub-item Node', icon: 'FileText' },
  ],
};
