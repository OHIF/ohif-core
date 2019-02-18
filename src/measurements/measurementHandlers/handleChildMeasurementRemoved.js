import { MeasurementApi } from '../classes';
import log from '../../log';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  log.info('CornerstoneToolsMeasurementRemoved');
  const { measurementData } = eventData;

  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const collection = measurementApi.tools[tool.parentTool];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  const measurement = collection.find(t => t._id === measurementData._id);

  // Stop here if the measurement is already gone or never existed
  if (!measurement) return;

  if (measurement.childToolsCount === 1) {
    // Remove the measurement
    measurementApi.removeMeasurement(tool.parentTool, measurement);
  } else {
    // Update the measurement
    measurement[tool.attribute] = null;
    measurement.childToolsCount = (measurement.childToolsCount || 0) - 1;
    measurementApi.updateMeasurement(tool.parentTool, measurement);
  }

  // TODO: Repaint the images on all viewports without the removed measurements
  //_.each($('.imageViewerViewport:not(.empty)'), element => cornerstone.updateImage(element));

  if (MeasurementApi.isToolIncluded(tool)) {
    // TODO: Notify that viewer suffered changes
  }
}
