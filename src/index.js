import './lib';

import classes, { CommandsManager, HotkeysManager } from './classes/';
import DICOMWeb from './DICOMWeb';
import cornerstone from './cornerstone.js';
import extensions from './classes/extensions/';
import hangingProtocols from './hanging-protocols';
import header from './header.js';
import log from './log.js';
import measurements from './measurements';
import metadata from './classes/metadata/';
import object from './object.js';
import plugins from './plugins.js';
import redux from './redux/';
import string from './string.js';
//import './schema.js';
import studies from './studies/';
import ui from './ui';
import user from './user.js';
import utils from './utils/';

const OHIF = {
  utils,
  studies,
  redux,
  classes,
  metadata,
  HotkeysManager,
  header,
  cornerstone,
  string,
  ui,
  user,
  object,
  CommandsManager,
  log,
  DICOMWeb,
  plugins,
  extensions,
  viewer: {},
  measurements,
  hangingProtocols,
};

export {
  utils,
  studies,
  redux,
  classes,
  metadata,
  HotkeysManager,
  header,
  cornerstone,
  string,
  ui,
  user,
  object,
  CommandsManager,
  log,
  DICOMWeb,
  plugins,
  extensions,
  measurements,
  hangingProtocols,
};

export { OHIF };

export default OHIF;
