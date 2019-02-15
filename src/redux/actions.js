export const setToolActive = tool => ({
  type: 'SET_TOOL_ACTIVE',
  tool
});

export const setViewportActive = viewportIndex => ({
  type: 'SET_VIEWPORT_ACTIVE',
  viewportIndex
});

export const setLayout = layout => ({
  type: 'SET_LAYOUT',
  layout
});

export const setStudyLoadingProgress = (progressId, progressData) => ({
  type: 'SET_STUDY_LOADING_PROGRESS',
  progressId,
  progressData
});

export const clearStudyLoadingProgress = progressId => ({
  type: 'CLEAR_STUDY_LOADING_PROGRESS',
  progressId
});

export const setUserPreferences = state => ({
  type: 'SET_USER_PREFERENCES',
  state
});

export const setCommandContext = state => ({
  type: 'SET_COMMAND_CONTEXT',
  state
});

export const setViewportSpecificData = (viewportIndex, data) => ({
  type: 'SET_VIEWPORT_SPECIFIC_DATA',
  viewportIndex,
  data
});

export const clearViewportSpecificData = viewportIndex => ({
  type: 'CLEAR_VIEWPORT_SPECIFIC_DATA',
  viewportIndex
});

export const addPlugin = plugin => ({
  type: 'ADD_PLUGIN',
  plugin
});

export const setAvailableButtons = buttons => ({
  type: 'SET_AVAILABLE_BUTTONS',
  buttons
});

export const setExtensionData = (extension, data) => ({
  type: 'SET_EXTENSION_DATA',
  extension,
  data
});

export const setTimepoints = state => ({
  type: 'SET_TIMEPOINTS',
  state
});

export const setMeasurements = state => ({
  type: 'SET_MEASUREMENTS',
  state
});

const actions = {
  setToolActive,
  setViewportActive,
  setLayout,
  setStudyLoadingProgress,
  clearStudyLoadingProgress,
  setUserPreferences,
  setCommandContext,
  setViewportSpecificData,
  clearViewportSpecificData,
  addPlugin,
  setAvailableButtons,
  setExtensionData,
  setTimepoints,
  setMeasurements
};

export default actions;
