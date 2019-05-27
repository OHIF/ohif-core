import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'

import {
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  CLEAR_VIEWPORT,
  SET_SPECIFIC_DATA,
  SET_ACTIVE_SPECIFIC_DATA,
} from './../constants/ActionTypes.js'

const defaultState = {
  activeViewportIndex: 0,
  layout: {
    viewports: [
      {
        height: '100%',
        width: '100%',
      },
    ],
  },
  viewportSpecificData: {},
}

/**
 * @param {Object} [state=defaultState]
 * @param {Object} action
 * @param {string} [action.type]
 * @param {number} [action.viewportIndex]
 * @param {Object} [action.layout]
 * @param {Object} [action.viewportSpecificData]
 */
const viewports = (state = defaultState, action) => {
  let currentData
  let viewportSpecificData
  let useActiveViewport = false
  switch (action.type) {
    case SET_VIEWPORT_ACTIVE:
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex,
      })
    case SET_VIEWPORT_LAYOUT:
      return Object.assign({}, state, { layout: action.layout })
    case SET_VIEWPORT:
      currentData =
        cloneDeep(state.viewportSpecificData[action.viewportIndex]) || {}
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[action.viewportIndex] = merge(
        {},
        currentData,
        action.data
      )

      return Object.assign({}, state, { viewportSpecificData })
    case SET_ACTIVE_SPECIFIC_DATA:
      useActiveViewport = true
    case SET_SPECIFIC_DATA:
      const viewportIndex = useActiveViewport
        ? state.activeViewportIndex
        : action.viewportIndex
      currentData = cloneDeep(state.viewportSpecificData[viewportIndex]) || {}
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[viewportIndex] = merge({}, currentData, action.data)

      return Object.assign({}, state, { viewportSpecificData })
    case CLEAR_VIEWPORT:
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[action.viewportIndex] = {}

      return Object.assign({}, state, { viewportSpecificData })
    default:
      return state
  }
}

export default viewports
