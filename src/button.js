const { _: Lodash } = require('lodash');
const {
  Basic,
 } = require('./basic');

class Button extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
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
  constructor(device, client, configGroups, configTargets) {
    this.device = device
    this.client = client
    this.configGroups = configGroups;
    this.configTargets = configTargets;

    const {
      dependDevices, // MotionTarget(motion sensors)
      bindTargets, // curtain
    } = device;
    this.dependDevices = dependDevices; // MotionTarget(motion sensors)
    this.bindTargets = bindTargets; // curtain
  }
  get deviceName() {
    return this.device?.name;
  }
  action(value) {
    console.log(`Bttton ${this.deviceName}: ${value}`);
    const {
      config,
    } = this.device;
    if (value && value.toLowerCase() && config[value.toLowerCase()]) {
      const configAction = config[value.toLowerCase()];
      const {
        group: groupName,
        target: targetName,
        action: actionText,
      } = configAction;
      if (groupName && actionText) {
        const deviceTargets = this.getTargetsViaGroup(groupName);
        deviceTargets.forEach((target) => {
          console.log(`${target}: ${actionText}`)
          this.client.publish(`zigbee2mqtt/${target}/set`, `{ "state": "${actionText.toUpperCase()}" }`, { qos: 0, retain: false }, (error) => {
            if (error) {
              console.error(error)
            }
          })
        });
        if (targetName && actionText) {
          const target = Lodash.find(this.configTargets, {
            name: targetName,
          });
          if (target) {
            console.log(`${target.name}: ${actionText}`)
            this.client.publish(`zigbee2mqtt/${target.name}/set`, `{ "state": "${actionText.toUpperCase()}" }`, { qos: 0, retain: false }, (error) => {
              if (error) {
                console.error(error)
              }
            })
          }
        }
      }
    }
    
    if (value && value.toLowerCase() === 'on') {
      if (this.dependDevices) {
        this.dependDevices.forEach((device) => {
          const target = device.o;
          if (target) {
            target.offSensor();
          }
        });
      }
      if (this.bindTargets) {
        this.bindTargets.forEach((target) => {
          if (target.class === 'curtain') {
            target.action('stop');
          }
        });
      }
    }
    if (value && value.toLowerCase() === 'off') {
      if (this.dependDevices) {
        this.dependDevices.forEach((device) => {
          const target = device.o;
          if (target) {
            target.onSensor();
          }
        });
      }
      if (this.bindTargets) {
        this.bindTargets.forEach((target) => {
          if (target.class === 'curtain') {
            target.action('stop');
          }
        });
      }
    }
    if (value && value.toLowerCase() === 'arrow_left_click' && this.bindTargets) {
        this.bindTargets.forEach((target) => {
          // 关窗帘
          if (target.class === 'curtain') {
            target.action('close');
          }
        });
    }
    if (value && value.toLowerCase() === 'arrow_right_click' && this.bindTargets) {
        this.bindTargets.forEach((target) => {
          // 开窗帘
          if (target.class === 'curtain') {
            target.action('open');
          }
        });
    }
    if (value && value.toLowerCase() === 'single' && this.bindTargets) {
      this.bindTargets.forEach((target) => {
        if (target.class === 'blynk') {
          target.action('on');
        }
      });
    }
    if (value && value.toLowerCase() === 'double' && this.bindTargets) {
      this.bindTargets.forEach((target) => {
        if (target.class === 'blynk') {
          target.action('off');
        }
      });
    }
    if (value && value.toLowerCase() === 'triple' && this.bindTargets) {
      this.bindTargets.forEach((target) => {
        if (target.class === 'blynk') {
          target.action('off');
        }
      });
    }
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
          const devices = fnFindGroup(group);
          allTargets.push(...devices);
        });
       }
    }
    return allTargets;
  }
}

const exportFunctions = {
  Button,
  ButtonTarget,
};

module.exports = exportFunctions;