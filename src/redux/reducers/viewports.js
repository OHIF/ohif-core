import cloneDeep from 'lodash.clonedeep'
import merge from 'lodash.merge'

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

const viewports = (state = defaultState, action) => {
  let viewportSpecificData
  let currentData

  switch (action.type) {
    case 'SET_VIEWPORT_ACTIVE':
      return Object.assign({}, state, {
        activeViewportIndex: action.viewportIndex,
      })
    case 'SET_LAYOUT':
      return Object.assign({}, state, { layout: action.layout })
    case 'SET_VIEWPORT_SPECIFIC_DATA':
      currentData =
        cloneDeep(state.viewportSpecificData[action.viewportIndex]) || {}
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[action.viewportIndex] = merge(
        {},
        currentData,
        action.data
      )

      return Object.assign({}, state, { viewportSpecificData })
    case 'SET_ACTIVE_VIEWPORT_SPECIFIC_DATA':
      currentData =
        cloneDeep(state.viewportSpecificData[state.activeViewportIndex]) || {}
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[state.activeViewportIndex] = merge(
        {},
        currentData,
        action.data
      )

      return Object.assign({}, state, { viewportSpecificData })
    case 'CLEAR_VIEWPORT_SPECIFIC_DATA':
      viewportSpecificData = cloneDeep(state.viewportSpecificData)
      viewportSpecificData[action.viewportIndex] = {}

      return Object.assign({}, state, { viewportSpecificData })
    default:
      return state
  }
}

export default viewports
