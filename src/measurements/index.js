import { TimepointApi, MeasurementApi } from './classes';
import MeasurementHandlers from './measurementHandlers';
import getLabel from './lib/getLabel';
import getDescription from './lib/getDescription';
import getImageAttributes from './lib/getImageAttributes';
import getImageIdForImagePath from './lib/getImageIdForImagePath';
import ltTools from './ltTools';
import * as tools from './tools';
import './configuration';
import { ConformanceCriteria } from './conformance';

const measurements = {
  TimepointApi,
  MeasurementApi,
  ConformanceCriteria,
  MeasurementHandlers,
  ltTools,
  tools,
  getLabel,
  getDescription,
  getImageAttributes,
  getImageIdForImagePath
};

export default measurements;
