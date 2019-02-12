import { nonTarget } from '../tools/nonTarget';

export const nonTargets = {
  id: 'nonTargets',
  name: 'Non-Targets',
  childTools: [nonTarget],
  options: {
    caseProgress: {
      include: true,
      evaluate: true
    }
  }
};
