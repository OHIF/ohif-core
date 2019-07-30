const displayFunction = data => {
  let lengthValue = '';
  const { length, suffix } = data;
  if (length) {
    lengthValue = length.toFixed(2) + suffix;
  }
  return lengthValue;
};

export const length = {
  id: 'Length',
  name: 'Length',
  toolGroup: 'allTools',
  cornerstoneToolType: 'Length',
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
