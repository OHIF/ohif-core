import getDescription from '../lib/getDescription';
import log from '../../log';

const configuration = {};

export default class MeasurementApi {
  static Instance;

  static setConfiguration(config) {
    Object.assign(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  static getToolsGroupsMap() {
    const toolsGroupsMap = {};
    configuration.measurementTools.forEach(toolGroup => {
      toolGroup.childTools.forEach(
        tool => (toolsGroupsMap[tool.id] = toolGroup.id)
      );
    });

    return toolsGroupsMap;
  }

  static getToolGroupTools(toolsGroupsMap) {
    const result = {};
    Object.keys(toolsGroupsMap).forEach(toolType => {
      const toolGroupId = toolsGroupsMap[toolType];
      if (!result[toolGroupId]) {
        result[toolGroupId] = [];
      }

      result[toolGroupId].push(toolType);
    });

    return result;
  }

  static getToolConfiguration(toolType) {
    const configuration = MeasurementApi.getConfiguration();
    const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();

    const toolGroupId = toolsGroupsMap[toolType];
    const toolGroup = configuration.measurementTools.find(
      toolGroup => toolGroup.id === toolGroupId
    );

    let tool;
    if (toolGroup) {
      tool = toolGroup.childTools.find(tool => tool.id === toolType);
    }

    return {
      toolGroupId,
      toolGroup,
      tool
    };
  }

  static isToolIncluded(tool) {
    return (
      tool.options &&
      tool.options.caseProgress &&
      tool.options.caseProgress.include
    );
  }

  constructor(timepointApi, options = {}) {
    if (MeasurementApi.Instance) {
      MeasurementApi.Instance.initialize(timepointApi, options);
      return MeasurementApi.Instance;
    }

    this.initialize(timepointApi, options);
    MeasurementApi.Instance = this;
  }

  initialize(timepointApi, options = {}) {
    this.timepointApi = timepointApi;
    this.options = options;
    this.toolGroups = {};
    this.tools = {};
    this.toolsGroupsMap = MeasurementApi.getToolsGroupsMap();
    this.toolGroupTools = MeasurementApi.getToolGroupTools(this.toolsGroupsMap);

    // Iterate over each tool group and create collection
    configuration.measurementTools.forEach(toolGroup => {
      this.toolGroups[toolGroup.id] = [];

      // Iterate over each tool group child tools (e.g. bidirectional, targetCR, etc.) and create collection
      toolGroup.childTools.forEach(tool => {
        this.tools[tool.id] = [];
      });
    });
  }

  onMeasurementsUpdated() {
    if (typeof this.options.onMeasurementsUpdated !== 'function') {
      log.warn('MEasurements update callback is not defined');
      return;
    }

    this.options.onMeasurementsUpdated(Object.assign({}, this.toolGroups));
  }

  calculateLesionNamingNumber(measurements) {
    const sortedMeasurements = measurements.sort((a, b) => {
      if (a.lesionNamingNumber > b.lesionNamingNumber) {
        return 1;
      } else if (a.lesionNamingNumber < b.lesionNamingNumber) {
        return -1;
      }

      return 0;
    });

    //  Calculate lesion naming number starting from 1 not to miss any measurement (as seen in MM)
    //      A measurement from beginning of the list might be deleted, so a new measurement should replace that
    let i;
    for (i = 1; i < sortedMeasurements.length + 1; i++) {
      if (i < sortedMeasurements[i - 1].lesionNamingNumber) {
        break;
      }
    }

    return i;
  }

  fetch(toolGroupId, filter) {
    if (!this.toolGroups[toolGroupId]) {
      throw new Error(
        `MeasurementApi: No Collection with the id: ${toolGroupId}`
      );
    }

    const items = this.toolGroups[toolGroupId].filter(filter);
    return items.map(item => {
      if (item.toolId) {
        return this.tools[item.toolId].find(
          tool => tool._id === item.toolItemId
        );
      }

      return { lesionNamingNumber: item.lesionNamingNumber };
    });
  }

  lesionExistsAtTimepoints(lesionNamingNumber, toolGroupId, timepointIds) {
    // Retrieve all the data for the given tool group (e.g. 'targets')
    const measurementsAtTimepoint = this.fetch(toolGroupId, tool =>
      timepointIds.includes(tool.timepointId)
    );

    // Return whether or not any lesion at this timepoint has the same lesionNamingNumber
    return !!measurementsAtTimepoint.find(
      m => m.lesionNamingNumber === lesionNamingNumber
    );
  }

  isNewLesionsMeasurement(measurementData) {
    if (!measurementData) {
      return;
    }

    const toolConfig = MeasurementApi.getToolConfiguration(
      measurementData.toolType
    );
    const toolType = toolConfig.tool.parentTool || measurementData.toolType;
    const { timepointApi } = this;
    const currentMeasurement = this.tools[toolType].find(
      tool => tool._id === measurementData._id
    );
    const timepointId =
      currentMeasurement.timepointId || measurementData.timepointId;
    const lesionNamingNumber =
      currentMeasurement.lesionNamingNumber ||
      measurementData.lesionNamingNumber;

    // Stop here if the needed information is not set
    if (!timepointApi || !timepointId || !toolConfig) {
      return;
    }

    const { toolGroupId } = toolConfig;
    const current = timepointApi.timepoints.find(
      tp => tp.timepointId === timepointId
    );
    const initialTimepointIds = timepointApi.initialTimepointIds();

    // Stop here if there's no initial timepoint, or if the current is any initial
    if (
      !initialTimepointIds ||
      initialTimepointIds.length < 1 ||
      initialTimepointIds.some(
        initialtpid => initialtpid === current.timepointId
      )
    ) {
      return false;
    }

    return (
      this.lesionExistsAtTimepoints(
        lesionNamingNumber,
        toolGroupId,
        initialTimepointIds
      ) === false
    );
  }

  calculateLesionMaxMeasurementNumber(groupId, filter) {
    const sortedMeasurements = this.toolGroups[groupId]
      .filter(filter)
      .sort((tp1, tp2) => {
        return tp1.measurementNumber < tp2.measurementNumber ? 1 : -1;
      });

    for (let i = 0; i < sortedMeasurements.length; i++) {
      const toolGroupMeasurement = sortedMeasurements[i];
      const measurement = this.tools[toolGroupMeasurement.toolId].find(
        tool => tool._id === toolGroupMeasurement.toolItemId
      );
      const isNew = this.isNewLesionsMeasurement(measurement);
      if (!isNew) {
        return measurement.measurementNumber;
      }
    }

    return 0;
  }

  calculateNewLesionMaxMeasurementNumber(groupId, filter) {
    const sortedMeasurements = this.toolGroups[groupId]
      .filter(filter)
      .sort((tp1, tp2) => {
        return tp1.measurementNumber < tp2.measurementNumber ? 1 : -1;
      });

    for (let i = 0; i < sortedMeasurements.length; i++) {
      const toolGroupMeasurement = sortedMeasurements[i];
      const measurement = this.tools[toolGroupMeasurement.toolId].find(
        tool => tool._id === toolGroupMeasurement.toolItemId
      );
      const isNew = this.isNewLesionsMeasurement(measurement);
      if (isNew) {
        return measurement.measurementNumber;
      }
    }

    return 0;
  }

  calculateMeasurementNumber(measurement) {
    const toolGroupId = this.toolsGroupsMap[measurement.toolType];

    const filter = tool => tool._id !== measurement._id;

    const isNew = this.isNewLesionsMeasurement(measurement);

    if (isNew) {
      const maxTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      const maxNonTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'nonTargets',
        filter
      );
      const maxNewTargetMeasurementNumber = this.calculateNewLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      if (toolGroupId === 'targets') {
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber,
          maxNewTargetMeasurementNumber
        );
      } else if (toolGroupId === 'nonTargets') {
        const maxNewNonTargetMeasurementNumber = this.calculateNewLesionMaxMeasurementNumber(
          'nonTargets',
          filter
        );
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber,
          maxNewTargetMeasurementNumber,
          maxNewNonTargetMeasurementNumber
        );
      }
    } else {
      const maxTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
        'targets',
        filter
      );
      if (toolGroupId === 'targets') {
        return maxTargetMeasurementNumber;
      } else if (toolGroupId === 'nonTargets') {
        const maxNonTargetMeasurementNumber = this.calculateLesionMaxMeasurementNumber(
          'nonTargets',
          filter
        );
        return Math.max(
          maxTargetMeasurementNumber,
          maxNonTargetMeasurementNumber
        );
      }
    }

    return 0;
  }

  getPreviousMeasurement(measurementData) {
    if (!measurementData) {
      return;
    }

    const { timepointId, toolType, lesionNamingNumber } = measurementData;
    if (!timepointId || !toolType || !lesionNamingNumber) {
      return;
    }

    const toolGroupId = this.toolsGroupsMap[measurementData.toolType];

    // TODO: Remove TrialPatientLocationUid from here and override it somehow
    // by dependant applications. Here we should use the location attribute instead of the uid
    let filter;
    const uid =
      measurementData.additionalData &&
      measurementData.additionalData.TrialPatientLocationUid;
    if (uid) {
      filter = tool =>
        tool._id !== measurementData._id &&
        tool.additionalData &&
        tool.additionalData.TrialPatientLocationUid === uid;
    } else {
      filter = tool =>
        tool._id !== measurementData._id &&
        tool.lesionNamingNumber === lesionNamingNumber;
    }

    const childToolTypes = this.toolGroupTools[toolGroupId];
    for (let i = 0; i < childToolTypes.length; i++) {
      const childToolType = childToolTypes[i];
      const toolCollection = this.tools[childToolType];
      const item = toolCollection.find(filter);

      if (item) {
        return item;
      }
    }
  }

  hasDuplicateMeasurementNumber(measurementData) {
    if (!measurementData) {
      return;
    }

    const { toolType, measurementNumber } = measurementData;
    if (!toolType || !measurementNumber) {
      return;
    }

    const filter = tool =>
      tool._id !== measurementData._id &&
      tool.measurementNumber === measurementData.measurementNumber;

    return configuration.measurementTools
      .filter(toolGroup => toolGroup.id !== 'temp')
      .some(toolGroup => {
        if (this.toolGroups[toolGroup.id].find(filter)) {
          return true;
        }
        return toolGroup.childTools.some(tool => {
          if (this.tools[tool.id].find(filter)) {
            return true;
          }
        });
      });
  }

  updateNumbering(collectionToUpdate, propertyFilter, propertyName, increment) {
    collectionToUpdate.filter(propertyFilter).forEach(item => {
      item[propertyName] += increment;
    });
  }

  updateMeasurementNumberForAllMeasurements(measurement, increment) {
    const filter = tool =>
      tool._id !== measurementData._id &&
      tool.measurementNumber >= measurementData.measurementNumber;

    configuration.measurementTools
      .filter(toolGroup => toolGroup.id !== 'temp')
      .forEach(toolGroup => {
        this.updateNumbering(
          this.toolGroups[toolGroup.id],
          filter,
          'measurementNumber',
          increment
        );

        toolGroup.childTools.forEach(tool => {
          this.updateNumbering(
            this.tools[tool.id],
            filter,
            'measurementNumber',
            increment
          );
        });
      });
  }

  addMeasurement(toolType, measurement) {
    const toolGroup = this.toolsGroupsMap[toolType];

    const groupCollection = this.toolGroups[toolGroup];
    const collection = this.tools[toolType];

    // Get the timepoint
    let timepoint;
    if (measurement.studyInstanceUid) {
      timepoint = this.timepointApi.study(measurement.studyInstanceUid)[0];
    } else {
      const { timepointId } = measurement;
      timepoint = this.timepointApi.timepoints.find({ timepointId }).fetch()[0];
    }

    // Preventing errors thrown when non-associated (standalone) study is opened...
    // @TODO: Make sure this logic is correct.
    if (!timepoint) return;

    // Empty Item is the lesion just added in cornerstoneTools, but does not have measurement data yet
    const emptyItem = groupCollection.find(
      groupTool =>
        !groupTool.toolId && groupTool.timepointId === timepoint.timepointId
    );

    // Set the timepointId attribute to measurement to make it easier to filter measurements by timepoint
    measurement.timepointId = timepoint.timepointId;

    // Check if the measurement data is just added by a cornerstone tool and is still empty
    if (emptyItem) {
      // Set relevant initial data and measurement number to the measurement
      measurement.lesionNamingNumber = emptyItem.lesionNamingNumber;
      measurement.measurementNumber = emptyItem.measurementNumber;

      groupCollection
        .filter(
          groupTool =>
            groupTool.timepointId === timepoint.timepointId &&
            groupTool.lesionNamingNumber === measurement.lesionNamingNumber
        )
        .forEach(groupTool => {
          groupTool.toolId = tool.id;
          groupTool.toolItemId = measurement._id;
          groupTool.createdAt = measurement.createdAt;
          groupTool.measurementNumber = measurement.measurementNumber;
        });
    } else {
      // Handle measurements not added by cornerstone tools and update its number
      const measurementsInTimepoint = groupCollection.filter(
        groupTool => groupTool.timepointId === timepoint.timepointId
      );
      measurement.lesionNamingNumber = this.calculateLesionNamingNumber(
        measurementsInTimepoint
      );
      measurement.measurementNumber =
        measurement.measurementNumber ||
        this.calculateMeasurementNumber(measurement) + 1;
    }

    // Define an update object to reflect the changes in the collection
    const updateObject = {
      timepointId: timepoint.timepointId,
      lesionNamingNumber: measurement.lesionNamingNumber,
      measurementNumber: measurement.measurementNumber
    };

    // Find the matched measurement from other timepoints
    const found = this.getPreviousMeasurement(measurement);

    // Check if a previous related meausurement was found on other timepoints
    if (found) {
      // Use the same number as the previous measurement
      measurement.lesionNamingNumber = found.lesionNamingNumber;
      measurement.measurementNumber = found.measurementNumber;

      // TODO: Remove TrialPatientLocationUid from here and override it somehow
      // by dependant applications

      // Change the update object to set the same number, additionalData,
      // location, label and description to the current measurement
      updateObject.lesionNamingNumber = found.lesionNamingNumber;
      updateObject.measurementNumber = found.measurementNumber;
      updateObject.additionalData = measurement.additionalData || {};
      updateObject.additionalData.TrialPatientLocationUid =
        found.additionalData && found.additionalData.TrialPatientLocationUid;
      updateObject.location = found.location;
      updateObject.label = found.label;
      updateObject.description = found.description;
      updateObject.isSplitLesion = found.isSplitLesion;
      updateObject.isNodal = found.isNodal;

      const description = getDescription(found, measurement);
      if (description) {
        updateObject.description = description;
      }
    } else if (this.hasDuplicateMeasurementNumber(measurement)) {
      // Update measurementNumber for the measurements with masurementNumber greater or equal than
      //  measurementNumber of the added measurement (except the added one)
      //   only if there is another measurement with the same measurementNumber
      this.updateMeasurementNumberForAllMeasurements(measurement, 1);
    }

    // Set the timepoint ID, measurement number, location and description
    const tpIndex = collection.findIndex(tool => tool._id === measurement._id);
    if (tpIndex > -1) {
      collection[tpIndex] = Object.assign(
        {},
        collection[tpIndex],
        updateObject
      );
    }

    if (!emptyItem) {
      // Reflect the entry in the tool group collection
      groupCollection.push({
        toolId: tool.id,
        toolItemId: measurement._id,
        timepointId: timepoint.timepointId,
        studyInstanceUid: measurement.studyInstanceUid,
        createdAt: measurement.createdAt,
        lesionNamingNumber: measurement.lesionNamingNumber,
        measurementNumber: measurement.measurementNumber
      });
    }

    // Let others know that the measurements are updated
    this.onMeasurementsUpdated();

    // TODO: Enable reactivity
    // this.timepointChanged.set(timepoint.timepointId);

    return measurement;
  }

  // TODO: Implement all other functions
}
