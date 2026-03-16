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

class Targets {
  static instance = null;
  constructor(targets) {
    this.targets = targets;
  }
  static init(targets) {
    if (!Targets.instance) {
      Targets.instance = new Targets(targets);
    }
  }
  static getInstance() {
    return Targets.instance;
  }
  getTargets() {
    return this.targets;
  }
}

const exportFunctions = {
  Devices,
  Targets,
};

module.exports = exportFunctions;