import { retrieveStudyMetadata } from './retrieveStudyMetadata';
import { StudyMetadata } from '../classes/metadata/StudyMetadata';
import { updateMetaDataManager } from '../utils/updateMetaDataManager';

// TODO: Use callbacks or redux?
const loadingDict = {};

/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
export default function loadStudy(server, studyInstanceUid) {
  return new Promise((resolve, reject) => {
    let currentLoadingState = loadingDict[studyInstanceUid] || '';

    // Set the loading state as the study is not yet loaded
    if (currentLoadingState !== 'loading') {
      loadingDict[studyInstanceUid] = 'loading';
    }

    /*const studyLoaded = OHIF.viewer.Studies.findBy({
      studyInstanceUid: studyInstanceUid
    });
    if (studyLoaded) {
      loadingDict[studyInstanceUid] = 'loaded';
      resolve(studyLoaded);
      return;
    }*/

    return retrieveStudyMetadata(server, studyInstanceUid)
      .then(study => {
        // Once the data was retrieved, the series are sorted by series and instance number
        OHIF.viewerbase.sortStudy(study);

        // Updates WADO-RS metaDataManager
        updateMetaDataManager(study);

        // Transform the study in a StudyMetadata object
        const studyMetadata = new StudyMetadata(study);

        // Add the display sets to the study
        study.displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(
          studyMetadata
        );
        study.displaySets.forEach(displaySet => {
          OHIF.viewerbase.stackManager.makeAndAddStack(study, displaySet);
          studyMetadata.addDisplaySet(displaySet);
        });

        // Persist study data into OHIF.viewer
        OHIF.viewer.Studies.insert(study);
        OHIF.viewer.StudyMetadataList.insert(study);

        // Add the study to the loading listener to allow loading progress handling
        const studyLoadingListener = OHIF.viewerbase.StudyLoadingListener.getInstance();
        studyLoadingListener.addStudy(study);

        // Add the studyInstanceUid to the loaded state dictionary
        loadingDict[studyInstanceUid] = 'loaded';

        resolve(study);
      })
      .catch((...args) => {
        loadingDict[studyInstanceUid] = 'failed';
        reject(args);
      });
  });
}
