import { OHIFStudyMetadata } from '../classes/metadata/OHIFStudyMetadata';
import { sortingManager } from './sortingManager.js';
import { updateMetaDataManager } from './updateMetaDataManager.js';
import studyMetadataManager from './studyMetadataManager';

export default function createDisplaySets(studies) {
  // Define the OHIF.viewer.data global object
  // TODO: Save all data that is currently in OHIF.viewer in redux instead
  //OHIF.viewer.data = OHIF.viewer.data || {};

  // @TypeSafeStudies
  // Clears OHIF.viewer.Studies collection
  //OHIF.viewer.Studies.removeAll();

  // @TypeSafeStudies
  // Clears OHIF.viewer.StudyMetadataList collection
  //OHIF.viewer.StudyMetadataList.removeAll();

  //OHIF.viewer.data.studyInstanceUids = [];

  // TODO: Need to purge studyMetadataManager somewhere else
  studyMetadataManager.purge();

  const updatedStudies = studies.map(study => {
    const studyMetadata = new OHIFStudyMetadata(study, study.studyInstanceUid);
    let displaySets = study.displaySets;

    if (!study.displaySets) {
      displaySets = sortingManager.getDisplaySets(studyMetadata);
      study.displaySets = displaySets;
    }

    studyMetadata.setDisplaySets(displaySets);
    //OHIF.viewer.Studies.insert(study);
    //OHIF.viewer.StudyMetadataList.insert(studyMetadata);
    //OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);

    // Updates WADO-RS metaDataManager
    updateMetaDataManager(study);

    studyMetadataManager.add(studyMetadata);

    return study;
  });

  return updatedStudies;
}
