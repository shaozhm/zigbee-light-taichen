const {
  Basic,
 } = require('./basic');
 
class LightSensor extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
    const target = device.o;
    const {
      illuminance,
      illuminance_lux,
     } = payload;
     if (illuminance) {
      console.log(`Set illuminance: ${illuminance}`);
      target.illuminance = illuminance;
     }
     if (illuminance_lux) {
      console.log(`Set illuminance_lux: ${illuminance_lux}`);
      target.illuminance_lux = illuminance_lux;
     }
  }
}

class LightTarget {
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
  LightSensor,
  LightTarget,
};

module.exports = exportFunctions;