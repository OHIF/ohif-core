import ExtensionManager from './ExtensionManager';
import MODULE_TYPES from './MODULE_TYPES.js';
// import { OHIFPlugin } from './OHIFPlugin';

// Each plugin registers an entry point function to be called
// when the loading is complete.

const extensions = {
  // OHIFPlugin,
  ExtensionManager,
  MODULE_TYPES,
  // entryPoints: {},
};

export default extensions;
