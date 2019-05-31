const defaultState = {
  context: 'viewer',
};

const commandContext = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_COMMAND_CONTEXT':
      return Object.assign({}, state, { context: action.state.context });
    default:
      return state;
  }
};

export default commandContext;
