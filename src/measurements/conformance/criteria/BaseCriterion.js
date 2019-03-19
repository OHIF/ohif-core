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
      measurements
    };
  }

  getNewTargetNumbers(data) {
    const { options } = this;
    const baselineMeasurementNumbers = [];
    const newTargetNumbers = new Set();

    if (options.newTarget) {
      data.targets.forEach(target => {
        const { measurementNumber } = target.measurement;
        if (target.timepoint.timepointType === 'baseline') {
          baselineMeasurementNumbers.push(measurementNumber);
        }
      });
      data.targets.forEach(target => {
        const { measurementNumber } = target.measurement;
        if (target.timepoint.timepointType === 'followup') {
          if (!baselineMeasurementNumbers.includes(measurementNumber)) {
            newTargetNumbers.add(measurementNumber);
          }
        }
      });
    }

    return newTargetNumbers;
  }
}
