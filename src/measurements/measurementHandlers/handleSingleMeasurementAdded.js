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

  // Get the related measurement by the measurement number and use its location if defined
  const relatedMeasurement = collection.find(
    t =>
      t.lesionNamingNumber === measurement.lesionNamingNumber &&
      t.toolType === measurementData.toolType &&
      t.patientId === imageAttributes.patientId
  );

  // Use the related measurement location if found and defined
  if (relatedMeasurement && relatedMeasurement.location) {
    measurement.location = relatedMeasurement.location;
  }

  // Use the related measurement description if found and defined
  if (relatedMeasurement && relatedMeasurement.description) {
    measurement.description = relatedMeasurement.description;
  }

  measurement._id = guid();
  const addedMeasurement = measurementApi.addMeasurement(toolType, measurement);

  measurementData._id = measurement._id;
  measurementData.lesionNamingNumber = addedMeasurement.lesionNamingNumber;

  // Force to repaint the measurement on image
  measurementData.invalidated = true;

  // TODO: This is very hacky, but not needed when cornerstone tools support for invalidated flag
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });

  // TODO: Notify about the last activated measurement

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
