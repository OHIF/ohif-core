import { length } from '../tools/length';
import { ellipse } from '../tools/ellipse';

export const temp = {
  id: 'temp',
  name: 'Temporary',
  childTools: [length, ellipse],
  options: {
    caseProgress: {
      include: false,
      evaluate: false
    }
  }
};
