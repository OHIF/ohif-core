import './lib';
//import './schema.js';
import studies from './studies/';
import commands from './commands';
import hotkeys from './hotkeys';
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

const viewer = {};

const OHIF = {
  viewer,
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
  external,
  DICOMWeb
};

export {
  viewer, // TODO: Remove this
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
  DICOMWeb
};

export { OHIF };

export default OHIF;
