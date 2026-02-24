const { _: Lodash } = require('lodash');
const {
  MotionTarget
} = require('./motion-sensor');
const {
  ButtonTarget
} = require('./button');
const {
  CurtainTarget
} = require('./curtain');

class Config {
  devices = []
  curtains = []
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
    configDevices.forEach((device) => {
      this.deviceInit(device);
    });
  }

  static init(config, client) {
    if (!this.instance) {
      this.instance = new Config(config, client);
    }
    return this.instance;
  }
  
  get devices() {
    return this.devices;
  }

  deviceInit(configDevice) {
    const exist = Lodash.find(this.devices, {
      name: configDevice.name,
    })
    if (exist) {
      return exist;
    }

    const {
      name,
      model,
      config,
    } = configDevice;

    const additions = {};
    const modelDetails = Lodash.find(this.configProducts, { model });
    additions.modelDetails = modelDetails;

    const topic = `zigbee2mqtt/${name}`;
    this.client.subscribe(`${topic}`);
    console.log(`subscribed ${topic}`);

    // Motion Sensor
    if (model === 'RTCGQ01LM' && config) {
      const {
        targets,
      } = config;
      const {
        on,
        off,
      } = targets;
      const onGroup = Lodash.find(this.configGroups, {
        name: on
      });
      const offGroup = Lodash.find(this.configGroups, {
        name: off
      });

      // new properties
      additions.onGroup = onGroup;
      additions.offGroup = offGroup;
      additions.o = new MotionTarget(Object.assign(configDevice, {
        onGroup,
        offGroup,
      }), this.client);
    }

    if (modelDetails.type === 'button' && config) {
      const {
        depends: configDepends,
        binds: configBinds,
      } = config;

      // Motion Sensors
      const dependDevices = [];
      if (configDepends) {
        configDepends.forEach((depend) => {
          const configDevice = Lodash.find(this.configDevices, {
            name: depend
          });
          if (configDevice) {
            const device = this.deviceInit(configDevice);
            dependDevices.push(device);
          }
        });
      }

      // Curtains
      const bindTargets = [];
      if (configBinds) {
        configBinds.forEach((bind) => {
          const bindTarget = Lodash.find(this.configTargets, {
            name: bind
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
        });
      }

      // new properies
      additions.dependDevices = dependDevices;
      additions.bindTargets = bindTargets;
      additions.o = new ButtonTarget(Object.assign(configDevice, {
        dependDevices,
        bindTargets,
      }), this.client, this.configGroups);
    }
  
    const device = Object.assign(configDevice, additions);
    this.devices.push(device);
    return device;
  }
}
const exportFunctions = {
  Config,
};

module.exports = exportFunctions;