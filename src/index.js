import { QIDO, WADO } from './services/';
import './lib';
//import commands from './commands';
import hotkeys from './hotkeys';
//import './components';
import './ui';
import header from './header.js';
import './schema.js';
import utils from './utils/';
import metadata from './classes/metadata/';
import './startup.js';
import cornerstone from './cornerstone.js';
import classes from './classes/';
import redux from './redux/';

const studies = {
	services: {
        QIDO,
        WADO
    }
};

const OHIF = {
	utils,
	studies,
	redux,
	classes,
	metadata,
	hotkeys,
	header,
	cornerstone,
	//commands
}

export {
	utils,
	studies,
	redux,
	classes,
	metadata,
	hotkeys,
	header,
	cornerstone,
	//commands
};

export default OHIF;