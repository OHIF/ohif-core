export const targetUN = {
  id: 'targetUN',
  name: 'UN Target',
  toolGroup: 'targets',
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
