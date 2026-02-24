const {
  Button,
 } = require('./button');
const {
  MotionSensor,
 } = require('./motion-sensor');
 const {
  LightSensor,
 } = require('./light-sensor');

class Control {
  static init(topic, payload, device) {
    const type = device?.modelDetails?.type;
    switch(type) {
      case 'button':
        return new Button(topic, payload, device);
      case 'motion-sensor':
        return new MotionSensor(topic, payload, device);
      case 'light-sensor':
        return new LightSensor(topic, payload, device);
      case 'door-sensor':
      default:
        return null;
    }
    return new Basic(topic, payload, device);
  }
}
const exportFunctions = {
  Control,
};

module.exports = exportFunctions;