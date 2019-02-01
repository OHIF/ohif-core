import { BaseCriterion } from './BaseCriterion';
import { OHIF } from 'meteor/ohif:core';

export const TargetTypeSchema = {
    type: 'object'
};

/* TargetTypeCriterion
 *   Check if the there are non-bidirectional target measurements on baseline
 */
export class TargetTypeCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const { timepointApi } = OHIF.viewer;
        const items = data.targets;
        const measurements = [];
        let message;

        items.forEach(item => {
            const measurement = item.measurement;

            if (measurement.toolType === 'bidirectional' || measurement.bidirectional) {
                return;
            }

            const { timepointId } = measurement;
            const timepointData = timepointApi.timepoints.findOne({ timepointId });
            if (measurement.toolType === 'targetEX' && timepointData.timepointType !== 'prebaseline' && !timepointApi.isRebaseline(timepointId)) {
                // Allow target EX for only pre-baseline, 2nd baseline and all timepoints after 2nd baseline
                measurements.push(measurement);
            } else if (timepointData.timepointType === 'baseline' && !timepointApi.isRebaseline(timepointId)) {
                // Allow target CR and UN for all timepoints other than the first baseline
                measurements.push(measurement);
            }
        });

        if (measurements.length) {
            message = 'Target lesions must have measurements (cannot be assessed as CR, UN/NE, EX)';
        }

        return this.generateResponse(message, measurements);
    }

}
