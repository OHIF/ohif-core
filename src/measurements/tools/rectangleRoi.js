const displayFunction = data => {
  let meanValue = '';
  const { cachedStats, unit } = data;
  if (cachedStats && cachedStats.mean) {
    meanValue = `${cachedStats.mean.toFixed(2)} ${unit}`;
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
