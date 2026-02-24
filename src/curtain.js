class CurtainTarget {
  lastAction = 'stop';
  constructor(target, client) {
    this.client = client
    this.target = target
  }
  get name() {
    return this.target?.name;
  }
  get class() {
    return 'curtain'
  }
  get lastAction() {
    return this.lastAction;
  }
  set lastAction(value) {
    this.lastAction = value;
  }
  action(value) {
    let actionText = 'stop';
    if (value === 'close' || value === 'open') {
      actionText = this.lastAction === value ? 'stop' : value;
    }
    console.log(`${this.name}: ${actionText}`)
    this.client.publish(`zigbee2mqtt/${this.name}/set`, `{ "state": "${actionText}" }`, { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
    this.lastAction = actionText;
  }
}
const exportFunctions = {
  CurtainTarget,
};

module.exports = exportFunctions;