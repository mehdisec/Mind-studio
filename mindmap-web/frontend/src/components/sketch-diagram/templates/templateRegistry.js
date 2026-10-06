import { milestoneTemplate } from './milestoneTemplate';
import { corporateOrgTemplate } from './corporateOrgTemplate';
import { pastelMindmapTemplate } from './pastelMindmapTemplate';
import { flowchartTemplate } from './flowchartTemplate';
import { mindmapTemplate } from './mindmapTemplate';

/**
 * Extensible Template Registry
 * To add a new template in the future, simply import it and add it to the TEMPLATES array.
 */
export const TEMPLATES = [
  pastelMindmapTemplate,
  milestoneTemplate,
  corporateOrgTemplate,
  flowchartTemplate,
  mindmapTemplate,
];

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function registerNewTemplate(templateDef) {
  if (!TEMPLATES.find((t) => t.id === templateDef.id)) {
    TEMPLATES.push(templateDef);
  }
}
