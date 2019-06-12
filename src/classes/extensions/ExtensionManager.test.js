import ExtensionManager from './ExtensionManager.js';

describe('ExtensionManager.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerExtensions()', () => {
    it('calls registerExtension() for each extension', () => {
      // Monkey patch
      const original = ExtensionManager.registerExtension;
      ExtensionManager.registerExtension = jest.fn();

      // SUT
      const fakeStore = { fakeStore: 'hi' };
      const fakeExtensions = [{ one: '1' }, { two: '2' }, { three: '3 ' }];
      ExtensionManager.registerExtensions(fakeStore, fakeExtensions);

      // Assert
      expect(ExtensionManager.registerExtension.mock.calls.length).toBe(3);

      // Restore
      ExtensionManager.registerExtension = original;
    });
  });
});
