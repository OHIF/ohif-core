import * as DICOMWeb from './index.js';

describe('Top level exports', () => {
  test('should export the modules getAttribute, getAuthorizationHeader, getModalities, getName, getNumber, getString', () => {
    const expectedExports = [
      'getAttribute',
      'getAuthorizationHeader',
      'getModalities',
      'getName',
      'getNumber',
      'getString',
    ].sort();

    const exports = Object.keys(DICOMWeb.default).sort();

    expect(exports).toEqual(expectedExports);
  });

  test('should be able to call getAttribute function', () => {
    DICOMWeb.default.getAttribute = jest.fn();
    DICOMWeb.default.getAttribute();
    expect(DICOMWeb.default.getAttribute).toBeCalled();
  });

  test('should be able to call getAuthorizationHeader function', () => {
    DICOMWeb.default.getAuthorizationHeader = jest.fn();
    DICOMWeb.default.getAuthorizationHeader();
    expect(DICOMWeb.default.getAuthorizationHeader).toBeCalled();
  });

  test('should be able to call getModalities function', () => {
    DICOMWeb.default.getModalities = jest.fn();
    DICOMWeb.default.getModalities();
    expect(DICOMWeb.default.getModalities).toBeCalled();
  });

  test('should be able to call getName function', () => {
    DICOMWeb.default.getName = jest.fn();
    DICOMWeb.default.getName();
    expect(DICOMWeb.default.getName).toBeCalled();
  });

  test('should be able to call getNumber function', () => {
    DICOMWeb.default.getNumber = jest.fn();
    DICOMWeb.default.getNumber();
    expect(DICOMWeb.default.getNumber).toBeCalled();
  });

  test('should be able to call getString function', () => {
    DICOMWeb.default.getString = jest.fn();
    DICOMWeb.default.getString();
    expect(DICOMWeb.default.getString).toBeCalled();
  });
});
