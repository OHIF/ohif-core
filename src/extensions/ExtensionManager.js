import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

export default class ExtensionManager {
  constructor({ commandsManager }) {
    this.modules = {};
    this.registeredExtensionIds = [];
    this.moduleTypeNames = Object.values(MODULE_TYPES);
    //
    this._commandsManager = commandsManager;

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
    if (!extension) {
      log.warn(
        'Attempting to register a null/undefined extension. Exiting early.'
      );
      return;
    }

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

    // Register Modules
    this.moduleTypeNames.forEach(moduleType => {
      const extensionModule = this._getExtensionModule(
        moduleType,
        extension,
        extensionId
      );

      if (extensionModule) {
        this._initSpecialModuleTypes(moduleType, extensionModule);

        this.modules[moduleType].push({
          extensionId,
          module: extensionModule,
        });
      }
    });

    // Track extension registration
    this.registeredExtensionIds.push(extensionId);
  }

  /**
   * @private
   * @param {string} moduleType
   * @param {Object} extension
   * @param {string} extensionId - Used for logging warnings
   */
  _getExtensionModule(moduleType, extension, extensionId) {
    const getModuleFnName = 'get' + _capitalizeFirstCharacter(moduleType);
    const getModuleFn = extension[getModuleFnName];

    if (!getModuleFn) {
      return;
    }

    try {
      const extensionModule = getModuleFn();

      if (!extensionModule) {
        log.warn(
          `Null or undefined returned when registering the ${getModuleFnName} module for the ${extensionId} extension`
        );
      }

      return extensionModule;
    } catch (ex) {
      log.error(
        `Exception thrown while trying to call ${getModuleFnName} for the ${extensionId} extension`
      );
    }
  }

  _initSpecialModuleTypes(moduleType, extensionModule) {
    switch (moduleType) {
      case 'commandsModule': {
        const { definitions } = extensionModule;
        if (!definitions || Object.keys(definitions).length === 0) {
          log.warn('Commands Module contains no command definitions');
          return;
        }
        this._initCommandsModule(definitions);
        break;
      }
      default:
      // code block
    }
  }

  /**
   *
   * @private
   * @param {Object[]} commandDefinitions
   */
  _initCommandsModule(commandDefinitions) {
    // TODO: Best way to pass this in?
    const commandContext = 'ACTIVE_VIEWPORT::CORNERSTONE';

    this._commandsManager.createContext(commandContext);
    Object.keys(commandDefinitions).forEach(commandName => {
      const commandDefinition = commandDefinitions[commandName];

      this._commandsManager.registerCommand(
        commandContext,
        commandName,
        commandDefinition
      );
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