import { OHIF } from '../../index';

const configuration = {};

const TIMEPOINT_TYPE_NAMES = {
  prebaseline: 'Pre-Baseline',
  baseline: 'Baseline',
  followup: 'Follow-up'
};

export default class TimepointApi {
  static setConfiguration(config) {
    Object.assign(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  constructor(store, currentTimepointId, options = {}) {
    this.store = store;
    this.currentTimepointId = currentTimepointId;
    this.comparisonTimepointKey = options.comparisonTimepointKey || 'baseline';
    this.options = options;
    this.timepoints = [];
  }

  calculateVisitNumber(timepoint) {
    // Retrieve all of the relevant follow-up timepoints for this patient
    const sortedTimepoints = this.timepoints.sort((tp1, tp2) => {
      return tp1.visitDate > tp2.visitDate ? 1 : -1;
    });
    const filteredTimepoints = sortedTimepoints.find(
      tp =>
        tp.patientId === timepoint.patientId &&
        tp.timepointType === timepoint.timepointType
    );

    // Create an array of just timepointIds, so we can use indexOf
    // on it to find the current timepoint's relative position
    const timepointIds = filteredTimepoints.map(
      timepoint => timepoint.timepointId
    );

    // Calculate the index of the current timepoint in the array of all
    // relevant follow-up timepoints
    const visitNumber = timepointIds.indexOf(timepoint.timepointId) + 1;

    // If visitNumber is 0, it means that the current timepoint was not in the list
    if (!visitNumber) {
      throw new Error(
        'Current timepoint was not in the list of relevant timepoints?'
      );
    }

    return visitNumber;
  }

  retrieveTimepoints(filter) {
    const retrievalFn = configuration.dataExchange.retrieve;
    if (typeof retrievalFn !== 'function') {
      OHIF.log.error('Timepoint retrieval function has not been configured.');
      return;
    }

    return new Promise((resolve, reject) => {
      retrievalFn(filter)
        .then(timepointData => {
          OHIF.log.info('Timepoint data retrieval');

          timepointData.forEach(timepoint => {
            const timepointIndex = this.timepoints.findIndex(
              tp => tp.timepointId === timepoint.timepointId
            );
            if (timepointIndex < 0) {
              this.timepoints.push(timepoint);
            } else {
              this.timepoints[timepointIndex] = timepoint;
            }
          });

          // Update redux state
          this.store.dispatch({
            type: 'SET_TIMEPOINTS',
            timepoints: this.timepoints
          });

          resolve();
        })
        .catch(reason => {
          OHIF.log.error(`Timepoint retrieval function failed: ${reason}`);
          reject(reason);
        });
    });
  }

  storeTimepoints() {
    const storeFn = configuration.dataExchange.store;
    if (typeof storeFn !== 'function') {
      OHIF.log.error('Timepoint store function has not been configured.');
      return;
    }

    OHIF.log.info('Preparing to store timepoints');
    OHIF.log.info(JSON.stringify(this.timepoints, null, 2));

    storeFn(this.timepoints).then(() =>
      OHIF.log.info('Timepoint storage completed')
    );
  }

  disassociateStudy(timepointIds, studyInstanceUid) {
    const disassociateFn = configuration.dataExchange.disassociate;
    if (typeof disassociateFn !== 'function') {
      OHIF.log.error('Study disassociate function has not been configured.');
      return;
    }

    disassociateFn(timepointIds, studyInstanceUid).then(() => {
      OHIF.log.info('Disassociation completed');

      this.timepoints = [];
      this.retrieveTimepoints({});
    });
  }

  removeTimepoint(timepointId) {
    const removeFn = configuration.dataExchange.remove;
    if (typeof removeFn !== 'function') {
      OHIF.log.error('Timepoint remove function has not been configured.');
      return;
    }

    const timepointData = {
      timepointId
    };

    OHIF.log.info('Preparing to remove timepoint');
    OHIF.log.info(JSON.stringify(timepointData, null, 2));

    removeFn(timepointData).then(() => {
      OHIF.log.info('Timepoint removal completed');

      const tpIndex = this.timepoints.findIndex(
        tp => tp.timepointId === timepointId
      );
      if (tpIndex > -1) {
        this.timepoints.splice(tpIndex, 1);
      }

      // Update redux state
      this.store.dispatch({
        type: 'SET_TIMEPOINTS',
        timepoints: this.timepoints
      });
    });
  }

  updateTimepoint(timepointId, query) {
    const updateFn = configuration.dataExchange.update;
    if (typeof updateFn !== 'function') {
      OHIF.log.error('Timepoint update function has not been configured.');
      return;
    }

    const timepointData = {
      timepointId
    };

    OHIF.log.info('Preparing to update timepoint');
    OHIF.log.info(JSON.stringify(timepointData, null, 2));
    OHIF.log.info(JSON.stringify(query, null, 2));

    updateFn(timepointData, query).then(() => {
      OHIF.log.info('Timepoint updated completed');

      const tpIndex = this.timepoints.findIndex(
        tp => tp.timepointId === timepointId
      );
      if (tpIndex > -1) {
        this.timepoints[tpIndex] = Object.assign(
          {},
          this.timepoints[tpIndex],
          query
        );
      }

      // Update redux state
      this.store.dispatch({
        type: 'SET_TIMEPOINTS',
        timepoints: this.timepoints
      });
    });
  }

  // Return all timepoints
  all() {
    return this.timepoints.sort((tp1, tp2) => {
      return tp1.visitDate < tp2.visitDate ? 1 : -1;
    });
  }

  // Return only the current timepoint
  current() {
    return this.timepoints.find(
      tp => tp.timepointId === this.currentTimepointId
    );
  }

  lock() {
    const tpIndex = this.timepoints.findIndex(
      tp => tp.timepointId === this.currentTimepointId
    );
    if (tpIndex < 0) {
      return;
    }

    this.timepoints[tpIndex] = Object.assign({}, this.timepoints[tpIndex], {
      locked: true
    });
  }

  // Return the prior timepoint
  prior() {
    const current = this.current();
    if (!current) {
      return;
    }

    return this.all().find(tp => tp.visitDate < current.visitDate);
  }

  // Return only the current and prior timepoints
  currentAndPrior() {
    const timepoints = [];

    const current = this.current();
    if (current) {
      timepoints.push(current);
    }

    const prior = this.prior();
    if (current && prior && prior.timepointId !== current.timepointId) {
      timepoints.push(prior);
    }

    return timepoints;
  }

  // Return the current and the comparison timepoints
  currentAndComparison(comparisonTimepointKey = this.comparisonTimepointKey) {
    const current = this.current();
    const comparisonTimepoint = this.comparison(comparisonTimepointKey);
    const timepoints = [current];

    if (
      comparisonTimepoint &&
      !timepoints.find(tp => tp.timepointId === comparisonTimepoint.timepointId)
    ) {
      timepoints.push(comparisonTimepoint);
    }

    return timepoints;
  }

  /**
   * Return true if there are 2 or more baseline timepoints before and at the current timepoint, otherwise false
   * @returns {boolean}
   */
  isRebaseline(timepointId) {
    const current = timepointId
      ? this.timepoints.find(tp => tp.timepointId === timepointId)
      : this.current();
    if (!current) {
      return false;
    }

    const baselines = this.timepoints.filter(
      tp => tp.timepointType === 'baseline' && tp.visitDate <= current.visitDate
    );
    return baselines.length > 1;
  }

  /**
   * Return the next (closest future) baseline after current timepoint
   * @returns {*}
   */
  nextBaselineAfterCurrent() {
    let current = this.current();

    //  Get all next timepoints newer than the current timepoint sorted by visitDate ascending
    const sortedTimepoints = this.timepoints.sort((tp1, tp2) => {
      return tp1.visitDate > tp2.visitDate ? 1 : -1;
    });
    return sortedTimepoints.find(
      tp => tp.visitDate > current.visitDate && tp.timepointType === 'baseline'
    );
  }

  /**
   * Set the current timepoint id
   * @param timepointId
   */
  setCurrentTimepointId(timepointId) {
    this.currentTimepointId = timepointId;
  }

  /**
   * Set the comparison timepoint that overrides the default comparison timepoint (called based on user selection in a viewport)
   * @param timepoint
   */
  setUserComparison(timepoint) {
    this.userComparison = timepoint;
  }

  /**
   * Return only the comparison timepoint
   * @param {String} [comparisonTimepointKey]
   * @return {*}
   */
  comparison(comparisonTimepointKey = this.comparisonTimepointKey) {
    // Return the comparison timepoint set by user if exists
    if (this.userComparison) {
      return this.userComparison;
    }

    const current = this.current();
    if (!current) {
      return;
    }

    // If current timepoint is prebaseline, the first (closest future) BL after current is comparison regardless of default comparison timepoint
    if (current.timepointType === 'prebaseline') {
      const nextBaselineAfterCurrent = this.nextBaselineAfterCurrent();
      // If there is a next baseline, make it comparison, otherwise comparison is done by default comparison timepoint
      if (nextBaselineAfterCurrent) {
        return nextBaselineAfterCurrent;
      }
    }

    // If current timepoint is baseline, the prior is comparison if exists regardless of default comparison timepoint
    if (current.timepointType === 'baseline') {
      const prior = this.prior();
      if (prior) {
        return prior;
      }
    }

    const comparison = this[comparisonTimepointKey]();

    // Do not return a comparison if it would be identical to
    // the current.
    if (comparison && comparison.timepointId === current.timepointId) {
      return;
    }

    return comparison;
  }

  /**
   * Return the latest initial (prebaseline or baseline) timepoint after current and before the next followup timepoint
   * @returns {*}
   */
  latestInitialTimepointAfterCurrent() {
    let currentTimepoint = this.current();

    //  Skip if the current timepoint is FU since there is no initial timepoint after follow-up
    if (currentTimepoint.timepointType === 'followup') {
      return;
    }

    //  Get all next timepoints newer than the current timepoint sorted by visitDate ascending
    const sortedTimepoints = this.timepoints.sort((tp1, tp2) => {
      return tp1.visitDate > tp2.visitDate ? 1 : -1;
    });
    const allNextTimepoints = sortedTimepoints.filter(
      tp => tp.visitDate > currentTimepoint.visitDate
    );

    const nextFollowupIndex = allNextTimepoints.findIndex(
      tp => tp.timepointType === 'followup'
    );
    const latestInitialBeforeNextFUIndex = nextFollowupIndex - 1;

    if (latestInitialBeforeNextFUIndex < 0) {
      //  There is no FU and all next timepoints are initial, so return the last one
      return allNextTimepoints[allNextTimepoints.length - 1];
    }

    //  Return the latest initial timepoint before the next FU
    return allNextTimepoints[latestInitialBeforeNextFUIndex];
  }

  /**
   * Return timepoint ids of initial timepoints which are prebaseline and baseline
   * @returns {*}
   */
  initialTimepointIds() {
    let timepointToCheck = this.current();

    //  If the current timepoint is PBL or BL, then get the recent PBL/BL of the current timepoint by its first FU
    //      If it does not exist, then there is no newer initial timepoint, so the current timepoint is used to determine initial timepoint ids
    if (
      timepointToCheck.timepointType === 'prebaseline' ||
      timepointToCheck.timepointType === 'baseline'
    ) {
      timepointToCheck =
        this.latestInitialTimepointAfterCurrent() || timepointToCheck;
    }

    const visitDateToCheck = timepointToCheck.visitDate;

    const preBaselineTimepointIds = this.timepoints
      .find(
        tp =>
          tp.timepointType === 'prebaseline' && tp.visitDate <= visitDateToCheck
      )
      .map(timepoint => timepoint.timepointId);

    const baselineTimepointIds = this.timepoints
      .find(
        tp =>
          tp.timepointType === 'baseline' && tp.visitDate <= visitDateToCheck
      )
      .map(timepoint => timepoint.timepointId);

    return preBaselineTimepointIds.concat(baselineTimepointIds);
  }

  // Return only the baseline timepoint
  baseline() {
    const currentVisitDate = this.current().visitDate;
    return this.all().find(
      tp => tp.timepointType === 'baseline' && tp.visitDate <= currentVisitDate
    );
  }

  /**
   * Return only the nadir timepoint. Must be prior to the current timepoint
   * @return {any}
   */
  nadir() {
    const current = this.current();
    const nadir = this.all().find(
      tp =>
        tp.timepointId !== current.timepointId &&
        tp.timepointKey === 'nadir' &&
        tp.visitDate <= current.visitDate
    );

    // If we have found a nadir, return that
    if (nadir) {
      return nadir;
    }

    // Otherwise, return the most recent baseline
    // This should only happen if we are only at FU1,
    // so the baseline is the nadir.
    return this.baseline();
  }

  // Return only the key timepoints (current, prior, nadir and baseline)
  key() {
    const result = [this.current()];
    const prior = this.prior();
    const nadir = this.nadir();
    const baseline = this.baseline();

    const resultIncludes = timepoint =>
      !!result.find(x => x.timepointId === timepoint.timepointId);

    if (prior && resultIncludes(prior) === false) {
      result.push(prior);
    }

    if (nadir && resultIncludes(nadir) === false) {
      result.push(nadir);
    }

    if (baseline && resultIncludes(baseline) === false) {
      result.push(baseline);
    }

    return result;
  }

  // Return only the timepoints for the given study
  study(studyInstanceUid) {
    return this.all().filter(timepoint =>
      timepoint.studyInstanceUids.includes(studyInstanceUid)
    );
  }

  // Return the timepoint's name
  name(timepoint) {
    const timepointTypeName = TIMEPOINT_TYPE_NAMES[timepoint.timepointType];

    // Check if this is a Baseline timepoint, if it is, return 'Baseline'
    if (timepoint.timepointType === 'baseline') {
      return 'Baseline';
    } else if (timepoint.visitNumber) {
      return `${timepointTypeName} ${timepoint.visitNumber}`;
    }

    const visitNumber = this.calculateVisitNumber(timepoint);

    // Return the timepoint name as 'Follow-up N'
    return `${timepointTypeName} ${visitNumber}`;
  }

  // Build the timepoint title based on its date
  title(timepoint) {
    const timepointName = this.name(timepoint);

    const all = this.all();
    let index = -1;
    let currentIndex = null;
    for (let i = 0; i < all.length; i++) {
      const currentTimepoint = all[i];

      // Skip the iterations until we can't find the selected timepoint on study list
      if (this.currentTimepointId === currentTimepoint.timepointId) {
        currentIndex = 0;
      }

      if (currentIndex !== null) {
        index = currentIndex++;
      }

      // Break the loop if reached the timepoint to get the title
      if (currentTimepoint.timepointId === timepoint.timepointId) {
        break;
      }
    }

    const states = {
      0: ['Current'],
      1: ['Prior']
    };
    const parenthesis = states[index] || [];
    const nadir = this.nadir();

    if (nadir && nadir.timepointId === timepoint.timepointId) {
      parenthesis.push('Nadir');
    }

    let parenthesisText = '';
    if (parenthesis.length) {
      parenthesisText = `(${parenthesis.join(', ')})`;
    }

    return `${timepointName} ${parenthesisText}`;
  }
}
