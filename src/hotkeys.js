import { HotkeysManager } from './classes/HotkeysManager';
import jquery from 'jquery';
import jqueryHotkeys from './utils/jquery.hotkeys.js';

// We really, really should not be doing this
// Find all global usage of this and replace it with an appropriate equivellant
window.$ = window.jQuery = jquery;
jqueryHotkeys(window.jQuery); // Add `.hotkeys` to global jquery instance

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();

// Export relevant objects
export default hotkeys;
