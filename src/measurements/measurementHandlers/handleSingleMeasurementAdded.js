import { MeasurementApi } from '../classes';
import log from '../../log';
import user from '../../user';
import getImageAttributes from '../lib/getImageAttributes';
import guid from '../../utils/guid.js';

export default function handleSingleMeasurementAdded({ eventData, tool }) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurementData, toolType } = eventData;

  const collection = measurementApi.tools[toolType];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  // Stop here if there's no measurement data or if it was cancelled
  if (!measurementData || measurementData.cancelled) return;

  log.info('CornerstoneToolsMeasurementAdded');

  const imageAttributes = getImageAttributes(eventData.element);
  const measurement = Object.assign({}, measurementData, imageAttributes, {
    lesionNamingNumber: measurementData.lesionNamingNumber,
    userId: user.getUserId(),
    toolType
  });

  // Get the related timepoint by the measurement number and use its location if defined
  const relatedTimepoint = collection.find(
    tool =>
      tool.lesionNamingNumber === measurement.lesionNamingNumber &&
      tool.toolType === measurementData.toolType &&
      tool.patientId === imageAttributes.patientId
  );

  // Use the related timepoint location if found and defined
  if (relatedTimepoint && relatedTimepoint.location) {
    measurement.location = relatedTimepoint.location;
  }

  // Use the related timepoint description if found and defined
  if (relatedTimepoint && relatedTimepoint.description) {
    measurement.description = relatedTimepoint.description;
  }

  measurement._id = guid();
  const addedMeasurement = measurementApi.addMeasurement(toolType, measurement);

  measurementData._id = measurement._id;
  measurementData.lesionNamingNumber = addedMeasurement.lesionNamingNumber;

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
