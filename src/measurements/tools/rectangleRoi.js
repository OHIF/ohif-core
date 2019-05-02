const displayFunction = data => {
  let meanValue = ''
  if (data.meanStdDev && data.meanStdDev.mean) {
    meanValue = data.meanStdDev.mean.toFixed(2) + ' HU'
  }
  return meanValue
}

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
}
