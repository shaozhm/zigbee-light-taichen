#!/usr/bin/env node
const mqtt = require('mqtt');
const Path = require('path');
const Fs = require('fs');
const { _: Lodash } = require('lodash');
const {
  read,
} = require('../src/yaml');

const DEFAULT_CONFIGFILE = 'config.yaml';
const configPath = Path.join('.', 'config', DEFAULT_CONFIGFILE);
console.log('Read Config: ', configPath);

if (!Fs.existsSync(configPath)) {
  console.error(`The ${DEFAULT_CONFIGFILE} file doesn't exist in ./config`);
}

const config = read(configPath);

const {
  address,
  port,
  topics,
} = config;

console.log("Creating new MQTT client for url: ", address);
const client = mqtt.connect(`mqtt://${address}:${port}`);
client.on('error', function(error) {
  console.log('*** MQTT JS ERROR ***: ' + error);
});

client.on('offline', function() {
  console.log('*** MQTT Client Offline ***');
  client.end();
});

topics.forEach((topic) => {
  client.subscribe(`${topic}`);
  console.log(`subscribed ${topic}`);
});

// 厨房的全局变量定义
let disableSensor1 = false;
let keepLight1 = true;

client.on('message', function(topic, message) {
  console.log(`[${topic}] message: `, message.toString());
  console.log(`KeepLight-1/Disable Sensor 1: `, keepLight1, disableSensor1);
  if (topic.startsWith('zigbee2mqtt')) {
    console.log('button message', message.toString());
    const mesgJSON = JSON.parse(message.toString());
    const checkTopicProperty = (topicEndString, property) => topic.endsWith(topicEndString) && Lodash.isObject(mesgJSON) && Lodash.has(mesgJSON, property) && !Lodash.isNil(mesgJSON[property]);

    // 延迟开启厨房人体红外感应器
    const fnDisableSensor1Off = () => {
      if (!keepLight1) {
        disableSensor1 = false;
        console.log(`Disable Sensor 1 set to: `, disableSensor1);
      }
    };

    // 厨房门口主开关
    if (checkTopicProperty('ikea-styrbar-f-1', 'action')) {
      if (mesgJSON.action === 'on') {
        keepLight1 = true;
        disableSensor1 = true;
        console.log(`Disable Sensor 1 set to: `, disableSensor1);
      }
      if (mesgJSON.action === 'off') {
        keepLight1 = false;
        setTimeout(fnDisableSensor1Off, 3000);
      }
    }

    // 厨房的人体红外感应器
    if (checkTopicProperty('move-sensor-1', 'occupancy') && !disableSensor1) {
      const sendMesg = mesgJSON.occupancy ? '{ "state": "ON" }' :  '{ "state": "OFF" }';
      const topic = mesgJSON.occupancy ? 'zigbee2mqtt/ikea-lightstrip-driver-1/set' : 'zigbee2mqtt/kitchen/set';
      console.log(`Send Topic: ${topic}, Message: ${sendMesg}`);
      client.publish(topic, sendMesg, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }

    // 主卧窗帘
    if (checkTopicProperty('ikea-styrbar-d-1', 'action') || 
        checkTopicProperty('ikea-styrbar-d-2', 'action') ||
        checkTopicProperty('ikea-styrbar-d-3', 'action')) {
      console.log(topic, mesgJSON);
      if (mesgJSON.action === 'arrow_left_click') {
        // 关窗帘
        console.log('curtain-1 is closing ... ...')
        const curtainTopic = 'zigbee2mqtt/curtain-1/set';
        client.publish(curtainTopic, '{ "state": "close" }', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
      if (mesgJSON.action === 'arrow_right_') {
        //  开窗帘
        console.log('curtain-1 is opening ... ...')
        const curtainTopic = 'zigbee2mqtt/curtain-1/set';
        client.publish(curtainTopic, '{ "state": "open" }', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
      if (mesgJSON.action === 'arrow_left_hold') {
        const curtainTopic = 'zigbee2mqtt/curtain-1/set';
        console.log('curtain-1 is closing ... ...')
        client.publish(curtainTopic, '{ "position": 0 }', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
      if (mesgJSON.action === 'arrow_right_hold') {
        const curtainTopic = 'zigbee2mqtt/curtain-1/set';
        console.log('curtain-1 is opening ... ...')
        client.publish(curtainTopic, '{ "position": 100 }', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
      if (mesgJSON.action === 'arrow_left_release' ||
          mesgJSON.action === 'arrow_right_release') {
        const curtainTopic = 'zigbee2mqtt/curtain-1/set';
        console.log('curtain-1 stop')
        client.publish(curtainTopic, '{ "state": "stop" }', { qos: 0, retain: false }, (error) => {
          if (error) {
            console.error(error)
          }
        })
      }
    }
  }
});