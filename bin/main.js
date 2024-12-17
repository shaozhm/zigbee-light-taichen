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
})

client.on('message', function(topic, message) {
  console.log(`[${topic}] message: `, message.toString());
  if (topic.startsWith('zigbee2mqtt')) {
    console.log('button message', message.toString());
    const mesgJSON = JSON.parse(message.toString());
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