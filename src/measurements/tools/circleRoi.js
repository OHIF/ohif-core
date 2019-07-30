const displayFunction = data => {
  let meanValue = '';
  const { cachedStats, suffix } = data;
  if (cachedStats && cachedStats.mean) {
    meanValue = cachedStats.mean.toFixed(2) + suffix;
  }
  return meanValue;
};

export const circleRoi = {
  id: 'CircleRoi',
  name: 'Circle',
  toolGroup: 'allTools',
  cornerstoneToolType: 'CircleRoi',
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
