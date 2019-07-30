const displayFunction = data => {
  let meanValue = '';
  const { cachedStats, suffix } = data;
  if (cachedStats && cachedStats.mean) {
    meanValue = cachedStats.mean.toFixed(2) + suffix;
  }
  return meanValue;
};

export const ellipticalRoi = {
  id: 'EllipticalRoi',
  name: 'Ellipse',
  toolGroup: 'allTools',
  cornerstoneToolType: 'EllipticalRoi',
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
