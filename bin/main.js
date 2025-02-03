#!/usr/bin/env node
const Blynk = require('blynk-library');
const mqtt = require('mqtt');
const Path = require('path');
const Fs = require('fs');
const { _: Lodash } = require('lodash');
const {
  read,
} = require('../src/yaml');

const piToken = 'BO9Ej28AzpoEsaCs0WXiS3mqSO2KE8mZ';
const globalSwitchButtonPin = 1;
const blynkServer = 'sonos.local';
const blynkServerPort = 8442;

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

    if (topic.endsWith('music-button') && mesgJSON) {
      const { action } = mesgJSON;
      const sendBoolean = action === 'single' ? 1 : action === 'double' || action === 'triple' || action === 'quadruple' ? 0 : null;
      if (Lodash.isNumber(sendBoolean)) {
        const blynk = new Blynk.Blynk(piToken, options = {
          connector : new Blynk.TcpClient( options = { addr: blynkServer, port: blynkServerPort })
        });
        blynk.on('connect', () => {
          const bridge = new blynk.WidgetBridge(99);
          bridge.setAuthToken(piToken);
          bridge.virtualWrite(globalSwitchButtonPin, sendBoolean);
          blynk.disconnect(false);
        });
      }
    }
  }
});