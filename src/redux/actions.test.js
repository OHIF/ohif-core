import actions from './actions.js'
import * as types from './constants/ActionTypes.js'

describe('actions', () => {
  test('exports have not changed', () => {
    const expectedExports = [
      'setViewportActive',
      'setViewportSpecificData',
      'setLayout',
      'clearViewportSpecificData',
      //
      'setToolActive',
      'setStudyLoadingProgress',
      'clearStudyLoadingProgress',
      'setUserPreferences',
      'setCommandContext',
      'addPlugin',
      'setAvailableButtons',
      'setExtensionData',
      'setTimepoints',
      'setMeasurements',
      'setStudyData',
    ].sort()

    const exports = Object.keys(actions).sort()

    expect(exports).toEqual(expectedExports)
  })

  describe('viewport action creators', () => {
    // setViewportSpecificData,
    // clearViewportSpecificData,
    it('should create an action to set the active viewport', () => {
      const viewportIndex = 1
      const expectedAction = {
        type: types.SET_VIEWPORT_ACTIVE,
        viewportIndex,
      }
      expect(actions.setViewportActive(viewportIndex)).toEqual(expectedAction)
    })

    it('should create an action to set the viewport layout', () => {
      const layout = {
        viewports: [
          {
            height: '100%',
            width: '100%',
          },
        ],
      }
      const expectedAction = {
        type: types.SET_VIEWPORT_LAYOUT,
        layout,
      }
      expect(actions.setLayout(layout)).toEqual(expectedAction)
    })
  })
})
