const { _: Lodash } = require('lodash');

class Basic {
  constructor(topic, payload) {
    this.topic = topic;
    this.payload = payload;
  }

  checkTopicProperty(topicEndString, property) {
    return this.topic.endsWith(topicEndString) && Lodash.isObject(this.payload) && Lodash.has(this.payload, property) && !Lodash.isNil(this.payload[property]);
  }
  checkTopicsProperty(topics, property) {
    return topics.some((topic) => this.checkTopicProperty(topic, property));
  }
  checkTopicsAction(topics) {
    return this.checkTopicsProperty(topics, 'action');
  }
}

const exportFunctions = {
  Basic,
};

module.exports = exportFunctions;