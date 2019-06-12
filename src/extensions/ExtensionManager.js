import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

export default class ExtensionManager {
  constructor() {
    this.modules = {};
    this.registeredExtensionIds = [];
    this.moduleTypeNames = Object.values(MODULE_TYPES);

    this.moduleTypeNames.forEach(moduleType => {
      this.modules[moduleType] = [];
    });
  }

  /**
   *
   * @param {Object[]} extensions - Array of extensions
   */
  registerExtensions(extensions) {
    extensions.forEach(extension => {
      this.registerExtension(extension);
    });
  }

  /**
   *
   * TODO: Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now
   * @param {Object} extension
   */
  registerExtension(extension) {
    let extensionId = extension.id;

    if (!extensionId) {
      extensionId = Math.random()
        .toString(36)
        .substr(2, 5);

      log.warn(`Extension ID not set. Using random string ID: ${extensionId}`);
    }

    if (this.registeredExtensionIds.includes(extensionId)) {
      log.warn(
        `Extension ID ${extensionId} has already been registered. Exiting before duplicating modules.`
      );

      return;
    }

    this.moduleTypeNames.forEach(moduleType => {
      const getModuleFnName = 'get' + _capitalizeFirstCharacter(moduleType);
      const getModuleFn = extension[getModuleFnName];
      if (!getModuleFn) {
        return;
      }

      let extensionModule;

      try {
        extensionModule = getModuleFn();
        if (!extensionModule) {
          log.warn(
            `Null or undefined returned when registering the ${getModuleFnName} module for the ${extensionId} extension`
          );
          return;
        }
      } catch (ex) {
        log.error(
          `Exception thrown while trying to call ${getModuleFnName} for the ${extensionId} extension`
        );
      }

      this.modules[moduleType].push({
        extensionId,
        module: extensionModule,
      });
    });
  }
}

/**
 * @private
 * @param {string} lower
 */
function _capitalizeFirstCharacter(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}
