import { QIDO, WADO } from './services/';
import { loadStudy } from './loadStudy.js';
import {
  retrieveStudyMetadata,
  deleteStudyMetadataPromise
} from './retrieveStudyMetadata.js';
import retrieveStudiesMetadata from './retrieveStudiesMetadata.js';
import getStudyBoxData from './getStudyBoxData';
import searchStudies from './searchStudies';
import sortStudy from './sortStudy';

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
  searchStudies,
  loadStudy,
  sortStudy
};

export default studies;
