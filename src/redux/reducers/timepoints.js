const defaultState = {
  timepoints: []
};

const timepoints = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_TIMEPOINTS':
      return Object.assign({}, state, { timepoints: action.timepoints });
    default:
      return state;
  }
};

export default timepoints;
