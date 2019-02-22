import getImagePixelSpacingFromImagePath from './../../utils/getImagePixelSpacingFromImagePath';

const displayFunction = data => {
  updateMeasurementsData(data);
  let lengthValue = '';
  if (data.length) {
    lengthValue = data.length.toFixed(2) + ' mm';
  }
  return lengthValue;
};

// TODO: once cornerstoneTools start updating the measurementData on
// cornerstoneToolsmeasurementModified
const updateMeasurementsData = data => {
  const { imagePath } = data;
  const {
    colPixelSpacing,
    rowPixelSpacing
  } = getImagePixelSpacingFromImagePath(imagePath);

  const {
    handles: {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY }
    }
  } = data;

  const dx = (endX - startX) * (colPixelSpacing || 1);
  const dy = (endY - startY) * (rowPixelSpacing || 1);

  // Calculate the length, and create the text variable with the millimeters or pixels suffix
  data.length = Math.sqrt(dx * dx + dy * dy);
};

export const length = {
  id: 'Length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Length',
  options: {
    measurementTable: {
      displayFunction
    }
  }
};
