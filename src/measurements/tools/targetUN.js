export const targetUN = {
  id: 'targetUN',
  name: 'UN Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'targetUN',
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
