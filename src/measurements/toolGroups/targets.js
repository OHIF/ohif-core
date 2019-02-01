import { bidirectional } from '../tools/bidirectional';
import { targetCR } from '../tools/targetCR';
import { targetUN } from '../tools/targetUN';

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
