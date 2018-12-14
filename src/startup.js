// Check the servers on meteor startup
import { Meteor } from "meteor/meteor";

const servers = Meteor.settings.public.servers;

Object.keys(servers).forEach((serverType) => {
    const endpoints = servers[serverType];
    endpoints.forEach((endpoint) => {
        const server = Object.assign({}, endpoint);
        server.type = serverType;

        // TODO: figure out where else to put this function
        window.store.dispatch({
            type: 'ADD_SERVER',
            server
        });
    });
});
