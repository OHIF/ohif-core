/**
 * Load the study metadata and store its information locally
 *
 * @param {String} studyInstanceUid The UID of the Study to be loaded
 * @returns {Promise} that will be resolved with the study metadata or rejected with an error
 */
export default function loadStudy(studyInstanceUid) {
  return new Promise((resolve, reject) => {
    let currentLoadingState = OHIF.studies.loadingDict[studyInstanceUid] || '';

    // Set the loading state as the study is not yet loaded
    if (currentLoadingState !== 'loading') {
      OHIF.studies.loadingDict[studyInstanceUid] = 'loading';
    }

    const studyLoaded = OHIF.viewer.Studies.findBy({
      studyInstanceUid: studyInstanceUid
    });
    if (studyLoaded) {
      OHIF.studies.loadingDict[studyInstanceUid] = 'loaded';
      resolve(studyLoaded);
      return;
    }

    return OHIF.studies
      .retrieveStudyMetadata(studyInstanceUid)
      .then(study => {
        if (
          window.HipaaLogger &&
          OHIF.user &&
          OHIF.user.userLoggedIn &&
          OHIF.user.userLoggedIn()
        ) {
          window.HipaaLogger.logEvent({
            eventType: 'viewed',
            userId: OHIF.user.getUserId(),
            userName: OHIF.user.getName(),
            collectionName: 'Study',
            recordId: studyInstanceUid,
            patientId: study.patientId,
            patientName: study.patientName
          });
        }

        // Once the data was retrieved, the series are sorted by series and instance number
        OHIF.viewerbase.sortStudy(study);

        // Updates WADO-RS metaDataManager
        OHIF.viewerbase.updateMetaDataManager(study);

        // Transform the study in a StudyMetadata object
        const studyMetadata = new OHIF.metadata.StudyMetadata(study);

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
        OHIF.studies.loadingDict[studyInstanceUid] = 'loaded';

        resolve(study);
      })
      .catch((...args) => {
        OHIF.studies.loadingDict[studyInstanceUid] = 'failed';
        reject(args);
      });
  });
}
