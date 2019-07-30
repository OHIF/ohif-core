const displayFunction = data => {
  let meanValue = '';
  const { cachedStats, suffix } = data;
  if (cachedStats && cachedStats.mean) {
    meanValue = cachedStats.mean.toFixed(2) + suffix;
  }
  return meanValue;
};

export const rectangleRoi = {
  id: 'RectangleRoi',
  name: 'Rectangle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'RectangleRoi',
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
