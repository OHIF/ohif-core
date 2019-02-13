import { MeasurementApi, TimepointApi } from '../classes';
import log from '../../log';

export default function handleSingleMeasurementRemoved({
  eventData,
  tool,
  toolGroupId,
  toolGroup
}) {
  log.info('CornerstoneToolsMeasurementRemoved');
  const { measurementData, toolType } = eventData;

  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const timepointApi = TimepointApi.Instance;
  if (!timepointApi) {
    log.warn('Timepoint API is not initialized');
  }

  const collection = measurementApi.tools[toolType];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  const measurementTypeId = measurementApi.toolsGroupsMap[toolType];
  const measurement = collection.find(
    measurement => measurement._id === measurementData._id
  );

  // Stop here if the measurement is already gone or never existed
  if (!measurement) return;

  // Remove all the measurements with the given type and number
  const { measurementNumber, timepointId } = measurement;
  measurementApi.deleteMeasurements(measurementTypeId, {
    measurementNumber,
    timepointId
  });

  // Sync the new measurement data with cornerstone tools
  const baseline = timepointApi.baseline();
  measurementApi.sortMeasurements(baseline.timepointId);
}
