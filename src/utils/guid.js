/**
 * Create a random GUID
 *
 * @return {string}
 */
const guid = () => {
  const getFourRandonValues = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  return (
    getFourRandonValues() +
    getFourRandonValues() +
    '-' +
    getFourRandonValues() +
    '-' +
    getFourRandonValues() +
    '-' +
    getFourRandonValues() +
    '-' +
    getFourRandonValues() +
    getFourRandonValues() +
    getFourRandonValues()
  );
};

export default guid;
