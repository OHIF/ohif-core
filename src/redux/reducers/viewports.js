const defaultState = {
    activeViewportIndex: 0,
    layout: {
      viewports: [
        {
          height: '100%',
          width: '100%'
        }
      ]
    }
}

const viewports = (state = defaultState, action) => {
    switch (action.type) {
        case 'SET_VIEWPORT_ACTIVE':
            return Object.assign({}, state, { activeViewportIndex: action.viewportIndex });
        case 'SET_LAYOUT':
            return Object.assign({}, state, { layout: action.layout });
        default:
            return state;
    }
};

export default viewports;
