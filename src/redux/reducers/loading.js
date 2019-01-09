const defaultState = {
  progress: {},
  lastUpdated: null
};

const loading = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_STUDY_LOADING_PROGRESS':
      const progress = state.progress;
      progress[action.progressId] = action.progressData;

      // This is a workaround so we can easily identify changes
      // to the progress object without doing deep comparison.
      // See FlexboxLayout
      const date = new Date();
      const lastUpdated = date.getTime();

      return Object.assign({}, state, { progress, lastUpdated });
    case 'CLEAR_STUDY_LOADING_PROGRESS':
      const updatedState = Object.assign({}, state);
      delete updatedState.progress[action.progressId];

      return updatedState;
    default:
      return state;
  }
};

export default loading;
