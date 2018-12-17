import { QIDO, WADO } from './services/';
import loadStudy from './loadStudy.js';
import {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise
} from './retrieveStudyMetadata.js';
import retrieveStudiesMetadata from './retrieveStudiesMetadata.js';
import getStudyBoxData from './getStudyBoxData';
import searchStudies from './searchStudies';

// Create a studies loaded state dictionary to enable reactivity. Values: loading|loaded|failed
const studies = {
  services: {
    QIDO,
    WADO
  },
  loadingDict: {},
  retrieveStudyMetadata,
  deleteStudyMetadataPromise,
  retrieveStudiesMetadata,
  getStudyBoxData,
  searchStudies
};

export default studies;
