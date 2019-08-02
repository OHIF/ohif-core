const displayFunction = data => {
  let meanValue = '';
  const { meanStdDev, unit } = data;
  if (meanStdDev && meanStdDev.mean) {
    meanValue = `${meanStdDev.mean.toFixed(2)} ${unit}`;
  }
  return meanValue;
};

export const freehandMouse = {
  id: 'FreehandMouse',
  name: 'Freehand',
  toolGroup: 'allTools',
  cornerstoneToolType: 'FreehandMouse',
  options: {
    measurementTable: {
      displayFunction,
    },
    caseProgress: {
      include: true,
      evaluate: true,
    },
  },
};
