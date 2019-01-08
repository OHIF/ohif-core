const defaultState = {
  progress: {}
};

const loading = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_STUDY_LOADING_PROGRESS':
      const progress = {};
      progress[action.progressId] = action.progressData;

      return Object.assign({}, state, { progress });
    case 'CLEAR_STUDY_LOADING_PROGRESS':
      const updatedState = Object.assign({}, state);
      delete updatedState.progress[action.progressId];

      return updatedState;
    default:
      return state;
  }
};

export default loading;
