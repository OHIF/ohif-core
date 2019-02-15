export const nonTarget = {
  id: 'nonTarget',
  name: 'Non-Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'nonTarget',
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
