class Devices {
  static instance = null;
  constructor(devices) {
    this.devices = devices;
  }
  static init(devices) {
    if (!Devices.instance) {
      Devices.instance = new Devices(devices);
    }
  }
  static getInstance() {
    return Devices.instance;
  }
  getDevices() {
    return this.devices;
  }
}
const exportFunctions = {
  Devices,
};

module.exports = exportFunctions;