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
//import { plugins } from './plugins/';
import { TypeSafeCollection } from './TypeSafeCollection';
import OHIFError from './OHIFError.js';
import { StudyMetadataSource } from './StudyMetadataSource';
import HotkeysUtil from './HotkeysUtil.js';

export {
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
  //StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource,
  HotkeysUtil
};

const classes = {
  MetadataProvider,
  CommandsManager,
  HotkeysContext,
  HotkeysManager,
  HotkeysUtil,
  ImageSet,
  StudyPrefetcher,
  StudyLoadingListener,
  StackLoadingListener,
  DICOMFileLoadingListener,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  //StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource
};

export default classes;
