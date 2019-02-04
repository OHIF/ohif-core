import debounce from '../../utils/debounce.js';
import { CriteriaEvaluator } from './CriteriaEvaluator';
import * as evaluations from './evaluations';
// TODO: Make sure we are exporting both APIs on ohif-core
import { timepointApi, measurementApi } from 'ohif-core';

export class ConformanceCriteria {
  /**
   * Create an instance of Conformance Criteria class
   *
   */
  constructor() {
    this.nonconformities;
    this.maxTargets;
    this.maxNewTargets;
    this.debounceTime = 300;
    this.debouncedValidate = debounce((trialCriteriaType, timepointIds) => {
      return this.validate(trialCriteriaType, timepointIds);
    }, this.debounceTime);
  }

  /**
   * Computes an array of Response Criteria non-conformities given a specific
   * trial criteria type and a timepoint ID
   *
   * @param {String} trialCriteriaType
   * @param {String} timepointId
   * @return {Promise<*[]>}
   */
  async getTimepointNonConformities(trialCriteriaType, timepointId) {
    // Find the timepoint in question
    const timepoint = timepointApi.timepoints.findOne({ timepointId });

    // If the timepoint is locked, stop here. We are skipping conformance
    // checks on locked timepoints, since they cannot be saved.
    if (timepoint.isLocked === true) {
      return;
    }

    // Retrieve the measurement data for the specific timepoint
    const types = ['targets', 'nonTargets'];
    const measurementData = await this.getTimepointMeasurementData(
      timepointId,
      types
    );
    const { timepointType } = timepoint;

    // Run validation for this timepoint based on it's type
    let nonconformities = this.validateTimepoint(
      timepointType,
      trialCriteriaType,
      measurementData
    );

    // Run the checks specified for 'both' baseline & followup measurements
    //
    // TODO: In the future, we should change the meaning of checks specified for 'both'.
    // Currently, this means any evaluations which apply to both timepoint types. It would
    // be more sensible to have it mean evaluations which require both baseline & followup
    // measurement data.
    let resultBoth;
    if (timepointType === 'followup') {
      // At followup, run checks specified for 'both' baseline & followup on the combined
      // set of baseline/followup measurement data.
      const mergedData = this.mergeWithBaselineData(measurementData, types);

      resultBoth = this.validateTimepoint(
        'both',
        trialCriteriaType,
        mergedData
      );
    } else {
      // Otherwise, run the 'both' checks only on the baseline data
      resultBoth = this.validateTimepoint(
        'both',
        trialCriteriaType,
        measurementData
      );
    }

    // Extend the non-conformities array with any issues found in the combined validation
    nonconformities = nonconformities.concat(resultBoth);

    return nonconformities;
  }

  /**
   * Compute response criteria non-conformities for a set of timepoints
   * using a specific criteria type
   *
   * @param {String} trialCriteriaType
   * @param {Array} timepointIds An array of timepointIds
   * @return {Promise<void>}
   */
  async validate(trialCriteriaType, timepointIds) {
    // Create an array of Promises which track the computation of each timepoint's
    // non-conformities
    const tasks = timepointIds.map(timepointId => {
      return this.getTimepointNonConformities(trialCriteriaType, timepointId);
    });

    // Wait for all of the tasks to complete
    const data = await Promise.all(tasks);

    // Create a flattened array of the results of the tasks
    // and filter out any undefined values from timepoints with no errors
    const nonconformities = [].concat(...data).filter(a => a !== undefined);

    // Update the ReactiveVar to store the array of non-conformities
    this.nonconformities = nonconformities;
  }

  /**
   * Aggregate measurement data for a specific timepoint and a set of measurement types
   *
   * Notes: This will try to retrieve any study metadata for studies which are involved in
   * measurements for this timepoint.
   *
   * @param {String} timepointId
   * @param {String[]} types Array of measurement types (targets, nonTargets)
   * @return {Promise}
   */
  async getTimepointMeasurementData(timepointId, types) {
    return new Promise((resolve, reject) => {
      const data = {};
      const studyPromises = [];

      // Return empty data if timepoint is not yet loaded
      const current = timepointApi.current();
      if (!current) {
        return resolve(data);
      }

      const timepoint = timepointApi.timepoints.findOne({ timepointId });

      const fillData = measurementType => {
        const measurements = measurementApi.fetch(measurementType, {
          timepointId
        });
        measurements.forEach(measurement => {
          const { studyInstanceUid } = measurement;

          const pushMeasurementData = (metadata = null) => {
            data[measurementType].push({
              measurement,
              metadata,
              timepoint
            });
          };

          if (!studyInstanceUid) {
            pushMeasurementData();
            return;
          }

          // TODO: Add the loadStudy form OHIF-CORE instead of using old OHIF.stidues and OHIF.viewerbase

          // const promise = OHIF.studies.loadStudy(studyInstanceUid);
          // promise
          //   .then(study => {
          //     const studyMetadata = OHIF.viewerbase.getStudyMetadata(study);

          //     pushMeasurementData(studyMetadata.getFirstInstance());
          //   })
          //   .catch(() => {
          //     // In case study metadata retrieval fails, include this
          //     // measurement for response criteria evaluation anyway.
          //     pushMeasurementData();
          //   });

          //studyPromises.push(promise);
        });
      };

      types.forEach(type => {
        data[type] = [];
        fillData(type);
      });

      Promise.all(studyPromises.map(p => p.catch(() => null)))
        .then(() => {
          resolve(data);
        })
        .catch(reject);
    });
  }

  /**
   * Create a merged set of measurement data by merging a provided measurementData
   * structure with the set of measurement data retrieved from baseline.
   *
   * @param measurementData
   * @param {Array} types Types of
   * @return {{targets: Array, nonTargets: Array}}
   */
  mergeWithBaselineData(measurementData, types) {
    const baselineData = this.getBaselineMeasurementData(types);

    const mergedData = {};
    types.forEach(type => {
      const typeAtBaseline = (baselineData && baselineData[type]) || [];
      const typeAtTimepoint = (measurementData && measurementData[type]) || [];

      mergedData[type] = typeAtBaseline.concat(typeAtTimepoint);
    });

    return mergedData;
  }

  /**
   * Groups the nonconformities array by toolType and lesionNamingNumber
   *
   * Note: when the nonconformity has the isGlobal attribute set, it goes to the "globals" group
   *
   * @return {Object} Object of nonconformities grouped by toolType and lesionNamingNumber
   */
  groupNonConformities(nonconformities) {
    const groups = {};
    const toolsGroupsMap = measurementApi.toolsGroupsMap;

    nonconformities.forEach(nonConformity => {
      if (nonConformity.isGlobal) {
        groups.globals = groups.globals || { messages: [] };
        groups.globals.messages.push(nonConformity.message);

        return;
      }

      nonConformity.measurements.forEach(measurement => {
        const groupName = toolsGroupsMap[measurement.toolType];
        groups[groupName] = groups[groupName] || { lesionNamingNumbers: {} };

        const group = groups[groupName];
        const measureNumber = measurement.lesionNamingNumber;
        let lesionNamingNumbers = group.lesionNamingNumbers[measureNumber];

        if (!lesionNamingNumbers) {
          lesionNamingNumbers = group.lesionNamingNumbers[measureNumber] = {
            messages: [],
            measurements: []
          };
        }

        lesionNamingNumbers.messages.push(nonConformity.message);
        lesionNamingNumbers.measurements.push(measurement);
      });
    });

    return groups;
  }

  /**
   * Set max number of targets and new targets allowed in the conformance criteria
   *
   * @param {String} trialCriteriaType
   */
  setMaximums(trialCriteriaType) {
    const both = this.getEvaluators('both', trialCriteriaType);
    const baseline = this.getEvaluators('baseline', trialCriteriaType);
    const followup = this.getEvaluators('followup', trialCriteriaType);
    const evaluators = both.concat(baseline).concat(followup);

    let overallMaxTargets = Infinity;
    let overallMaxNewTargets = Infinity;
    evaluators.forEach(evaluator => {
      const maxTargets = evaluator.getMaxTargets(false);
      const maxNewTargets = evaluator.getMaxTargets(true);
      if (maxTargets !== undefined && maxTargets < overallMaxTargets) {
        overallMaxTargets = maxTargets;
      }

      if (maxNewTargets !== undefined && maxNewTargets < overallMaxNewTargets) {
        overallMaxNewTargets = maxNewTargets;
      }
    });

    // Prevent Infinity values from being set for max targets and new targets
    overallMaxTargets = isFinite(overallMaxTargets) ? overallMaxTargets : null;
    overallMaxNewTargets = isFinite(overallMaxNewTargets)
      ? overallMaxNewTargets
      : null;

    this.maxTargets = overallMaxTargets;
    this.maxNewTargets = overallMaxNewTargets;
  }

  /**
   * Validate a specific timepoint and its measurement data
   *
   * @param {String} timepointId
   * @param {String} trialCriteriaType
   * @param {Object[]} data
   * @return {Array}
   */
  validateTimepoint(timepointId, trialCriteriaType, data) {
    const evaluators = this.getEvaluators(timepointId, trialCriteriaType);
    let nonconformities = [];

    evaluators.forEach(evaluator => {
      const result = evaluator.evaluate(data);
      nonconformities = nonconformities.concat(result);
    });

    return nonconformities;
  }

  /**
   * Return the criteria Trial Criteria Type's evaluators for a specific timepoint type
   *
   * @param {String} timepointType Allowed values are [prebaseline, baseline, followup, both]
   */
  getEvaluators(timepointType, trialCriteriaType) {
    const evaluators = [];
    const trialCriteriaTypeId = trialCriteriaType.id.toLowerCase();
    const evaluation = evaluations[trialCriteriaTypeId];

    // Check if an evaluation was found for the given Trial Criteria Type
    if (evaluation) {
      // PWV-484 Use baseline conformance checks for pre-baseline
      // Get the evaluation definitions for the given timepoint type
      const evaluationTimepoint =
        timepointType === 'prebaseline'
          ? evaluation.baseline
          : evaluation[timepointType];

      // Add the current evaluation to evaluators if found
      if (evaluationTimepoint) {
        evaluators.push(new CriteriaEvaluator(evaluationTimepoint));
      }
    }

    return evaluators;
  }

  /**
   * Retrieve only measurement data from the most recent baseline
   *
   * @param {String[]} types Array of measurement types ('targets', 'nonTargets')
   * @return {Object} Measurement data
   */
  getBaselineMeasurementData(types) {
    const timepoint = timepointApi.baseline();
    const { timepointId } = timepoint;

    /**
     * Get the measurement data from the baseline timepoint for a specific measurement type
     *
     * @param {String} measurementType
     * @return {Array} Array of measurements
     */
    const getData = measurementType => {
      const measurements = measurementApi.fetch(measurementType, {
        timepointId
      });

      return measurements.map(measurement => {
        return {
          measurement,
          timepoint
        };
      });
    };

    // Fill an object with measurement data for each type
    const data = {};

    types.forEach(type => {
      data[type] = getData(type);
    });

    return data;
  }

  /**
   * Registers the Conformance Criteria evaluation definitions for a specific Trial Criteria Type
   *
   * @param {String} trialCriteriaTypeId
   * @param {Object|Array} evaluationDefinitions Object or Array of evaluation definitions objects
   */
  static setEvaluationDefinitions(trialCriteriaTypeId, evaluationDefinitions) {
    evaluations[trialCriteriaTypeId] = evaluationDefinitions;
  }
}

export default ConformanceCriteria;
