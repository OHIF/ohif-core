import log from '../log';
import commands from '../commands';
import actions from '../redux/actions';
import hotkeys from '../hotkeys';

export default class HotkeysUtil {
  constructor() {
    this.toolCommands = {
      wwwc: 'W/L',
      zoom: 'Zoom',
      angle: 'Angle',
      dragProbe: 'Pixel Probe',
      ellipticalRoi: 'Elliptical ROI',
      rectangleRoi: 'Rectangle ROI',
      // magnify: 'Magnify', -- TODO: implement magnify
      annotate: 'Annotate',
      stackScroll: 'StackScroll',
      pan: 'Pan',
      length: 'Length Measurement',
      wwwcRegion: 'W/L by Region',
      crosshairs: 'Crosshairs'
    };

    this.viewerportCommands = {
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      zoomToFit: 'Zoom to Fit',
      invert: 'Invert',
      flipH: 'Flip Horizontally',
      flipV: 'Flip Vertically',
      rotateR: 'Rotate Right',
      rotateL: 'Rotate Left',
      resetViewport: 'Reset',
      clearTools: 'Clear Tools'
    };

    this.commands = {
      scrollDown: {
        name: 'Scroll Down',
        action: () => log.warn('TODO: scroll down')
      },
      scrollUp: {
        name: 'Scroll Up',
        action: () => log.warn('TODO: scroll up')
      },
      scrollFirstImage: {
        name: 'Scroll to First Image',
        action: () => log.warn('TODO: scroll to first image')
      },
      scrollLastImage: {
        name: 'Scroll to Last Image',
        action: () => log.warn('TODO: scroll last image')
      },
      previousDisplaySet: {
        name: 'Previous Series',
        action: () => console.log('TODO: previous series'),
        disabled: () => !this._canMoveDisplaySets(false)
      },
      nextDisplaySet: {
        name: 'Next Series',
        action: () => console.log('TODO: next display set'),
        disabled: () => !this._canMoveDisplaySets(true)
      },
      nextPanel: {
        name: 'Next Image Viewport',
        action: () => log.warn('TODO: nextpanel')
      },
      previousPanel: {
        name: 'Previous Image Viewport',
        action: () => log.warn('TODO: previous panel')
      }
    };
  }

  _isActiveViewportEmpty() {
    // TODO: check if it is empty using redux. Need to put viewportData into redux.
    // const activeViewport = Session.get('activeViewport') || 0;
    // return $('.imageViewerViewport').eq(activeViewport).hasClass('empty');
    return false;
  }

  /**
   * Tools. ex: window/level, zoom, pan etc
   * @param {*} map
   * @param {String} contextName
   */
  _registerToolCommands(map, contextName) {
    Object.keys(map).forEach(toolId => {
      const commandName = map[toolId];
      commands.register(contextName, toolId, {
        name: commandName,
        action: () => {
          const { setToolActive } = actions;
          window.store.dispatch(setToolActive(commandName));
        },
        params: toolId
      });
    });
  }

  /**
   * viewport commands. ex: cine play, pause etc
   * @param {*} map
   * @param {String} contextName
   */
  _registerViewportCommands(map, contextName) {
    Object.keys(map).forEach(toolId => {
      const commandName = map[toolId];
      commands.register(contextName, toolId, {
        name: commandName,
        action: () => {
          console.log(
            'TODO: viewportUtils[commandId] - viewport set the active tool ->' +
              commandName
          );
        },
        params: toolId,
        disabled: this._isActiveViewportEmpty
      });
    });
  }

  _canMoveDisplaySets(isNext) {
    return false;
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
    commands.createContext(contextName);

    this._registerToolCommands(this.toolCommands, contextName);
    this._registerViewportCommands(this.viewerportCommands, contextName);

    // TODO: preset wl
    // const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);
    for (let i = 0; i < 10; i++) {
      commands.register(contextName, `WLPreset${i}`, {
        name: `W/L Preset ${i + 1}`,
        action: () => {
          console.log(`TODO: window level preset - WLPreset${i}`);
        },
        params: i
      });
    }

    // Register viewport navigation commands
    commands.set(contextName, this.commands, true);

    const hotkeysData = window.store.getState().preferences[contextName]
      ? window.store.getState().preferences[contextName].hotKeysData
      : window.store.getState().preferences['viewer'].hotKeysData;

    this.setHotkeys(hotkeysData, contextName);

    const { setCommandContext } = actions;
    window.store.dispatch(setCommandContext({ context: contextName }));
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
      window.store.getState().preferences[contextName].hotKeysData;
    const hotKeys = {};

    Object.keys(hotKeysPreferences).forEach(key => {
      hotKeys[key] = hotKeysPreferences[key].command;
    });

    hotkeys.set(contextName, hotKeys, true);
  }
}
