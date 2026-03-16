class Light {
  constructor(topic, payload, target) {
    this.topic = topic;
    this.payload = payload;
    this.target = target;
    const lightTarget = target.o;
    const {
      state,
      brightness,
     } = payload;
     if (state) {
      console.log(`Set state: ${state}`);
      lightTarget.state = state;
     }
     if (brightness) {
      console.log(`Set brightness: ${brightness}`);
      lightTarget.brightness = brightness;
     }
  }
}

class LightTarget {
  brightness = 0
  state = 'OFF'
  constructor(target, client) {
    this.target = target
    this.client = client
  }
  get targetName() {
    return this.target?.name;
  }
  get brightness() {
    return this.brightness;
  }
  set brightness(value) {
    this.brightness = value;
  }
  get state() {
    return this.state;
  }
  set state(value) {
    this.state = value;
  }
}

const exportFunctions = {
  LightTarget,
  Light,
};

module.exports = exportFunctions;
