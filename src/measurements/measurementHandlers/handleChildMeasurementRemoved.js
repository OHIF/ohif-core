import { MeasurementApi, TimepointApi } from '../classes';
import log from '../../log';

export default function({ eventData, tool, toolGroupId, toolGroup }) {
  OHIF.log.info('CornerstoneToolsMeasurementRemoved');
  const { measurementData, toolType } = eventData;

  const measurementApi = MeasurementApi.Instance;
  if (!measurementApi) {
    log.warn('Measurement API is not initialized');
  }

  const timepointApi = TimepointApi.Instance;
  if (!timepointApi) {
    log.warn('Timepoint API is not initialized');
  }

  const collection = measurementApi.tools[tool.parentTool];

  // Stop here if the tool data shall not be persisted (e.g. temp tools)
  if (!collection) return;

  const measurement = collection.find(
    measurement => measurement._id === measurementData._id
  );

  // Stop here if the measurement is already gone or never existed
  if (!measurement) return;

  if (measurement.childToolsCount === 1) {
    // Remove the measurement
    collection = collection.filter(
      measurement => measurement._id !== measurementData._id
    );

    // Sync the new measurement data with cornerstone tools
    const baseline = timepointApi.baseline();
    measurementApi.sortMeasurements(baseline.timepointId);
  } else {
    // Update the measurement in the collection
    // TODO: Figured out what is childToolsCount
    // collection.update(measurement._id, {
    //     $set: { [tool.attribute]: null },
    //     $inc: { childToolsCount: -1 }
    // });
  }

  measurementApi.onMeasurementsUpdated();
}
