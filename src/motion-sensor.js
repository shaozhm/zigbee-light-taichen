const { _: Lodash } = require('lodash');
const {
  Basic,
} = require('./basic');
const {
  Devices
} = require('./devices');
class MotionConfig {
  constructor(client, config, configGroups, configDevices) {
    this.client = client;
    this.config = config;
    this.configGroups = configGroups;
    this.configDevices = configDevices;
  }
  deviceInit(configDevice, devices) {
    const {
      name,
      model,
      config,
    } = configDevice;
    const {
      targets: configTargets,
      depends: configDepends,
    } = config;
    const {
      on,
      off,
    } = configTargets;
    const onGroup = Lodash.find(this.configGroups, {
      name: on
    });
    const offGroup = Lodash.find(this.configGroups, {
      name: off
    });

    const additions = {
      onGroup,
      offGroup,
    };

    if (configDepends) {
      const dependDevices = this.config.dependsInit(configDepends, devices);
      Object.assign(additions, {
        dependDevices,
      });
    }

    additions.o = new MotionTarget({
      ...configDevice, 
      ...additions,
    }, this.client);
    return additions;
  }
}

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
    this.device = device
    this.client = client
    const {
      config,
      onGroup,
      offGroup,
      dependDevices,
    } = device;
    const {
      delayOffTime,
    } = config;
    this.delayOffTime = delayOffTime
    this.onGroup = onGroup
    this.offGroup = offGroup
    this.dependDevices = dependDevices
  }
  get deviceName() {
    return this.device?.name;
  }
  offSensor() {
    this.keepLight = true;
    this.disableSensor = true;
    console.log(`Disable ${this.device?.name} set to: ${this.disableSensor}`);
  }
  onSensor() {
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
    console.log(`${this.deviceName}: invoke action`);
    const allDevices = Devices.getInstance().getDevices();
    if (!this.disableSensor) {
      let trigger = true;
      if (value) {
        trigger = this.triggerByLightSensor(this.dependDevices, allDevices);
      }
      if (trigger) {
        let devices = null;
        let sendMesg = null;
        if (value) {
          devices = this.onGroup?.devices;
          sendMesg = '{ "state": "ON" }';
        } else {
          devices = this.offGroup?.devices;
          sendMesg = '{ "state": "OFF" }';
        }
        devices && devices.forEach((device) => {
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
  triggerByLightSensor(dependDevices, devices) {
    let trigger = true;
    if (dependDevices) {
      dependDevices.forEach((dependDevice) => {
        const {
          name,
          dependConfig,
        } = dependDevice;
        console.log('dependConfig',dependConfig);
        const device = Lodash.find(devices, {
          name,
        });
        // Light Sensor
        if (device && device.model === 'GZCGQ01LM') {
          const target = device.o;
          if (target) {
            const {
              illuminance_lux
            } = target;
            console.log(`current lux: ${illuminance_lux}`);
            if (dependConfig) {
              const {
                threshold
              } = dependConfig;
              if (threshold) {
                const {
                  lux
                } = threshold;
                if (!Lodash.isNil(illuminance_lux) && !Lodash.isNil(lux) && illuminance_lux >= lux) {
                  trigger = false;
                }
              }
            }
          }
        }
      });
    }
    return trigger;
  }
}

const exportFunctions = {
  MotionConfig,
  MotionSensor,
  MotionTarget,
};

module.exports = exportFunctions;