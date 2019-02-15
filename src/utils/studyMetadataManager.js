import { TypeSafeCollection } from '../classes';

const studyMetadataList = new TypeSafeCollection();

function add(studyMetadata) {
  studyMetadataList.insert(studyMetadata);
}

function get(studyInstanceUID) {
  return studyMetadataList.findBy({ studyInstanceUID });
}

function remove(studyInstanceUID) {
  studyMetadataList.remove({ studyInstanceUID });
}

function purge() {
  studyMetadataList.removeAll();
}

export default {
  add,
  get,
  remove,
  purge
};
