const defaultState = {
    servers: []
}

const servers = (state = defaultState, action) => {
    switch (action.type) {
        case 'ADD_SERVER':
            const { servers } = state;
            const alreadyExists = servers.find(server => server.id === action.server.id);

            if (alreadyExists) {
                return state;
            }

            servers.push(action.server);

            if (servers.length === 1) {
                servers[0].active = true;
            }

            return Object.assign({}, state, { servers });
        default:
            return state;
    }
};

export default servers;
