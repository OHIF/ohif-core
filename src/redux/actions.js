/** Action Creators:
 *  https://redux.js.org/basics/actions#action-creators
 */

import {
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
  CLEAR_VIEWPORT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_SERVERS,
} from './constants/ActionTypes.js';

/**
 * VIEWPORT
 */
export const setViewportSpecificData = (viewportIndex, data) => ({
  type: SET_VIEWPORT,
  viewportIndex,
  data,
});

export const setViewportActive = viewportIndex => ({
  type: SET_VIEWPORT_ACTIVE,
  viewportIndex,
});

export const setLayout = layout => ({
  type: SET_VIEWPORT_LAYOUT,
  layout,
});

export const clearViewportSpecificData = viewportIndex => ({
  type: CLEAR_VIEWPORT,
  viewportIndex,
});

export const setActiveViewportSpecificData = data => ({
  type: SET_ACTIVE_SPECIFIC_DATA,
  data,
});

/**
 * NOT-VIEWPORT
 */
export const setToolActive = tool => ({
  type: 'SET_TOOL_ACTIVE',
  tool,
});

export const setStudyLoadingProgress = (progressId, progressData) => ({
  type: 'SET_STUDY_LOADING_PROGRESS',
  progressId,
  progressData,
});

export const clearStudyLoadingProgress = progressId => ({
  type: 'CLEAR_STUDY_LOADING_PROGRESS',
  progressId,
});

export const setUserPreferences = state => ({
  type: 'SET_USER_PREFERENCES',
  state,
});

export const setCommandContext = state => ({
  type: 'SET_COMMAND_CONTEXT',
  state,
});

export const addPlugin = plugin => ({
  type: 'ADD_PLUGIN',
  plugin,
});

export const setAvailableButtons = buttons => ({
  type: 'SET_AVAILABLE_BUTTONS',
  buttons,
});

export const setExtensionData = (extension, data) => ({
  type: 'SET_EXTENSION_DATA',
  extension,
  data,
});

export const setTimepoints = state => ({
  type: 'SET_TIMEPOINTS',
  state,
});

export const setMeasurements = state => ({
  type: 'SET_MEASUREMENTS',
  state,
});

export const setStudyData = (studyInstanceUid, data) => ({
  type: 'SET_STUDY_DATA',
  studyInstanceUid,
  data,
});

export const setServers = servers => ({
  type: SET_SERVERS,
  servers,
});

export const setViewportLayoutAndData = (layout, viewportSpecificData) => ({
  type: SET_VIEWPORT_LAYOUT_AND_DATA,
  layout,
  viewportSpecificData,
});

const actions = {
  // VIEWPORT
  setViewportActive,
  setViewportSpecificData,
  setViewportLayoutAndData,
  setLayout,
  clearViewportSpecificData,
  setActiveViewportSpecificData,
  setToolActive,
  setStudyLoadingProgress,
  clearStudyLoadingProgress,
  setUserPreferences,
  setCommandContext,
  addPlugin,
  setAvailableButtons,
  setExtensionData,
  setTimepoints,
  setMeasurements,
  setStudyData,
  setServers,
};

export default actions;
