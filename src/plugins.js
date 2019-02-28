const PLUGIN_TYPES = {
  VIEWPORT: 'viewportModule',
  TOOLBAR: 'toolbarModule',
  PANEL: 'panelModule',
  SOP_CLASS_HANDLER: 'sopClassHandler'
};

const availablePlugins = [];
const plugins = {
  PLUGIN_TYPES,
  availablePlugins
};

export { PLUGIN_TYPES, availablePlugins };

export default plugins;
