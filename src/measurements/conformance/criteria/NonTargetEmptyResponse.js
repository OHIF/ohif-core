import { BaseCriterion } from './BaseCriterion';

export const NonTargetEmptyResponseSchema = {
    type: 'object'
};

/* NonTargetEmptyResponseCriterion
 *   Check if the there are non-target measurements with empty response
 */
export class NonTargetEmptyResponseCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const items = data.nonTargets;
        const measurements = [];
        let message;

        items.forEach(item => {
            const measurement = item.measurement;
            if (!measurement.response) {
                measurements.push(measurement);
            }
        });

        if (measurements.length) {
            message = 'All non-targets should have a response';
        }

        return this.generateResponse(message, measurements);
    }

}
