export class BaseCriterion {
  constructor(options) {
    this.options = options;
  }

  generateResponse(message, measurements) {
    const passed = !message;
    const isGlobal = !measurements || !measurements.length;

    return {
      passed,
      isGlobal,
      message,
      measurements,
      newTarget: this.options.newTarget
    };
  }

  getNewTargetNumbers(data) {
    const { options } = this;
    const baselinelesionNamingNumbers = [];
    const newTargetNumbers = new Set();

    if (options.newTarget) {
      Object.keys(data.targets).forEach(key => {
        const target = data.targets[key];
        const { lesionNamingNumber } = target.measurement;
        if (target.timepoint.timepointType === 'baseline') {
          baselinelesionNamingNumbers.push(lesionNamingNumber);
        }
      });
      Object.keys(data.targets).forEach(key => {
        const target = data.targets[key];
        if (target.timepoint.timepointType === 'followup') {
          if (!baselinelesionNamingNumbers.includes(lesionNamingNumber)) {
            newTargetNumbers.add(lesionNamingNumber);
          }
        }
      });
    }

    return newTargetNumbers;
  }
}

export default BaseCriterion;
