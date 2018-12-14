import { HotkeysManager } from './classes/HotkeysManager';
import 'jquery.hotkeys';

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();

// Export relevant objects
export default hotkeys;
