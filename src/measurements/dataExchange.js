import { OHIF } from '../index';

export const retrieveMeasurements = (patientId, timepointIds) => {
  OHIF.log.error('retrieveMeasurements');
  return Promise.resolve();
};

export const storeMeasurements = (measurementData, timepointIds) => {
  OHIF.log.error('storeMeasurements');
  return Promise.resolve();
};

export const retrieveTimepoints = filter => {
  OHIF.log.error('retrieveTimepoints');
  return Promise.resolve();
};

export const storeTimepoints = timepointData => {
  OHIF.log.error('storeTimepoints');
  return Promise.resolve();
};

export const updateTimepoint = (timepointData, query) => {
  OHIF.log.error('updateTimepoint');
  return Promise.resolve();
};

export const removeTimepoint = timepointId => {
  OHIF.log.error('removeTimepoint');
  return Promise.resolve();
};

export const disassociateStudy = (timepointIds, studyInstanceUid) => {
  OHIF.log.error('disassociateStudy');
  return Promise.resolve();
};
