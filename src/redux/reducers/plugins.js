import { default as OHIFPlugins } from '../../plugins.js';

const defaultState = {
  availablePlugins: []
};

const plugins = (state = defaultState, action) => {
  switch (action.type) {
    case 'ADD_PLUGIN': {
      const { availablePlugins } = state;
      const alreadyExists = availablePlugins.find(plugin => {
        return (
          plugin.id === action.plugin.id && plugin.type === action.plugin.type
        );
      });

      if (alreadyExists) {
        return state;
      }

      availablePlugins.push({
        id: action.plugin.id,
        type: action.plugin.type
      });

      // Not sure where else to put this. We shouldn't store functions in Redux, so I'll do this instead
      OHIFPlugins.availablePlugins.push(action.plugin);

      return Object.assign({}, state, { availablePlugins });
    }
    default: {
      return state;
    }
  }
};

export default plugins;
