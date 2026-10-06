// Main entry point for package / module consumption
import App, { DiagramCanvas } from './App';
import './index.css';

export { DiagramCanvas, App };
export { default as HandDrawnDiagramCanvas } from './App';
export { default as SketchDiagram } from './App';

// Templates Registry
export { TEMPLATES, getTemplateById } from './templates/templateRegistry';

// Layout & Styling Utilities
export {
  generateId,
  applyThemeToDiagram,
  calculateRadialMindmapLayout,
  calculateCorporateOrgLayout,
  DOODLE_PRESETS,
} from './utils/sketchUtils';

// Node & Edge Components
export { default as SketchEdge } from './components/edges/SketchEdge';
export { default as RootNode } from './components/nodes/RootNode';
export { default as BranchNode } from './components/nodes/BranchNode';
export { default as SubNode } from './components/nodes/SubNode';
export { default as DoodleNode } from './components/nodes/DoodleNode';
export { default as ProcessNode } from './components/nodes/flowchart/ProcessNode';
export { default as DecisionNode } from './components/nodes/flowchart/DecisionNode';
export { default as TerminalNode } from './components/nodes/flowchart/TerminalNode';
export { default as HeaderNode } from './components/nodes/flowchart/HeaderNode';
export { default as CorporateOrgNode } from './components/nodes/corporate/CorporateOrgNode';
export { default as PastelNode } from './components/nodes/pastel/PastelNode';
export { default as MilestoneNode } from './components/nodes/milestone/MilestoneNode';
export { default as PaperPlaneNode } from './components/nodes/milestone/PaperPlaneNode';
export { default as WaypointNode } from './components/nodes/milestone/WaypointNode';

// UI Components
export { default as Toolbar } from './components/Toolbar';
export { default as DoodleDrawer } from './components/DoodleDrawer';
export { default as HelpModal } from './components/HelpModal';

export default App;
