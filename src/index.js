import './lib';
//import './schema.js';
import studies from './studies/';
import commands from './commands';
import hotkeys from './hotkeys.js';
import ui from './ui';
import header from './header.js';
import utils from './utils/';
import metadata from './classes/metadata/';
import cornerstone from './cornerstone.js';
import classes from './classes/';
import redux from './redux/';
import string from './string.js';
import user from './user.js';
import object from './object.js';
import DICOMWeb from './DICOMWeb';
import log from './log.js';
import external from './externalModules.js';
import hangingProtocols from './hanging-protocols/';
import plugins from './plugins.js';
import extensions from './classes/extensions/';
import measurements from './measurements';

const hotkeysUtil = new classes.HotkeysUtil();

const OHIF = {
  utils,
  studies,
  redux,
  classes,
  metadata,
  hotkeys,
  hotkeysUtil,
  header,
  cornerstone,
  string,
  ui,
  user,
  object,
  commands,
  log,
  external,
  DICOMWeb,
  plugins,
  extensions,
  viewer: {},
  measurements,
};

export {
  utils,
  studies,
  redux,
  classes,
  metadata,
  hotkeys,
  header,
  cornerstone,
  string,
  ui,
  user,
  object,
  commands,
  log,
  DICOMWeb,
  plugins,
  extensions,
  measurements,
};

export { OHIF };

export default OHIF;
