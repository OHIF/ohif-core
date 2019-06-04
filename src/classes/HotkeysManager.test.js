import CommandsManager from './CommandsManager.js';
import HotkeysManager from './HotkeysManager.js';
import hotkeys from './hotkeys';
import log from './../log.js';

jest.mock('./CommandsManager.js');
jest.mock('./hotkeys');
jest.mock('./../log.js');

describe('HotkeysManager', () => {
  let hotkeysManager, commandsManager;

  beforeEach(() => {
    commandsManager = new CommandsManager();
    hotkeysManager = new HotkeysManager(commandsManager);
    CommandsManager.mockClear();
    hotkeys.mockClear();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  it('has expected properties', () => {
    const allProperties = Object.keys(hotkeysManager);
    const expectedProprties = [
      'hotkeyDefinitions',
      'hotkeyDefaults',
      'isEnabled',
    ];

    const containsAllExpectedProperties = expectedProprties.every(expected =>
      allProperties.includes(expected)
    );

    expect(containsAllExpectedProperties).toBe(true);
  });

  it('logs a warning if instantiated without a commandsManager', () => {
    new HotkeysManager();

    expect(log.warn.mock.calls.length).toBe(1);
    expect(log.warn.mock.calls[0][0]).toEqual(
      'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
    );
  });

  describe('disable()', () => {
    beforeEach(() => hotkeys.pause.mockClear());

    it('sets isEnabled property to false', () => {
      hotkeysManager.disable();

      expect(hotkeysManager.isEnabled).toBe(false);
    });

    it('calls hotkeys.pause()', () => {
      hotkeysManager.disable();

      expect(hotkeys.pause.mock.calls.length).toBe(1);
    });
  });

  describe('enable()', () => {
    beforeEach(() => hotkeys.unpause.mockClear());

    it('sets isEnabled property to true', () => {
      hotkeysManager.disable();
      hotkeysManager.enable();

      expect(hotkeysManager.isEnabled).toBe(true);
    });

    it('calls hotkeys.unpause()', () => {
      hotkeysManager.enable();

      expect(hotkeys.unpause.mock.calls.length).toBe(1);
    });
  });

  describe('destroy()', () => {
    it('clears default and definition properties', () => {});
    it('resets all hotkey bindings', () => {});
  });

  describe('setHotkeys()', () => {
    it('calls registerHotkeys for each hotkeyDefinition', () => {});
    it('does not set this.defaultHotkeys by default', () => {});
    it('sets this.defaultHotkeys when isDefaultDefinitions is true', () => {});
  });

  describe('registerHotkeys()', () => {
    it('logs a warning and returns undefined if a commandName is not provided', () => {});
    it('updates hotkeyDefinitions property with registered keys', () => {});
    it('calls hotkeys.bind for all keys in array', () => {});
    it('calls hotkeys.unbind if commandName was previously registered, for each previously registered set of keys', () => {});
  });

  describe('restoreDefaults()', () => {
    it('calls setsHotkeys with an empty array if there are no default hotkeys', () => {});
    it('setsHotkeys using previously cached default values', () => {});
  });
});
