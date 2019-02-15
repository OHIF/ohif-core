import { bidirectional, targetCR, targetUN } from '../tools';

export const targets = {
  id: 'targets',
  name: 'Targets',
  childTools: [bidirectional, targetCR, targetUN],
  options: {
    caseProgress: {
      include: true,
      evaluate: true
    }
  }
};
