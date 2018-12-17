import { combineReducers } from 'redux';
import tools from './tools.js';
import viewports from './viewports.js';
import servers from './servers.js';

const combinedReducer = combineReducers({
    tools,
    viewports,
    servers
});

export default combinedReducer;
