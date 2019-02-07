import { OHIFPlugin } from './OHIFPlugin';
import ExtensionManager from './ExtensionManager';

// Each plugin registers an entry point function to be called
// when the loading is complete.

const extensions = {
  OHIFPlugin,
  ExtensionManager,
  entryPoints: {}
};

export default extensions;
