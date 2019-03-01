import { HotkeysManager } from './classes/HotkeysManager';
import jquery from 'jquery';
window.$ = window.jQuery = jquery;
require('jquery.hotkeys');

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();

// Export relevant objects
export default hotkeys;
