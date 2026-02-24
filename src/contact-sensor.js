const {
  Basic,
 } = require('./basic');

class ContactSensor extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
  }
}

class ContactTarget {
  contact = true
  constructor(device, client) {
    this.device = device
    this.client = client
  }
  get deviceName() {
    return this.device?.name;
  }
}
const exportFunctions = {
  ContactSensor,
  ContactTarget,
};

module.exports = exportFunctions;