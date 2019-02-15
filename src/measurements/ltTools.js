import { targets } from './toolGroups/targets';
import { nonTargets } from './toolGroups/nonTargets';
import { temp } from './toolGroups/temp';

const ltTools = [targets, nonTargets, temp];

ltTools.forEach(toolGroup => {
  toolGroup.childTools.forEach(tool => {
    tool.toolGroup = toolGroup.id;
  });
});

export default ltTools;
