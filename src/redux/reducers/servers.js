import uniqBy from 'lodash/uniqBy'

export const defaultState = {
  servers: [],
}

const servers = (state = defaultState, action) => {
  switch (action.type) {
    case 'ADD_SERVER':
      const servers = uniqBy([...state.servers, action.server], 'id')
      return { ...state, servers }

    case 'SET_SERVERS':
      return { ...state, servers: action.servers }

    default:
      return state
  }
}

export default servers
