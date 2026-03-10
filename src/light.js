class LightWidget {
  illuminance = 0
  illuminance_lux = 0
  constructor(device, client) {
    this.device = device
    this.client = client
  }
  get deviceName() {
    return this.device?.name;
  }
  get illuminance() {
    return this.illuminance;
  }
  set illuminance(value) {
    this.illuminance = value;
  }
  get illuminance_lux() {
    return this.illuminance_lux;
  }
  set illuminance_lux(value) {
    this.illuminance_lux = value;
  }
}

const exportFunctions = {
  LightWidget,
};

module.exports = exportFunctions;
