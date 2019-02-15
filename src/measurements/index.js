import { TimepointApi, MeasurementApi } from './classes';
import MeasurementHandlers from './measurementHandlers';
import getDescription from './lib/getDescription';
import getImageAttributes from './lib/getImageAttributes';
import getImageIdForImagePath from './lib/getImageIdForImagePath';
import syncMeasurementAndToolData from './lib/syncMeasurementAndToolData';
import ltTools from './ltTools';
import ohifTools from './ohifTools';
import './configuration';

const measurements = {
  TimepointApi,
  MeasurementApi,
  MeasurementHandlers,
  ltTools,
  ohifTools,
  getDescription,
  getImageAttributes,
  getImageIdForImagePath,
  syncMeasurementAndToolData
};

export default measurements;
