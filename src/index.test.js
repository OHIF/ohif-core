import * as OHIF from './index.js';

describe('Top level exports', () => {
  test('have not changed', () => {
    const expectedExports = [
      'utils',
      'studies',
      'redux',
      'classes',
      'metadata',
      'HotkeysManager',
      'header',
      'cornerstone',
      'default', //
      'string',
      'ui',
      'user',
      'object',
      'CommandsManager',
      'log',
      'DICOMWeb',
      'OHIF', //
      'plugins',
      'extensions',
      'measurements',
      'hangingProtocols',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
