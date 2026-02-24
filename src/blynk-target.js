const blynk_send = '/home/pi/node-v16.15.0-linux-armv7l/bin/blynk-send';
class BlynkTarget {
  constructor(target, client) {
    this.client = client
    this.target = target
  }
  get name() {
    return this.target?.name;
  }
  get class() {
    return 'blynk'
  }
  action(value) {
    console.log(`blynk: ${value}`);
    require('child_process').exec(`${blynk_send} write ${value}`, console.log)
  }
}
const exportFunctions = {
  BlynkTarget,
};

module.exports = exportFunctions;