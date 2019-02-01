import { _ } from 'meteor/underscore';

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
            _.each(data.targets, target => {
                const { lesionNamingNumber } = target.measurement;
                if (target.timepoint.timepointType === 'baseline') {
                    baselinelesionNamingNumbers.push(lesionNamingNumber);
                }
            });
            _.each(data.targets, target => {
                const { lesionNamingNumber } = target.measurement;
                if (target.timepoint.timepointType === 'followup') {
                    if (!_.contains(baselinelesionNamingNumbers, lesionNamingNumber)) {
                        newTargetNumbers.add(lesionNamingNumber);
                    }
                }
            });
        }

        return newTargetNumbers;
    }

}
