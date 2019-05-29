import { StudyMetadata } from './StudyMetadata';
import { SeriesMetadata } from './SeriesMetadata';
import { InstanceMetadata } from './InstanceMetadata';
import { OHIFStudyMetadata } from './OHIFStudyMetadata';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';
import { Metadata } from './Metadata';
import { WadoRsMetaDataBuilder } from './WadoRsMetaDataBuilder';
import { StudySummary } from './StudySummary';

const metadata = {
  Metadata,
  StudySummary,
  WadoRsMetaDataBuilder,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  OHIFStudyMetadata,
  OHIFSeriesMetadata,
  OHIFInstanceMetadata,
};

export default metadata;
