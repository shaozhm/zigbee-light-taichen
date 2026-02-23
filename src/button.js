const {
  Basic,
 } = require('./basic');

class Button extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
    console.log(`Button Init [${topic}]...`, device);
    const target = device.o;
    if (target) {
      target.action(payload.action);
    }
  }
  get action() {
    return this.payload.action;
  }
  checkTopicsAction(topics) {
    return this.checkTopicsProperty(topics, 'action');
  }
}

class ButtonTarget {
  constructor(device, client) {
    this.client = client
    const {
      dependDevices
    } = device;
    this.dependDevices = dependDevices;
  }
  action(value) {
    if (value.toLowerCase() === 'on' && this.dependDevices) {
      this.dependDevices.forEach((device) => {
        const target = device.o;
        if (target) {
          target.keepLight = true;
          target.disableSensor = true;
          console.log(`Disable ${target.deviceName} set to: ${target.disableSensor}`);
        }
      });
    }
    if (value.toLowerCase() === 'off' && this.dependDevices) {
      this.dependDevices.forEach((device) => {
        const target = device.o;
        if (target) {
          target.disableSensorOff();
        }
      });
    }
  }
}

const exportFunctions = {
  Button,
  ButtonTarget,
};

module.exports = exportFunctions;