const configuration = {};

export default class MeasurementApi {
  static setConfiguration(config) {
    Object.assign(configuration, config);
  }

  static getConfiguration() {
    return configuration;
  }

  // TODO: Implement all other functions
}
