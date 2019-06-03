import HotkeysManager from './HotkeysManager.js';

describe('HotkeysManager', () => {
  let hotkeysManager;

  beforeEach(() => {
    hotkeysManager = new HotkeysManager();
  });

  it('has expected properties', () => {
    const allProperties = Object.keys(hotkeysManager);
    const expectedProprties = [
      'contexts',
      'defaults',
      'currentContextName',
      'enabled',
      'storeFunction',
    ];

    // this.contexts = {};
    // this.defaults = {};
    // this.currentContextName = null;
    // this.enabled = true;
    // this.storeFunction = null;

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
