const defaultState = {
  servers: [],
}

const servers = (state = defaultState, action) => {
  switch (action.type) {
    case 'ADD_SERVER':
      const { servers } = state
      const alreadyExists = servers.find(
        server => server.id === action.server.id
      )

      if (alreadyExists) {
        return state
      }

      const newServers =
        servers && servers.length > 0
          ? servers.concat(action.server)
          : [action.server]

      if (newServers.length === 1) {
        newServers[0].active = true
      }

      return Object.assign({}, state, { servers })
    case 'SET_SERVERS':
      return Object.assign({}, state, { servers: action.servers })
    default:
      return state
  }
}

export default servers
