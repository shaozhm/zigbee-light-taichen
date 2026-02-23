const {
  Basic,
 } = require('./basic');

class MotionSensor extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
    const target = device.o;
    if (target) {
      target.action(payload.occupancy);
    }
  }
  get action() {
    return this.payload.occupancy;
  }
  checkTopicsAction(topics) {
    return this.checkTopicsProperty(topics, 'occupancy');
  }
}

class MotionTarget {
  disableSensor = false;
  keepLight = true;
  constructor(device, client) {
    this.client = client
    const {
      config,
      onGroup,
      offGroup,
    } = device;
    const {
      delayOffTime,
    } = config;
    this.device = device
    this.delayOffTime = delayOffTime
    this.onGroup = onGroup
    this.offGroup = offGroup
  }
  get deviceName() {
    return this.device?.name;
  }
  set keepLight(value) {
    this.keepLight = value;
  }
  get keepLight() {
    return this.keepLight;
  }
  set disableSensor(value) {
    this.disableSensor = value;
  }
  get disableSensor() {
    return this.disableSensor;
  }
  disableSensorOff() {
    const timerFunction = () => {
      if (!this.keepLight) {
        this.disableSensor = false;
        console.log(`Disable ${this.device?.name} set to: ${this.disableSensor}`);
      }
    }
    this.keepLight = false;
    setTimeout(timerFunction, this.delayOffTime);
  }
  action(value) {
    if (!this.disableSensor) {
      let devices = null;
      let sendMesg = null;
      if (value) {
        devices = this.onGroup.devices;
        sendMesg = '{ "state": "ON" }';
      } else {
        devices = this.offGroup.devices;
        sendMesg = '{ "state": "OFF" }';
      }
      devices.forEach((device) => {
        console.log(`Send Topic: ${device}, Message: ${sendMesg}`);
        this.client.publish(`zigbee2mqtt/${device}/set`, sendMesg, { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      })
    }
  }
}

const exportFunctions = {
  MotionSensor,
  MotionTarget,
};

module.exports = exportFunctions;