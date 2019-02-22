import getImagePixelSpacingFromImagePath from './../../utils/getImagePixelSpacingFromImagePath';

const displayFunction = data => {
  updateMeasurementsData(data);
  if (data.shortestDiameter) {
    // TODO: Make this check criteria again to see if we should display shortest x longest
    return data.longestDiameter + ' x ' + data.shortestDiameter;
  }

  return data.longestDiameter;
};

// TODO: once cornerstoneTools start updating the measurementData on
// cornerstoneToolsmeasurementModified
const updateMeasurementsData = data => {
  const { imagePath } = data;
  const {
    colPixelSpacing,
    rowPixelSpacing
  } = getImagePixelSpacingFromImagePath(imagePath);

  const { start, end, perpendicularStart, perpendicularEnd } = data.handles;
  // Calculate the long axis length
  const dx = (start.x - end.x) * (colPixelSpacing || 1);
  const dy = (start.y - end.y) * (rowPixelSpacing || 1);
  let length = Math.sqrt(dx * dx + dy * dy);

  // Calculate the short axis length
  const wx =
    (perpendicularStart.x - perpendicularEnd.x) * (colPixelSpacing || 1);
  const wy =
    (perpendicularStart.y - perpendicularEnd.y) * (rowPixelSpacing || 1);
  let width = Math.sqrt(wx * wx + wy * wy);

  if (!width) {
    width = 0;
  }

  // Length is always longer than width
  if (width > length) {
    const tempW = width;
    const tempL = length;

    length = tempW;
    width = tempL;
  }

  // Set measurement values to be use externaly
  data.longestDiameter = length.toFixed(1);
  data.shortestDiameter = width.toFixed(1);
};

export const bidirectional = {
  id: 'bidirectional',
  name: 'Target',
  toolGroup: 'allTools',
  cornerstoneToolType: 'bidirectional',
  options: {
    measurementTable: {
      displayFunction
    },
    caseProgress: {
      include: true,
      evaluate: true
    }
  }
};
