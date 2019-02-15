import { allTools } from './toolGroups/allTools';

const ohifTools = [allTools];

ohifTools.forEach(toolGroup => {
  toolGroup.childTools.forEach(tool => {
    tool.toolGroup = toolGroup.id;
  });
});

export default ohifTools;
