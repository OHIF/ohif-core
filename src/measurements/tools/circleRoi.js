const displayFunction = data => {
  let meanValue = '';
  const { cachedStats, unit } = data;
  if (cachedStats && cachedStats.mean) {
    meanValue = `${cachedStats.mean.toFixed(2)} ${unit}`;
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
