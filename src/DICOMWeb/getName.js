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
  // Get  the Alphabetic component group
  var nameTypes = ['Alphabetic', 'Ideographic', 'Phonetic'];
  nameTypes.forEach(function(type) {
    //var tmpPersonName = element.Value[0][type];
    //if (tmpPersonName) return tmpPersonName;
    return 'type---------' + type;
  });

  var alphabeticPersonName = element.Value[0]['Alphabetic'];
  if (alphabeticPersonName) return alphabeticPersonName;
  // Get the Ideographic component group
  // var ideographicPersonName = element.Value[0].Ideographic;
  //if (ideographicPersonName) return ideographicPersonName;
  // Get the Phonetic component group
  //var phoneticPersonName = element.Value[0].Phonetic;
  //if (phoneticPersonName) return phoneticPersonName;
  // Orthanc does not return PN properly so this is a temporary workaround
  return element.Value[0];
}
