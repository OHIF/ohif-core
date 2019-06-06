/**
 * Returns the Alphabetic, Ideographic,Phonetic version of a PN
 *
 * @param element - The group/element of the element (e.g. '00200013')
 * @param [defaultValue] - The default value to return if the element is not found
 * @returns {*}
 */
export default function getName(element, defaultValue) {
  if (!element) {
    return defaultValue;
  }
  // Value is not present if the attribute has a zero length value
  if (!element.Value) {
    return defaultValue;
  }
  // Sanity check to make sure we have at least one entry in the array.
  if (!element.Value.length) {
    return defaultValue;
  }
  // Get the component group
  var nameTypes = ['Alphabetic', 'Ideographic', 'Phonetic'];
  for (const type of nameTypes) {
    var tmpPersonName = element.Value[0][type];
    if (tmpPersonName) return tmpPersonName;
  }
  // Orthanc does not return PN properly so this is a temporary workaround
  return element.Value[0];
}
