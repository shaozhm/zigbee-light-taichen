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
    this.device = device
    this.client = client
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
    const configAction = config[value.toLowerCase()];
    if (configAction) {
      const {
        group,
        action,
      } = configAction;

    }
    if (value.toLowerCase() === 'on') {
      if (this.dependDevices) {
        this.dependDevices.forEach((device) => {
          const target = device.o;
          if (target) {
            target.keepLight = true;
            target.disableSensor = true;
            console.log(`Disable ${target.deviceName} set to: ${target.disableSensor}`);
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
            target.disableSensorOff();
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