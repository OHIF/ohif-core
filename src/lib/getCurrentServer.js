import { OHIF } from 'meteor/ohif:core';

/**
 * Retrieves the current server configuration used to retrieve studies
 */
OHIF.servers.getCurrentServer = () => {
    return window.store.state.servers.find(server => server.active === true);
};
