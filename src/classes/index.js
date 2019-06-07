import CommandsManager from './CommandsManager.js';
import { DICOMFileLoadingListener } from './StudyLoadingListener';
import HotkeysManager from './HotkeysManager.js';
import ImageSet from './ImageSet';
import { InstanceMetadata } from './metadata/InstanceMetadata';
import MetadataProvider from './MetadataProvider.js';
import OHIFError from './OHIFError.js';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { SeriesMetadata } from './metadata/SeriesMetadata';
import { StackLoadingListener } from './StudyLoadingListener';
import { StudyLoadingListener } from './StudyLoadingListener';
import { StudyMetadata } from './metadata/StudyMetadata';
import { StudyMetadataSource } from './StudyMetadataSource';
import { StudyPrefetcher } from './StudyPrefetcher';
import { StudySummary } from './metadata/StudySummary';
import { TypeSafeCollection } from './TypeSafeCollection';

//import { StudySummary } from './metadata/StudySummary';

export {
  OHIFStudyMetadataSource,
  MetadataProvider,
  CommandsManager,
  HotkeysManager,
  ImageSet,
  StudyPrefetcher,
  //StudyLoadingListener,
  StackLoadingListener,
  DICOMFileLoadingListener,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource,
};

const classes = {
  OHIFStudyMetadataSource,
  MetadataProvider,
  CommandsManager,
  HotkeysManager,
  ImageSet,
  StudyPrefetcher,
  StudyLoadingListener,
  StackLoadingListener,
  DICOMFileLoadingListener,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource,
};

export default classes;
