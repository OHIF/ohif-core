import * as tools from '../tools';

const childTools = [];
Object.keys(tools).forEach(key => childTools.push(tools[key]));

export const allTools = {
  id: 'allTools',
  name: 'Mesurements',
  childTools: childTools,
  options: {
    caseProgress: {
      include: false,
      evaluate: false
    }
  }
};
