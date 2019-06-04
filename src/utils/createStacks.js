import DICOMWeb from '../DICOMWeb';
import ImageSet from '../classes/ImageSet';
import { api } from 'dicomweb-client';
import { isImage } from './isImage';
import plugins from '../plugins';

/**
 *
 * @typedef StudyMetadata
 * @property {function} getSeriesCount - returns the number of series in the study
 * @property {function} forEachSeries - function that invokes callback with each series and index
 * @property {function} getStudyInstanceUID - returns the study's instance UID
 *
 */

/**
 * @typedef SeriesMetadata
 * @property {function} getSeriesInstanceUID - returns the series's instance UID
 * @property {function} getData - ???
 * @property {function} forEachInstance - ???
 */

const dwc = api.DICOMwebClient;

const isMultiFrame = instance => {
  // NumberOfFrames (0028,0008)
  return instance.getRawValue('x00280008') > 1;
};

const makeDisplaySet = (series, instances) => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);
  const seriesData = series.getData();

  // set appropriate attributes to image set...
  imageSet.setAttributes({
    displaySetInstanceUid: imageSet.uid, // create a local alias for the imageSet UID
    seriesDate: seriesData.seriesDate,
    seriesTime: seriesData.seriesTime,
    seriesInstanceUid: series.getSeriesInstanceUID(),
    seriesNumber: instance.getRawValue('x00200011'),
    seriesDescription: instance.getRawValue('x0008103e'),
    numImageFrames: instances.length,
    frameRate: instance.getRawValue('x00181063'),
    modality: instance.getRawValue('x00080060'),
    isMultiFrame: isMultiFrame(instance),
  });

  // Sort the images in this series if needed
  const shallSort = true; //!OHIF.utils.ObjectPath.get(Meteor, 'settings.public.ui.sortSeriesByIncomingOrder');
  if (shallSort) {
    imageSet.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      return (
        (parseInt(a.getRawValue('x00200013', 0)) || 0) -
        (parseInt(b.getRawValue('x00200013', 0)) || 0)
      );
    });
  }

  // Include the first image instance number (after sorted)
  imageSet.setAttribute(
    'instanceNumber',
    imageSet.getImage(0).getRawValue('x00200013')
  );

  return imageSet;
};

const isSingleImageModality = modality => {
  return modality === 'CR' || modality === 'MG' || modality === 'DX';
};

function getSopClassUids(series) {
  const uniqueSopClassUidsInSeries = new Set();
  series.forEachInstance(instance => {
    const instanceSopClassUid = instance.getRawValue('x00080016');

    uniqueSopClassUidsInSeries.add(instanceSopClassUid);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

/**
 * Creates a set of series to be placed in the Study Metadata
 * The series that appear in the Study Metadata must represent
 * imaging modalities.
 *
 * Furthermore, for drag/drop functionality,
 * it is easiest if the stack objects also contain information about
 * which study they are linked to.
 *
 * @param {StudyMetadata} study The study instance metadata to be used
 * @returns {Array} An array of series to be placed in the Study Metadata
 */
function createStacks(study) {
  const displaySets = [];
  const anyDisplaySets = !study || !study.getSeriesCount();

  if (!anyDisplaySets) {
    return displaySets;
  }

  // Loop through the series (SeriesMetadata)
  study.forEachSeries(series => {
    const anyInstances = series.getInstanceCount() > 0;
    if (!anyInstances) {
      return;
    }

    const sopClassUids = getSopClassUids(series);

    let displaySet = _getDisplaySetFromSopClassPlugin(
      series,
      study,
      sopClassUids
    );

    const seriesData = series.getData();
    const seriesDate = seriesData.seriesDate;

    if (displaySet) {
      displaySet.seriesDate = seriesDate;
      displaySets.push(displaySet);

      return;
    }

    // Search through the instances (InstanceMetadata object) of this series
    // Split Multi-frame instances and Single-image modalities
    // into their own specific display sets. Place the rest of each
    // series into another display set.
    const stackableInstances = [];
    series.forEachInstance(instance => {
      // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
      if (
        !isImage(instance.getRawValue('x00080016')) &&
        !instance.getRawValue('x00280010')
      ) {
        return;
      }

      if (isMultiFrame(instance)) {
        displaySet = makeDisplaySet(series, [instance]);
        displaySet.setAttributes({
          sopClassUids,
          isClip: true,
          seriesInstanceUid: series.getSeriesInstanceUID(),
          studyInstanceUid: study.getStudyInstanceUID(), // Include the study instance Uid for drag/drop purposes
          numImageFrames: instance.getRawValue('x00280008'), // Override the default value of instances.length
          instanceNumber: instance.getRawValue('x00200013'), // Include the instance number
          acquisitionDatetime: instance.getRawValue('x0008002a'), // Include the acquisition datetime
        });
        displaySets.push(displaySet);
      } else if (isSingleImageModality(instance.modality)) {
        displaySet = makeDisplaySet(series, [instance]);
        displaySet.setAttributes({
          sopClassUids,
          studyInstanceUid: study.getStudyInstanceUID(), // Include the study instance Uid
          seriesInstanceUid: series.getSeriesInstanceUID(),
          instanceNumber: instance.getRawValue('x00200013'), // Include the instance number
          acquisitionDatetime: instance.getRawValue('x0008002a'), // Include the acquisition datetime
        });
        displaySets.push(displaySet);
      } else {
        stackableInstances.push(instance);
      }
    });

    if (stackableInstances.length) {
      const displaySet = makeDisplaySet(series, stackableInstances);
      displaySet.setAttribute('studyInstanceUid', study.getStudyInstanceUID());
      displaySet.setAttributes({
        sopClassUids,
      });
      displaySets.push(displaySet);
    }
  });

  // TODO
  displaySets.sort((a, b) => {
    const seriesDateA = a.seriesDate || a.getAttribute('seriesDate');
    const seriesDateB = b.seriesDate || b.getAttribute('seriesDate');

    return seriesDateA - seriesDateB;
  });

  return displaySets;
}

/**
 * @private
 * @param {SeriesMetadata} series
 * @param {StudyMetadata} study
 * @param {string[]} sopClassUids
 */
function _getDisplaySetFromSopClassPlugin(series, study, sopClassUids) {
  // TODO: For now only use the plugins if all instances have the same sopClassUid
  if (sopClassUids.length !== 1) {
    console.warn(
      'getDisplaySetFromSopClassPlugin: More than one SOPClassUid in the same series is not yet supported.'
    );
    return;
  }

  const firstSopClassUid = sopClassUids[0];

  const { availablePlugins, PLUGIN_TYPES } = plugins;
  const sopClassHandlerPlugins = availablePlugins.filter(plugin => {
    return plugin.type === PLUGIN_TYPES.SOP_CLASS_HANDLER;
  });

  // TODO: A bit weird that this is plugin.component
  const sopClassHandlerPluginClasses = sopClassHandlerPlugins.map(plugin => {
    return plugin.component;
  });

  const applicablePlugins = sopClassHandlerPluginClasses.filter(plugin => {
    return plugin.sopClassUids.includes(firstSopClassUid);
  });

  // TODO: Sort by something
  if (!applicablePlugins || !applicablePlugins.length) {
    return;
  }

  const plugin = applicablePlugins[0];
  const headers = DICOMWeb.getAuthorizationHeader();
  const dicomWebClient = new dwc({
    url: study.getData().wadoRoot,
    headers,
  });

  return plugin.getDisplaySetFromSeries(series, study, dicomWebClient, headers);
}

export default createStacks;
