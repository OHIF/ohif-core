import { addPlugin } from '../../redux/actions.js';
import { PLUGIN_TYPES } from '../../plugins.js';

function capitalize(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}

export default class ExtensionManager {
  static registerExtensions(store, extensions) {
    extensions.forEach(extension => {
      ExtensionManager.registerExtension(store, extension);
    });
  }

  static registerExtension(store, extension) {
    /**
     *   TODO:
     * - Use this function for checking extensions definition and throw errors early/ignore extension if format is not conformant or any required stuff is missing
     * - Check uniqueness of extension id
     * - Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now */
    const moduleTypeNames = Object.values(PLUGIN_TYPES);
    const extensionId = extension.getExtensionId();

    moduleTypeNames.forEach(type => {
      const getter = 'get' + capitalize(type);
      const getComponentFn = extension[getter];
      if (!getComponentFn) {
        return;
      }

      const component = extension[getter]();
      if (!component) {
        return;
      }

      store.dispatch(
        addPlugin({
          id: extensionId,
          type,
          component
        })
      );
    });
  }
}
