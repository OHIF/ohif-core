import { HotkeysManager } from './classes/HotkeysManager';
import jquery from 'jquery';
import { HotkeysUtil } from './classes';
window.$ = window.jQuery = jquery;
require('jquery.hotkeys'); // TODO: check why import does not work. import('jquery.hotkeys');

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();
const hotkeysUtil = new HotkeysUtil();

// Export relevant objects
export { hotkeys, hotkeysUtil };
