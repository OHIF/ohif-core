/**
 * Retrieves the current server configuration used to retrieve studies
 */
export default function getCurrentServer() {
  return window.store.state.servers.find(server => server.active === true);
};
