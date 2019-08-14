import sortBy from './sortBy';

describe('sortBy', () => {
  test('should return a valid sort function when sortBy calls a proper data', () => {
    const sortingFunction = sortBy(
      {
        name: 'score',
        reverse: true,
      },
      {
        name: 'study',
        reverse: true,
      },
      {
        name: 'instance',
      },
      {
        name: 'series',
      }
    );

    expect(sortingFunction.toString().replace(/\s/g, '')).toEqual(
      function(A, B) {
        var a, b, field, key, reverse, result, i;

        for (i = 0; i < n_fields; i++) {
          result = 0;
          field = fields[i];
          key = typeof field === 'string' ? field : field.name;
          a = A[key];
          b = B[key];

          if (typeof field.primer !== 'undefined') {
            a = field.primer(a);
            b = field.primer(b);
          }

          reverse = field.reverse ? -1 : 1;

          if (a < b) {
            result = reverse * -1;
          }

          if (a > b) {
            result = reverse * 1;
          }

          if (result !== 0) {
            break;
          }
        }

        return result;
      }
        .toString()
        .replace(/\s/g, '')
    );
  });

  test('should return a valid sorted array when sortBy calls a proper data', () => {
    const sortingFunction = sortBy(
      {
        name: 'score',
        reverse: false,
      },
      {
        name: 'name',
        reverse: true,
      },
      {
        name: 'instance',
      },
      {
        name: 'series',
      }
    );

    let data = [
      { score: 5, name: 'study_e', instance: 5, series: 5 },
      { score: 3, name: 'study_c', instance: 3, series: 3 },
      { score: 1, name: 'study_a', instance: 1, series: 1 },
      { score: 4, name: 'study_d', instance: 4, series: 4 },
      { score: 2, name: 'study_b', instance: 2, series: 2 },
    ];
    const desiredSortedData = [
      { score: 1, name: 'study_a', instance: 1, series: 1 },
      { score: 2, name: 'study_b', instance: 2, series: 2 },
      { score: 3, name: 'study_c', instance: 3, series: 3 },
      { score: 4, name: 'study_d', instance: 4, series: 4 },
      { score: 5, name: 'study_e', instance: 5, series: 5 },
    ];

    data.sort((a, b) => sortingFunction(a, b));

    expect(data).toEqual(desiredSortedData);
  });

  test('should return the same input if the sortBy function is not defined', () => {
    let data = [
      { score: 5, name: 'study_e', instance: 5, series: 5 },
      { score: 3, name: 'study_c', instance: 3, series: 3 },
      { score: 1, name: 'study_a', instance: 1, series: 1 },
      { score: 4, name: 'study_d', instance: 4, series: 4 },
      { score: 2, name: 'study_b', instance: 2, series: 2 },
    ];
    const desiredSortedData = [
      { score: 5, name: 'study_e', instance: 5, series: 5 },
      { score: 3, name: 'study_c', instance: 3, series: 3 },
      { score: 1, name: 'study_a', instance: 1, series: 1 },
      { score: 4, name: 'study_d', instance: 4, series: 4 },
      { score: 2, name: 'study_b', instance: 2, series: 2 },
    ];

    data.sort();

    expect(data).toEqual(desiredSortedData);
  });
});
