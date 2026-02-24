const { _: Lodash } = require('lodash');

const {
  Basic,
 } = require('./basic');

class ContactSensor extends Basic {
  constructor(topic, payload, device) {
    super(topic, payload, device);
    const target = device.o;
    const {
      contact,
     } = payload;
     if (target) {
      target.action(contact);
     }
  }
}

class ContactTarget {
  constructor(device, client, configGroups, configTargets) {
    this.device = device
    this.client = client
    this.configGroups = configGroups
    this.configTargets = configTargets
  }
  get deviceName() {
    return this.device?.name;
  }
  action(value) {
    console.log(`Contact Sensor ${this.deviceName}: ${value}`);
    const {
      config,
    } = this.device;
    if (Lodash.isNil(value)) {
      return;
    }
    const actionText = value ? 'on' : 'off';
    const configAction = config[actionText];
    const {
      group: groupName,
      target: targetName,
      action: targetActionText,
    } = configAction;
    if (groupName && targetActionText) {
      const deviceTargets = this.getTargetsViaGroup(groupName);
      deviceTargets.forEach((target) => {
        console.log(`${target}: ${targetActionText}`)
        this.client.publish(`zigbee2mqtt/${target}/set`, `{ "state": "${targetActionText.toUpperCase()}" }`, { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      });
    }
    if (targetName && targetActionText) {
      const target = Lodash.find(this.configTargets, {
        name: targetName,
      });
      if (target) {
        console.log(`${target.name}: ${targetActionText}`)
        this.client.publish(`zigbee2mqtt/${target.name}/set`, `{ "state": "${targetActionText.toUpperCase()}" }`, { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
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
          const devices = this.getTargetsViaGroup(group);
          allTargets.push(...devices);
        });
       }
    }
    return allTargets;
  }
}
const exportFunctions = {
  ContactSensor,
  ContactTarget,
};

module.exports = exportFunctions;