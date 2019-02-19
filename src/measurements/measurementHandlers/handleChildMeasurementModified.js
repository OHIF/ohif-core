import { MeasurementApi } from '../classes';
import log from '../../log';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurementData } = eventData;

  const collection = measurementApi.tools[tool.parentTool];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  log.info('CornerstoneToolsMeasurementModified');

  const measurement = collection.find(t => t._id === measurementData._id);
  const childMeasurement = measurement && measurement[tool.attribute];

  // Stop here if the measurement is already deleted
  if (!childMeasurement) return;

  // Update the collection data with the cornerstone measurement data
  const ignoredKeys = ['location', 'description', 'response'];
  Object.keys(measurementData).forEach(key => {
    if (ignoredKeys.includes(key)) return;
    childMeasurement[key] = measurementData[key];
  });

  // Populate Viewport with the Cornerstone Viewport
  childMeasurement.viewport = cornerstone.getViewport(eventData.element);

  // Update the parent measurement
  measurement[tool.attribute] = childMeasurement;
  measurementApi.updateMeasurement(tool.parentTool, measurement);

  // TODO: This is very hacky, but will work for now
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
