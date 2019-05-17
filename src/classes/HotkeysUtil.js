import log from '../log'
import commands from '../commands'
import actions from '../redux/actions'
import hotkeys from '../hotkeys'

export default class HotkeysUtil {
  constructor() {
    this.toolCommands = {
      wwwc: 'W/L',
      zoom: 'Zoom',
      angle: 'Angle',
      dragProbe: 'Pixel Probe',
      ellipticalRoi: 'EllipticalRoi',
      rectangleRoi: 'RectangleRoi',
      // magnify: 'Magnify', -- TODO: implement magnify
      annotate: 'Annotate',
      stackScroll: 'StackScroll',
      pan: 'Pan',
      length: 'Length',
      wwwcRegion: 'W/L by Region',
      crosshairs: 'Crosshairs',
    }

    this.viewportCommands = {
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      zoomToFit: 'Zoom to Fit',
      invert: 'Invert',
      flipH: 'Flip Horizontally',
      flipV: 'Flip Vertically',
      rotateR: 'Rotate Right',
      rotateL: 'Rotate Left',
      resetViewport: 'Reset',
      clearTools: 'Clear Tools',
    }

    this.commands = {
      scrollDown: {
        name: 'Scroll Down',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'scrollDown')),
      },
      scrollUp: {
        name: 'Scroll Up',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'scrollUp')),
      },
      scrollFirstImage: {
        name: 'Scroll to First Image',
        action: () =>
          this._dispatchCommand(
            this._getHotKeyCommand(null, 'scrollFirstImage')
          ),
      },
      scrollLastImage: {
        name: 'Scroll to Last Image',
        action: () =>
          this._dispatchCommand(
            this._getHotKeyCommand(null, 'scrollLastImage')
          ),
      },
      previousDisplaySet: {
        name: 'Previous Series',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'previousSeries')),
        disabled: () => !this._canMoveDisplaySets(false),
      },
      nextDisplaySet: {
        name: 'Next Series',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'nextSeries')),
        disabled: () => !this._canMoveDisplaySets(true),
      },
      nextPanel: {
        name: 'Next Image Viewport',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'nextPanel')),
      },
      previousPanel: {
        name: 'Previous Image Viewport',
        action: () =>
          this._dispatchCommand(this._getHotKeyCommand(null, 'previousPanel')),
      },
    }
  }

  _rotate(currentPosition, rotationDegree) {
    return currentPosition === undefined
      ? 0 + rotationDegree
      : currentPosition + rotationDegree
  }

  _dispatchCommand(options) {
    const { setActiveViewportSpecificData } = actions
    window.store.dispatch(
      setActiveViewportSpecificData({
        viewport: options,
      })
    )
  }

  _getHotKeyCommand(currentViewportParameters, toolId) {
    let hotKeyCommand = {
      zoomScale: null,
      rotation: null,
      resetViewport: null,
      invert: null,
      vflip: null,
      hflip: null,
      clearTools: null,
      scrollUp: null,
      scrollDown: null,
      scrollFirstImage: null,
      scrollLastImage: null,
      previousPanel: null,
      nextPanel: null,
      nextSeries: null,
      previousSeries: null,
    }

    switch (toolId) {
      case 'rotateR':
        hotKeyCommand['rotation'] = this._rotate(
          currentViewportParameters.rotation,
          90
        )
        break
      case 'rotateL':
        hotKeyCommand['rotation'] = this._rotate(
          currentViewportParameters.rotation,
          -90
        )
        break
      case 'invert':
        hotKeyCommand['invert'] = !currentViewportParameters.invert
        break
      case 'flipV':
        hotKeyCommand['vflip'] = !currentViewportParameters.vflip
        break
      case 'flipH':
        hotKeyCommand['hflip'] = !currentViewportParameters.hflip
        break
      case 'zoomIn':
        hotKeyCommand.zoomScale = +0.15
        break
      case 'zoomOut':
        hotKeyCommand.zoomScale = -0.15
        break
      case 'zoomToFit':
        hotKeyCommand.zoomScale = 0
        break
      case 'resetViewport':
        hotKeyCommand.resetViewport = !currentViewportParameters.resetViewport
        break
      case 'clearTools':
        hotKeyCommand.clearTools = true
        break
      case 'scrollUp':
        hotKeyCommand.scrollUp = true
        break
      case 'scrollDown':
        hotKeyCommand.scrollDown = true
        break
      case 'scrollFirstImage':
        hotKeyCommand.scrollFirstImage = true
        break
      case 'scrollLastImage':
        hotKeyCommand.scrollLastImage = true
        break
      case 'previousSeries':
        hotKeyCommand.previousSeries = true
        break
      case 'nextSeries':
        hotKeyCommand.nextSeries = true
        break
      case 'nextPanel':
        hotKeyCommand.nextPanel = true
        break
      case 'previousPanel':
        hotKeyCommand.previousPanel = true
        break
    }

    return hotKeyCommand
  }

  _isActiveViewportEmpty() {
    // TODO: check if it is empty using redux. Need to put viewportData into redux.
    // const activeViewport = Session.get('activeViewport') || 0;
    // return $('.imageViewerViewport').eq(activeViewport).hasClass('empty');
    return false
  }

  /**
   * Tools. ex: window/level, zoom, pan etc
   * @param {*} map
   * @param {String} contextName
   */
  _registerToolCommands(map, contextName) {
    Object.keys(map).forEach(toolId => {
      const commandName = map[toolId]
      commands.register(contextName, toolId, {
        name: commandName,
        action: () => {
          const { setToolActive } = actions
          window.store.dispatch(setToolActive(commandName))
        },
        params: toolId,
      })
    })
  }

  /**
   * viewport commands. ex: cine play, pause etc
   * @param {*} map
   * @param {String} contextName
   */
  _registerViewportCommands(map, contextName) {
    const { setActiveViewportSpecificData } = actions

    Object.keys(map).forEach(toolId => {
      const commandName = map[toolId]
      commands.register(contextName, toolId, {
        name: commandName,
        action: () => {
          // Call Redux Action to change viewport data for active viewport

          const state = window.store.getState()
          const viewportIndex = state.viewports.activeViewportIndex
          const viewportSpecificData =
            state.viewports.viewportSpecificData[viewportIndex]
          const currentViewportParameters = viewportSpecificData.viewport || {}

          const hotKeyCommand = this._getHotKeyCommand(
            currentViewportParameters,
            toolId
          )

          window.store.dispatch(
            setActiveViewportSpecificData({
              viewport: hotKeyCommand,
            })
          )

          debugger
        },
        params: toolId,
        disabled: this._isActiveViewportEmpty,
      })
    })
  }

  _canMoveDisplaySets(isNext) {
    return false
    // TODO
    // if (!OHIF.viewerbase.layoutManager) {
    //     return false;
    // } else {
    //     return OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext);
    // }
  }

  /**
   * Register default commands and set global hotkeys listeners
   * @param {String} contextName
   */
  setup(contextName = 'viewer') {
    commands.createContext(contextName)

    this._registerToolCommands(this.toolCommands, contextName)
    this._registerViewportCommands(this.viewportCommands, contextName)

    // TODO: preset wl
    // const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);
    for (let i = 0; i < 10; i++) {
      commands.register(contextName, `WLPreset${i}`, {
        name: `W/L Preset ${i + 1}`,
        action: () => {
          console.log(`TODO: window level preset - WLPreset${i}`)
        },
        params: i,
      })
    }

    // Register viewport navigation commands
    commands.set(contextName, this.commands, true)

    const hotkeysData = window.store.getState().preferences[contextName]
      ? window.store.getState().preferences[contextName].hotKeysData
      : window.store.getState().preferences['viewer'].hotKeysData

    this.setHotkeys(hotkeysData, contextName)

    const { setCommandContext } = actions
    window.store.dispatch(setCommandContext({ context: contextName }))
  }

  /**
   * Updates and sets hotkeys to global listeners
   * @param {*} hotKeysPreferences -- default redux values
   * @param {*} contextName  -- default redux value
   */
  setHotkeys(
    hotKeysPreferences,
    contextName = window.store.getState().commandContext.context
  ) {
    hotKeysPreferences =
      hotKeysPreferences ||
      window.store.getState().preferences[contextName].hotKeysData
    const hotKeys = {}

    Object.keys(hotKeysPreferences).forEach(key => {
      hotKeys[key] = hotKeysPreferences[key].command
    })

    hotkeys.set(contextName, hotKeys, true)
  }
}
