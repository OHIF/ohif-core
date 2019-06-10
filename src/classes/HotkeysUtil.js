// import commands from '../commands';
// import actions from '../redux/actions';
// import hotkeys from '../hotkeys';

// export default class HotkeysUtil {
//   constructor(contextName, { setToolActive, setActiveViewportSpecificData }) {
//     this.toolCommands = {
//       wwwc: 'W/L',
//       zoom: 'Zoom',
//       angle: 'Angle',
//       dragProbe: 'Pixel Probe',
//       ellipticalRoi: 'EllipticalRoi',
//       rectangleRoi: 'RectangleRoi',
//       // magnify: 'Magnify', -- TODO: implement magnify
//       annotate: 'Annotate',
//       stackScroll: 'StackScroll',
//       pan: 'Pan',
//       length: 'Length',
//       wwwcRegion: 'W/L by Region',
//       crosshairs: 'Crosshairs',
//     };

//     this._registerToolCommands(this.toolCommands, contextName, setToolActive);

//     this._registerViewportCommands(
//       this.viewportCommands,
//       contextName,
//       setActiveViewportSpecificData
//     );

//     this.setup(contextName);
//   }

//   /**
//    * Tools. ex: window/level, zoom, pan etc
//    * @param {*} map
//    * @param {String} contextName
//    */
//   _registerToolCommands(map, contextName, setToolActive) {
//     Object.keys(map).forEach(toolId => {
//       const commandName = map[toolId];
//       commands.register(contextName, toolId, {
//         name: commandName,
//         action: () => {
//           // const { setToolActive } = actions
//           setToolActive(commandName);
//         },
//         params: toolId,
//       });
//     });
//   }

//   /**
//    * Register default commands and set global hotkeys listeners
//    * @param {String} contextName
//    */
//   setup(contextName = 'viewer') {
//     // TODO: preset wl
//     // const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);
//     for (let i = 0; i < 10; i++) {
//       commands.register(contextName, `WLPreset${i}`, {
//         name: `W/L Preset ${i + 1}`,
//         action: () => {
//           console.log(`TODO: window level preset - WLPreset${i}`);
//         },
//         params: i,
//       });
//     }

//     // Register viewport navigation commands
//     commands.set(contextName, this.commands, true);

//     //
//     const hotkeysData = window.store.getState().preferences[contextName]
//       ? window.store.getState().preferences[contextName].hotKeysData
//       : window.store.getState().preferences['viewer'].hotKeysData;

//     this.setHotkeys(hotkeysData, contextName);

//     const { setCommandContext } = actions;
//     window.store.dispatch(setCommandContext({ context: contextName }));
//   }

//   /**
//    * Updates and sets hotkeys to global listeners
//    * @param {*} hotKeysPreferences -- default redux values
//    * @param {*} contextName  -- default redux value
//    */
//   setHotkeys(
//     hotKeysPreferences,
//     contextName = window.store.getState().commandContext.context
//   ) {
//     hotKeysPreferences =
//       hotKeysPreferences ||
//       window.store.getState().preferences[contextName].hotKeysData;
//     const hotKeys = {};

//     Object.keys(hotKeysPreferences).forEach(key => {
//       hotKeys[key] = hotKeysPreferences[key].command;
//     });

//     hotkeys.set(contextName, hotKeys, true);
//   }
// }
