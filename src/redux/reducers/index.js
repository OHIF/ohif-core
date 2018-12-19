import { combineReducers } from 'redux';
import tools from './tools.js';
import viewports from './viewports.js';
import servers from './servers.js';

const reducers = {
    tools,
    viewports,
    servers
};

const combinedReducer = combineReducers(reducers);

export { reducers, combinedReducer };
