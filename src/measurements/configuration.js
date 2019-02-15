import { TimepointApi, MeasurementApi } from './classes';
import ohifTools from './ohifTools';
import {
  retrieveMeasurements,
  storeMeasurements,
  retrieveTimepoints,
  storeTimepoints,
  removeTimepoint,
  updateTimepoint,
  disassociateStudy
} from './dataExchange';

MeasurementApi.setConfiguration({
  measurementTools: ohifTools,
  newLesions: [
    {
      id: 'newTargets',
      name: 'New Targets',
      toolGroupId: 'targets'
    },
    {
      id: 'newNonTargets',
      name: 'New Non-Targets',
      toolGroupId: 'nonTargets'
    }
  ],
  dataExchange: {
    retrieve: retrieveMeasurements,
    store: storeMeasurements
  }
});

TimepointApi.setConfiguration({
  dataExchange: {
    retrieve: retrieveTimepoints,
    store: storeTimepoints,
    remove: removeTimepoint,
    update: updateTimepoint,
    disassociate: disassociateStudy
  }
});
