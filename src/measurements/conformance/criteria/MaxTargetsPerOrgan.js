import BaseCriterion from './BaseCriterion';

export const MaxTargetsPerOrganSchema = {
  type: 'object',
  properties: {
    limit: {
      label: 'Max targets allowed per organ',
      type: 'integer',
      minimum: 0
    },
    newTarget: {
      label: 'Flag to evaluate only new targets',
      type: 'boolean'
    }
  },
  required: ['limit']
};

/*
 * MaxTargetsPerOrganCriterion
 *   Check if the number of target measurements per organ exceeded the limit allowed
 * Options:
 *   limit: Max targets allowed in study
 *   newTarget: Flag to evaluate only new targets (must be evaluated on both)
 */
export class MaxTargetsPerOrganCriterion extends BaseCriterion {
  constructor(options) {
    super(options);
  }

  evaluate(data) {
    const { options } = this;
    const targetsPerOrgan = {};
    let measurements = [];

    const newTargetNumbers = this.getNewTargetNumbers(data);
    Object.keys(data.targets).forEach(key => {
      const target = data.targets[key];
      const { measurement } = target;
      const {
        location,
        lesionNamingNumber,
        isSplitLesion,
        isNodal
      } = measurement;

      if (isSplitLesion) return;
      if (
        typeof isNodal === 'boolean' &&
        typeof options.isNodal === 'boolean' &&
        options.isNodal !== isNodal
      )
        return;

      // Retrieve a value for Organ Group if one exists, otherwise
      // just use the current location
      let organGroup = location;

      // TODO: Use measurements module to get this function
      // if (typeof OHIF.measurements.getOrganGroup === 'function') {
      //   organGroup = OHIF.measurements.getOrganGroup(location) || location;
      // }

      if (!targetsPerOrgan[organGroup]) {
        targetsPerOrgan[organGroup] = new Set();
      }

      if (!options.newTarget || newTargetNumbers.has(lesionNamingNumber)) {
        targetsPerOrgan[organGroup].add(lesionNamingNumber);
      }

      if (targetsPerOrgan[organGroup].size > options.limit) {
        measurements.push(measurement);
      }
    });

    let message;
    if (measurements.length) {
      const increment = options.newTarget ? 'new ' : '';
      const plural = options.limit === 1 ? '' : 's';
      const lesionType =
        typeof options.isNodal === 'boolean'
          ? options.isNodal
            ? 'nodal '
            : 'extranodal '
          : '';
      message =
        options.message ||
        `Each organ should not have more than ${
          options.limit
        } ${lesionType}${increment}target${plural}`;
    }

    return this.generateResponse(message, measurements);
  }
}
