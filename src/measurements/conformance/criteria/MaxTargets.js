import { _ } from 'meteor/underscore';
import { BaseCriterion } from './BaseCriterion';

export const MaxTargetsSchema = {
    type: 'object',
    properties: {
        limit: {
            label: 'Max targets allowed in study',
            type: 'integer',
            minimum: 0
        },
        newTarget: {
            label: 'Flag to evaluate only new targets',
            type: 'boolean'
        },
        isNodal: {
            label: 'Filter to evaluate only nodal and extranodal measurements',
            type: 'boolean'
        }
    },
    required: ['limit']
};

/* MaxTargetsCriterion
 *   Check if the number of target measurements exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   newTarget: Flag to evaluate only new targets (must be evaluated on both)
 *   isNodal: Filter to evaluate only nodal or extranodal measurements
 *   message: Message to be displayed in case of nonconformity
 */
export class MaxTargetsCriterion extends BaseCriterion {

    constructor(options) {
        super(options);
    }

    evaluate(data) {
        const { options } = this;

        const newTargetNumbers = this.getNewTargetNumbers(data);
        const lesionNamingNumbers = [];
        _.each(data.targets, target => {
            const { lesionNamingNumber, isSplitLesion, isNodal } = target.measurement;
            if (isSplitLesion) return;
            if (options.newTarget && !newTargetNumbers.has(lesionNamingNumber)) return;
            if (typeof isNodal === 'boolean' && typeof options.isNodal === 'boolean' && options.isNodal !== isNodal) return;

            //  Prevent duplicates of lesionNamingNumber
            if (lesionNamingNumbers.indexOf(lesionNamingNumber) < 0) {
                lesionNamingNumbers.push(lesionNamingNumber);
            }
        });

        let message;
        if (lesionNamingNumbers.length > options.limit) {
            const increment = options.newTarget ? 'new ' : '';
            const plural = options.limit === 1 ? '' : 's';
            const amount = options.limit === 0 ? '' : ` more than ${options.limit}`;

            let lesionType = '';
            if (typeof options.isNodal === 'boolean') {
                lesionType = options.isNodal ? 'nodal ' : 'extranodal ';
            }

            message = options.message || `Response criteria does not allow for${amount} ${lesionType}${increment}target${plural}`;
        }

        return this.generateResponse(message);
    }

}
