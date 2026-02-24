const { _: Lodash } = require('lodash');
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
  constructor(device, client, configGroups) {
    this.device = device
    this.client = client
    this.configGroups = configGroups;

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
    if (value && value.toLowerCase()) {
      const configAction = config[value.toLowerCase()];
      const {
        group: groupName,
        action: actionText,
      } = configAction;

      const fnFindGroup = (name) => {
        const allDevices = [];
        const group = Lodash.find(this.configGroups, {
          name,
        });
        if (group) {
           const {
            devices,
            groups,
           } = group;
           if (devices) {
            allDevices.push(...devices);
           }
           if (groups) {
            groups.forEach((group) => {
              const devices = fnFindGroup(group);
              allDevices.push(...devices);
            });
           }
        }
        return allDevices;
      }
      const deviceTargets = fnFindGroup(groupName);
      deviceTargets.forEach((target) => {
        console.log(`${target}: ${actionText}`)
        this.client.publish(`zigbee2mqtt/${target}/set`, `{ "state": "${actionText.toUpperCase()}" }`, { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      });
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
}

const exportFunctions = {
  Button,
  ButtonTarget,
};

module.exports = exportFunctions;