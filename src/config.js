const { _: Lodash } = require('lodash');
const {
  MotionConfig,
} = require('./motion-sensor');
const {
  ButtonTarget
} = require('./button');
const {
  CurtainTarget
} = require('./curtain');
const {
  LightTarget
} = require('./light-sensor');
const {
  BlynkTarget
} = require('./blynk-target');
const {
  ContactTarget
} = require('./contact-sensor');
const {
  Devices
} = require('./devices');
class Config {
  curtains = []
  lightSensors = []
  blynks = []
  instance = null;
  constructor(config, client) {
    this.config = config;
    this.client = client;
    const {
      devices: configDevices,
      targets: configTargets,
      products: configProducts,
      groups: configGroups,
    } = config;
    this.configDevices = configDevices;
    this.configTargets = configTargets;
    this.configProducts = configProducts;
    this.configGroups = configGroups;
    const devices = [];
    configDevices.forEach((configDevice) => {
      this.deviceInit(configDevice, devices);
    });
    Devices.init(devices);
    console.log(`Device Number: ${Devices.getInstance().getDevices().length}`);
  }

  static init(config, client) {
    if (!this.instance) {
      this.instance = new Config(config, client);
    }
    return this.instance;
  }

  get curtains() {
    return this.curtains;
  }

  get lightSensors() {
    return this.lightSensors;
  }

  deviceInit(configDevice, devices) {
    const exist = Lodash.find(devices, {
      name: configDevice.name,
    })
    if (exist) {
      return;
    }

    const {
      name,
      model,
      config,
    } = configDevice;

    const additions = {};
    const modelDetails = Lodash.find(this.configProducts, { model });
    additions.modelDetails = modelDetails;

    // Subscribe the topic
    const topic = `zigbee2mqtt/${name}`;
    this.client.subscribe(`${topic}`);
    console.log(`subscribed ${topic}`);

    // Motion Sensor
    if (model === 'RTCGQ01LM' && config) {
      const motionConfig = new MotionConfig(this.client, this, this.configGroups, this.configDevices);
      const deviceAdditions = motionConfig.deviceInit(configDevice, devices);
      Object.assign(additions, deviceAdditions);
    }

    if (modelDetails.type === 'button' && config) {
      const {
        depends: configDepends,
        binds: configBinds,
      } = config;

      // Motion Sensors
      const dependDevices = [];
      if (configDepends) {
        dependDevices.push(...this.dependsInit(configDepends, devices));
      }

      const bindTargets = [];
      if (configBinds) {
        configBinds.forEach((bind) => {
          const {
            name,
          } = bind;
          const bindTarget = Lodash.find(this.configTargets, {
            name,
          });
          // Curtains
          if (bindTarget?.model === 'ZNCLDJ12LM') {
            let curtain = Lodash.find(this.curtains, {
              name: bindTarget.name,
            })
            if (!curtain) {
              curtain = new CurtainTarget(bindTarget, this.client);
              this.curtains.push(curtain);
            }
            bindTargets.push(curtain);
          }
          // Blynk
          if (bindTarget?.model === 'blynk') {
            let blynk = Lodash.find(this.blynks, {
              name: bindTarget.name,
            })
            if (!blynk) {
              blynk = new BlynkTarget(bindTarget, this.client);
              this.blynks.push(blynk);
            }
            bindTargets.push(blynk);
          }
        });
      }

      // new properies
      additions.dependDevices = dependDevices;
      additions.bindTargets = bindTargets;
      additions.o = new ButtonTarget(Object.assign(configDevice, {
        dependDevices,
        bindTargets,
      }), this.client, this.configGroups, this.configTargets);
    }
    
    // Light Sensor
    if (model === 'GZCGQ01LM') {
      let lightSensor = Lodash.find(this.lightSensors, {
        name: configDevice.name,
      })
      if (!lightSensor) {
        lightSensor = new LightTarget(configDevice, this.client);
        this.lightSensors.push(lightSensor);
      }
      additions.o = lightSensor;
    }

    // Contact Sensor
    if (model === 'MCCGQ01LM') {
      const contactSensor = new ContactTarget(configDevice, this.client, this.configGroups, this.configTargets);
      additions.o = contactSensor;
    }

    const device = Object.assign(configDevice, additions);
    devices.push(device);
  }

  dependsInit(configDepends, devices) {
    const dependDevices = [];
    configDepends.forEach((depend) => {
      const {
        name,
      } = depend;
      let device = Lodash.find(devices, {
        name,
      });
      if (!device) {
        const configDevice = Lodash.find(this.configDevices, {
          name,
        });
        if (configDevice) {
          device = this.deviceInit(configDevice, devices);
          devices.push(device);
        }
      }
      if (device) {
        dependDevices.push(device);
      }
    });
    return dependDevices;
  }

  getTargetsViaGroup(groupName) {
    const allTargets = [];
    const group = Lodash.find(this.configGroups, {
      name: groupName,
    });
    if (group) {
       const {
        devices,
        groups,
       } = group;
       if (devices) {
        allTargets.push(...devices);
       }
       if (groups) {
        groups.forEach((group) => {
          const devices = this.getTargetsViaGroup(group);
          allTargets.push(...devices);
        });
       }
    }
    return allTargets;
  }
}
const exportFunctions = {
  Config,
};

module.exports = exportFunctions;