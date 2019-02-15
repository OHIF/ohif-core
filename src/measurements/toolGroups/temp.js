import { length, ellipticalRoi } from '../tools';

export const temp = {
  id: 'temp',
  name: 'Temporary',
  childTools: [length, ellipticalRoi],
  options: {
    caseProgress: {
      include: false,
      evaluate: false
    }
  }
};
