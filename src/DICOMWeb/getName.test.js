import getName from './getName.js';
test('Alphabetic test ', () => {
  var eleStr =
    '{' +
    '"00100010":{"vr":"PN","Value":[' +
    '{' +
    '"Alphabetic":"af^ag",' +
    '"Ideographic":"if^ig",' +
    '"Phonetic":"pf^pg"' +
    '}' +
    ']}}';
  var ele = JSON.parse(eleStr);
  const result = getName(ele['00100010'], 'just a test');
  expect(result).toBe('af^ag');
});

test('Ideographic test ', () => {
  var eleStr =
    '{' +
    '"00100010":{"vr":"PN","Value":[' +
    '{' +
    // '"Alphabetic":"af^ag",' +
    '"Ideographic":"if^ig",' +
    '"Phonetic":"pf^pg"' +
    '}' +
    ']}}';
  var ele = JSON.parse(eleStr);
  const result = getName(ele['00100010'], 'just a test');
  expect(result).toBe('if^ig');
});

test('Phonetic test ', () => {
  var eleStr =
    '{' +
    '"00100010":{"vr":"PN","Value":[' +
    '{' +
    // '"Alphabetic":"af^ag",' +
    // '"Ideographic":"if^ig",' +
    '"Phonetic":"pf^pg"' +
    '}' +
    ']}}';
  var ele = JSON.parse(eleStr);
  const result = getName(ele['00100010'], 'just a test');
  expect(result).toBe('pf^pg');
});

test('Orthanc test ', () => {
  var eleStr =
    '{' +
    '"00100010":{"vr":"PN","Value":[' +
    //'{' +
    // '"Alphabetic":"af^ag",' +
    // '"Ideographic":"if^ig",' +
    // '"Phonetic":"pf^pg"' +
    '"test name"' +
    //'}'
    ']}}';
  var ele = JSON.parse(eleStr);
  const result = getName(ele['00100010'], 'just a test');
  expect(result).toBe('test name');
});

test('defaultValue test ', () => {
  var eleStr =
    '{' +
    '"00100010":{"vr":"PN","Value":[' +
    //'{' +
    // '"Alphabetic":"af^ag",' +
    // '"Ideographic":"if^ig",' +
    // '"Phonetic":"pf^pg"' +
    //'"test name"' +
    //'}'
    ']}}';
  var ele = JSON.parse(eleStr);
  const result = getName(ele['00100010'], 'just a test');
  expect(result).toBe('just a test');
});
