import { HotkeysManager } from './classes/HotkeysManager';
import jquery from 'jquery';
window.$ = window.jQuery = jquery;

// TODO: Need to remove this because it's breaking other usages..
//import 'jquery.hotkeys';

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();

// Export relevant objects
export default hotkeys;
