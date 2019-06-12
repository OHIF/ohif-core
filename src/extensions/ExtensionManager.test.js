import ExtensionManager from './ExtensionManager.js';
import log from './../log.js';

jest.mock('./../log.js');

describe('ExtensionManager.js', () => {
  let extensionManager;

  beforeEach(() => {
    extensionManager = new ExtensionManager();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('registerExtensions()', () => {
    it('calls registerExtension() for each extension', () => {
      extensionManager.registerExtension = jest.fn();

      // SUT
      const fakeExtensions = [{ one: '1' }, { two: '2' }, { three: '3 ' }];
      extensionManager.registerExtensions(fakeExtensions);

      // Assert
      expect(extensionManager.registerExtension.mock.calls.length).toBe(3);
    });
  });

  describe('registerExtension()', () => {});
});
