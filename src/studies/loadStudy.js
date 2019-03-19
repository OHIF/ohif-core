import { retrieveStudyMetadata } from './retrieveStudyMetadata';
import { StudyMetadata } from '../classes/metadata/StudyMetadata';
import { OHIFStudyMetadata } from '../classes/metadata/OHIFStudyMetadata';
import { sortingManager } from '../utils/sortingManager.js';
import { updateMetaDataManager } from '../utils/updateMetaDataManager';
import studyMetadataManager from '../utils/studyMetadataManager';
import sortStudy from './sortStudy';

/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
async function loadStudy(server, studyInstanceUid) {
  const study = await retrieveStudyMetadata(server, studyInstanceUid);

  // Once the data was retrieved, the series are sorted by series and instance number
  sortStudy(study);

  // Transform the study into a StudyMetadata object
  const studyMetadata = new OHIFStudyMetadata(study, study.studyInstanceUid);

  // Add the display sets to the study
  const displaySets = sortingManager.getDisplaySets(studyMetadata);

  studyMetadata.setDisplaySets(displaySets);

  // Updates WADO-RS metaDataManager
  updateMetaDataManager(study);

  studyMetadataManager.add(studyMetadata);

  // Add the study to the loading listener to allow loading progress handling
  //const studyLoadingListener = OHIF.viewerbase.StudyLoadingListener.getInstance();
  //studyLoadingListener.addStudy(study);

  return studyMetadata;
}

export default loadStudy;

export { loadStudy };
