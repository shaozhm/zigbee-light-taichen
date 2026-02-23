const { _: Lodash } = require('lodash');

class Basic {
  constructor(topic, payload, device) {
    this.topic = topic;
    this.payload = payload;
    this.device = device;
  }

  checkTopicProperty(topicEndString, property) {
    return this.topic.endsWith(topicEndString) && Lodash.isObject(this.payload) && Lodash.has(this.payload, property) && !Lodash.isNil(this.payload[property]);
  }
  checkTopicsProperty(topics, property) {
    const value = [].concat(topics).some((topic) => this.checkTopicProperty(topic, property));
    console.log(`checkTopicsProperty: ${[].concat(topics).join(',')}: ${value}`);
    return value;
  }
}

const exportFunctions = {
  Basic,
};

module.exports = exportFunctions;