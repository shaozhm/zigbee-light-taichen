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
    this.curtains = bindTargets; // curtain
  }
  action(value) {
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
    
    if (value.toLowerCase() === 'on') {
      if (this.dependDevices) {
        this.dependDevices.forEach((device) => {
          const target = device.o;
          if (target) {
            target.offSensor();
          }
        });
      }
      if (this.curtains) {
        this.curtains.forEach((curtain) => {
          curtain.action('stop');
        });
      }
    }
    if (value.toLowerCase() === 'off') {
      if (this.dependDevices) {
        this.dependDevices.forEach((device) => {
          const target = device.o;
          if (target) {
            target.onSensor();
          }
        });
      }
      if (this.curtains) {
        this.curtains.forEach((curtain) => {
          curtain.action('stop');
        });
      }
    }
    if (value.toLowerCase() === 'arrow_left_click' && this.curtains) {
        // 关窗帘
        this.curtains.forEach((curtain) => {
          curtain.action('close');
        });
    }
    if (value.toLowerCase() === 'arrow_right_click' && this.curtains) {
        //  开窗帘
        this.curtains.forEach((curtain) => {
          curtain.action('open');
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