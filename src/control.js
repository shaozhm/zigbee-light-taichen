const {
  Button,
 } = require('./button');
const {
  MotionSensor,
 } = require('./motion-sensor');
 const {
  LightSensor,
 } = require('./light-sensor');
 const {
  ContactSensor,
 } = require('./contact-sensor');
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
      case 'contact-sensor':
        return new ContactSensor(topic, payload, device);
      default:
        return null;
    }
  }
}
const exportFunctions = {
  Control,
};

module.exports = exportFunctions;