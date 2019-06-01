import MetadataProvider from './MetadataProvider.js';
import CommandsManager from './CommandsManager.js';
import HotkeysContext from './HotkeysContext.js';
import HotkeysManager from './HotkeysManager.js';
import ImageSet from './ImageSet';
import { StudyPrefetcher } from './StudyPrefetcher';
import { StudyLoadingListener } from './StudyLoadingListener';
import { StackLoadingListener } from './StudyLoadingListener';
import { DICOMFileLoadingListener } from './StudyLoadingListener';
import { StudyMetadata } from './metadata/StudyMetadata';
import { SeriesMetadata } from './metadata/SeriesMetadata';
import { InstanceMetadata } from './metadata/InstanceMetadata';
//import { StudySummary } from './metadata/StudySummary';
import { TypeSafeCollection } from './TypeSafeCollection';
import OHIFError from './OHIFError.js';
import { StudyMetadataSource } from './StudyMetadataSource';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { StudySummary } from './metadata/StudySummary';

export {
  OHIFStudyMetadataSource,
  MetadataProvider,
  CommandsManager,
  HotkeysContext,
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
  HotkeysContext,
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
