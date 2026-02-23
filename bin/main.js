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
 MotionTarget
} = require('../src/motion-sensor');

const {
  ButtonTarget
} = require('../src/button');

const {
  CurtainTarget
} = require('../src/curtain');

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
  devices: configDevices,
  targets: configTargets,
  products,
  groups,
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

const devices = [];
const curtains = [];
const deviceInit = (configDevice) => {
  const exist = Lodash.find(devices, {
    name: configDevice.name,
  })
  if (exist) {
    return exist;
  }

  const {
    name,
    model,
    config,
  } = configDevice;
  const additions = {};
  const modelDetails = Lodash.find(products, { model });
  additions.modelDetails = modelDetails;

  const topic = `zigbee2mqtt/${name}`;
  client.subscribe(`${topic}`);
  console.log(`subscribed ${topic}`);

  // Motion Sensor
  if (model === 'RTCGQ01LM' && config) {
    const {
      targets,
    } = config;
    const {
      on,
      off,
    } = targets;
    console.log(`on: ${on}`);
    const onGroup = Lodash.find(groups, {
      name: on
    });
    console.log(`onGroup: ${onGroup}`);
    const offGroup = Lodash.find(groups, {
      name: off
    });

    // new properties
    additions.onGroup = onGroup;
    additions.offGroup = offGroup;
    additions.o = new MotionTarget(Object.assign(configDevice, {
      onGroup,
      offGroup,
    }), client);
  }

  if (modelDetails.type === 'button' && config) {
    const {
      depends: configDepends,
      binds: configBinds,
    } = config;

    // Motion Sensors
    const dependDevices = [];
    if (configDepends) {
      configDepends.forEach((depend) => {
        const configDevice = Lodash.find(configDevices, {
          name: depend
        });
        if (configDevice) {
          const device = deviceInit(configDevice);
          dependDevices.push(device);
        }
      });
    }

    const bindTargets = [];
    if (configBinds) {
      configBinds.forEach((bind) => {
        const bindTarget = Lodash.find(configTargets, {
          name: bind
        });
        // Curtains
        if (bindTarget?.model === 'ZNCLDJ12LM') {
          let curtain = Lodash.find(curtains, {
            name: bindTarget.name,
          })
          if (!curtain) {
            curtain = new CurtainTarget(bindTarget, client);
          }
          bindTargets.push(curtain);
        }
      });
    }

    // new properies
    additions.dependDevices = dependDevices;
    additions.bindTargets = bindTargets;
    additions.o = new ButtonTarget(Object.assign(configDevice, {
      dependDevices,
      bindTargets,
    }), client);
  }
  
  const device = Object.assign(configDevice, additions);
  devices.push(device);
  return device;
}

configDevices.forEach((device) => {
  deviceInit(device);
});

// 厕所的全局变量定义
let door2contact = false;

const fnSetTopic = (name) => (`zigbee2mqtt/${name}/set`);

const kitchen_topics_auto_on = [
  fnSetTopic('ikea-lightstrip-driver-1'),
];
const kitchen_topics = [
  ...kitchen_topics_auto_on,
  fnSetTopic('ikea-lightstrip-driver-2'),
];

const bathroom_topics_auto_on = [
  fnSetTopic('ceiling-3'),
  fnSetTopic('ceiling-4'),
];
const bathroom_topics = [
  ...bathroom_topics_auto_on,
  fnSetTopic('ikea-lightstrip-driver-4'),
];

const livingroom_topics = [
  fnSetTopic('led-1'),
  fnSetTopic('led-2'),
  fnSetTopic('led-3'),
];

const store_light_topics = [
  fnSetTopic('ceiling-2'),
];

const main_bedroom_topics = [
  fnSetTopic('hue-bulb-d-1'),
  fnSetTopic('hue-bulb-d-2'),
  fnSetTopic('hue-bulb-d-3'),
];

const studyroom_topics = [
  fnSetTopic('hue-bulb-a-1'),
  fnSetTopic('hue-bulb-a-2'),
  fnSetTopic('hue-bulb-a-3'),
];

const second_bedroom_topics = [
  fnSetTopic('hue-bulb-e-1'),
  fnSetTopic('hue-bulb-e-2'),
  fnSetTopic('hue-bulb-e-3'),
];

const all_light_topics = [
  ...kitchen_topics,
  ...bathroom_topics,
  ...main_bedroom_topics,
  ...studyroom_topics,
  ...second_bedroom_topics,
  ...livingroom_topics,
  ...store_light_topics,
];

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

    // 主卧的床前总控开关
    if ((topic.endsWith('button-1') || topic.endsWith('button-2')) && mesgJSON) {
      const { action } = mesgJSON;
      const sendMesg = action === 'single' ? '{"state": "ON"}' : action === 'double' || action ==='triple' || action === 'quadruple' ? '{"state": "OFF"}' : null
      if (sendMesg) {
        all_light_topics.forEach((topic) => {
          client.publish(topic, sendMesg, { qos: 0, retain: false }, (error) => {
            if (error) {
              console.error(error)
            }
          })
        })
      }
    }

    // 厕所的门感应器
    if (basic.checkTopicProperty('door-2', 'contact')) {
      door2contact = mesgJSON.contact;
      console.log('door-2 contact', door2contact);
      // 如果门关着，人体红外感应器要停止检测。
      keepLight2 = mesgJSON.contact;
      disableSensor2 = mesgJSON.contact;
      console.log(`Disable Sensor 2 set to: `, disableSensor2);
    }
  }
});