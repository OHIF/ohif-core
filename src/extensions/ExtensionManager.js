import { MODULE_TYPES } from './MODULE_TYPES.js';

function capitalize(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}

export default class ExtensionManager {
  constructor() {
    this.modules = {};
    this.moduleTypeNames = Object.values(MODULE_TYPES);
  }

  /**
   *
   * @param {*} extensions
   */
  registerExtensions(extensions) {
    extensions.forEach(extension => {
      ExtensionManager.registerExtension(extension);
    });
  }

  /**
   *
   * @param {*} extension
   */
  registerExtension(extension) {
    /**
     *   TODO:
     * - Use this function for checking extensions definition and throw errors early/ignore extension if format is not conformant or any required stuff is missing
     * - Check uniqueness of extension id
     * - Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now */
    const extensionId = extension.getExtensionId();

    this.moduleTypeNames.forEach(type => {
      const getter = 'get' + capitalize(type);
      const getComponentFn = extension[getter];
      if (!getComponentFn) {
        return;
      }

      const component = extension[getter]();
      if (!component) {
        return;
      }

      // store.dispatch(
      //   addPlugin({
      //     id: extensionId,
      //     type,
      //     component,
      //   })
      // );
    });
  }
}
