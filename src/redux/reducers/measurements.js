const defaultState = {
  measurements: []
};

const measurements = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_MEASUREMENTS':
      return Object.assign({}, state, { measurements: action.measurements });
    default:
      return state;
  }
};

export default measurements;
