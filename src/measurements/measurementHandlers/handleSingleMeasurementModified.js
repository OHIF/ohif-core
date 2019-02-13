import { MeasurementApi } from '../classes';
import log from '../../log';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const { measurementData, toolName } = eventData;

  const collection = measurementApi.tools[toolName];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  log.info('CornerstoneToolsMeasurementModified');
  const measurement = collection.find(
    measurement => measurement._id === measurementData._id
  );

  // Stop here if the measurement is already deleted
  if (!measurement) return;

  const ignoredKeys = ['location', 'description', 'response'];
  Object.keys(measurementData).forEach(key => {
    if (ignoredKeys.includes(key)) return;
    measurement[key] = measurementData[key];
  });

  //Populate Viewport with the Cornerstone Viewport
  measurement.viewport = cornerstone.getViewport(eventData.element);

  measurementApi.updateMeasurement(toolName, measurement);

  // TODO: Notify about the last activated measurement

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
