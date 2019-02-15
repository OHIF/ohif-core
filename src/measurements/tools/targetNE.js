export const targetNE = {
  id: 'targetNE',
  name: 'NE Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'targetNE',
  options: {
    measurementTable: {
      displayFunction: data => data.response
    },
    caseProgress: {
      include: true,
      evaluate: true
    }
  }
};
