import HotkeysManager from './HotkeysManager.js';
import log from './../log.js';

jest.mock('./../log.js');

describe('HotkeysManager', () => {
  let hotkeysManager;

  beforeEach(() => {
    hotkeysManager = new HotkeysManager();
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

  // disable()
  // enable()
  // getContext
  // getCurrentContext
  // - from store, or class?
  // setHotkeysForContext
  // - isDefault? How do we revert?
  // unsetContext
});
