const defaultState = {};

const extensions = (state = defaultState, action) => {
  switch (action.type) {
    case 'SET_EXTENSION_DATA':
      const extensionName = action.extension;
      const currentData = state[extensionName] || {};
      const updatedData = Object.assign({}, currentData, action.data);
      const updatedState = state;
      state[extensionName] = updatedData;

      return Object.assign({}, state, updatedState);
    default:
      return state;
  }
};

export default extensions;
