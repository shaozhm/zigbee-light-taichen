#!/usr/bin/env node
const mqtt = require('mqtt');
const Path = require('path');
const Fs = require('fs');
const { _: Lodash } = require('lodash');
const {
  read,
} = require('../src/yaml');

const {
  Control
} = require('../src/control');

const {
  Config
} = require('../src/config');

const DEFAULT_CONFIGFILE = 'config.yaml';
const configPath = Path.join('.', 'config', DEFAULT_CONFIGFILE);
console.log('Read Config: ', configPath);

if (!Fs.existsSync(configPath)) {
  console.error(`The ${DEFAULT_CONFIGFILE} file doesn't exist in ./config`);
}

const configJson = read(configPath);

const {
  address,
  port,
} = configJson;

console.log("Creating new MQTT client for url: ", address);
const client = mqtt.connect(`mqtt://${address}:${port}`);
client.on('error', function(error) {
  console.log('*** MQTT JS ERROR ***: ' + error);
});

client.on('offline', function() {
  console.log('*** MQTT Client Offline ***');
  client.end();
});

const config = Config.init(configJson, client);
const devices = config.devices;

// 厕所的全局变量定义
let door2contact = false;


client.on('message', function(topic, message) {
  console.log(`[${topic}] message: `, message.toString());
  if (topic.startsWith('zigbee2mqtt')) {
    const deviceName = topic.substring('zigbee2mqtt'.length + 1);
    console.log(`MQTT message: ${message.toString()}`);
    console.log(`device name: ${deviceName}`);
    const mesgJSON = JSON.parse(message.toString());
    const device = Lodash.find(devices, {
      name: deviceName,
    });
    const basic = Control.init(topic, mesgJSON, device);

    // // 厕所的门感应器
    // if (basic.checkTopicProperty('door-2', 'contact')) {
    //   door2contact = mesgJSON.contact;
    //   console.log('door-2 contact', door2contact);
    //   // 如果门关着，人体红外感应器要停止检测。
    //   keepLight2 = mesgJSON.contact;
    //   disableSensor2 = mesgJSON.contact;
    //   console.log(`Disable Sensor 2 set to: `, disableSensor2);
    // }
  }
});