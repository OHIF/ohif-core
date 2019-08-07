import absoluteUrl from './absoluteUrl';

describe('absoluteUrl', () => {
  test('should return /path_1/path_2/path_3/path_to_destination when the window.location.origin is http://dummy.com/path_1/path_2 and the path is /path_3/path_to_destination', () => {
    global.window = Object.create(window);
    const url = 'http://dummy.com/path_1/path_2';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const expectedAbsoluteUrl = absoluteUrl('/path_3/path_to_destination');
    expect(expectedAbsoluteUrl).toEqual(
      '/path_1/path_2/path_3/path_to_destination'
    );
  });

  test('should return / when the path is not defined', () => {
    const expectedAbsoluteUrl = absoluteUrl(undefined);
    expect(expectedAbsoluteUrl).toBe('/');
  });

  test('should return the original path when there is no context on the url', () => {
    global.window = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const expectedAbsoluteUrl = absoluteUrl('path_1/path_2/path_3');
    expect(expectedAbsoluteUrl).toEqual('/path_1/path_2/path_3');
  });

  test('should be able to return multiples paths with the same name', () => {
    global.window = Object.create(window);
    const url = 'http://dummy.com';
    Object.defineProperty(window, 'location', {
      value: {
        origin: url,
      },
      writable: true,
    });
    const expectedAbsoluteUrl = absoluteUrl('path_1/path_1/path_1');
    expect(expectedAbsoluteUrl).toEqual('/path_1/path_1/path_1');
  });
});
