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

const actions = {
  setToolActive,
  setViewportActive,
  setLayout,
  setStudyLoadingProgress,
  clearStudyLoadingProgress,
  setUserPreferences
};

export default actions;
