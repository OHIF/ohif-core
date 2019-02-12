export const nonTarget = {
  id: 'nonTarget',
  name: 'Non-Target',
  toolGroup: 'nonTargets',
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
