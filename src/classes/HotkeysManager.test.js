import CommandsManager from './CommandsManager.js';
import HotkeysManager from './HotkeysManager.js';
import log from './../log.js';

jest.mock('./CommandsManager.js');
jest.mock('./../log.js');

describe('HotkeysManager', () => {
  let hotkeysManager, commandsManager;

  beforeEach(() => {
    CommandsManager.mockClear();
    log.warn.mockClear();
    commandsManager = new CommandsManager();
    hotkeysManager = new HotkeysManager(commandsManager);
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
    it('sets isEnabled property to false', () => {});

    it('calls hotkeys.pause()', () => {});
  });

  describe('enable()', () => {
    it('sets isEnabled property to true', () => {});

    it('calls hotkeys.unpause()', () => {});
  });

  // getContext
  // getCurrentContext
  // - from store, or class?
  // setHotkeysForContext
  // - isDefault? How do we revert?
  // unsetContext
  // restoreDefaults()
  // destroy()

  describe('registerHotkeys()', () => {
    it('logs a warning and returns undefined if a commandName is not provided', () => {});
    it('updates hotkeyDefinitions property with registered keys', () => {});
    it('calls hotkeys.bind for all keys in array', () => {});
    it('calls hotkeys.unbind if commandName was previously registered, for each previously registered set of keys', () => {});
  });
});
