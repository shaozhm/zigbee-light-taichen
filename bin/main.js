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
    } = config;
    const dependDevices = [];
    configDepends.forEach((depend) => {
      const configDevice = Lodash.find(configDevices, {
        name: depend
      });
      if (configDevice) {
        const device = deviceInit(configDevice);
        dependDevices.push(device);
      }
    });

    // new properies
    additions.dependDevices = dependDevices;
    additions.o = new ButtonTarget(Object.assign(configDevice, {
      dependDevices,
    }), client);
  }
  
  const device = Object.assign(configDevice, additions);
  devices.push(device);
  return device;
}

configDevices.forEach((device) => {
  deviceInit(device);
});

// 厨房的全局变量定义
let disableSensor1 = false;
let keepLight1 = true;

// 厕所的全局变量定义
let disableSensor2 = false;
let keepLight2 = true;
let door2contact = false;

// 主卧窗帘状态
let mainBedroomCurtainAction = 'stop';

const fnLightControlMessage = (mesgJSON, topics_on, topics_off) => {
  let state = null;
  if (mesgJSON?.action?.toLowerCase() === 'on') {
    state = 'on';
  }
  if (mesgJSON?.action?.toLowerCase() === 'off') {
    state = 'off';
  }
  if (state) {
    const message = state === 'on' ? '{ "state": "ON" }' : '{ "state": "OFF" }';
    const topics = state === 'on' ? topics_on : topics_off;
    topics.forEach((topic) => {
      client.publish(topic, message, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    })
  }
  return state;
}

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

// const fnDisableSensorOff = (keepLight, disableSensor, sensorName, delayTime = 3000) => {
//   const timerFunction = () => {
//     if (!keepLight) {
//       disableSensor = false;
//       console.log(`Disable ${sensorName} set to: `, disableSensor);
//     }
//   }
//   keepLight = false;
//   setTimeout(timerFunction, delayTime);
// };

client.on('message', function(topic, message) {
  console.log(`[${topic}] message: `, message.toString());
  console.log(`KeepLight-1/Disable Sensor 1: `, keepLight1, disableSensor1);
  console.log(`KeepLight-2/Disable Sensor 2: `, keepLight2, disableSensor2);
  if (topic.startsWith('zigbee2mqtt')) {
    const deviceName = topic.substring('zigbee2mqtt'.length + 1);
    console.log(`MQTT message: ${message.toString()}`);
    console.log(`device name: ${deviceName}`);
    const mesgJSON = JSON.parse(message.toString());
    const device = Lodash.find(devices, {
      name: deviceName,
    });
    const basic = Control.init(topic, mesgJSON, device);

    // // 厨房门口主开关
    // if (basic.checkTopicsAction('ikea-styrbar-f-1')) {
    //   const state = fnLightControlMessage(mesgJSON, kitchen_topics, kitchen_topics);
    //   if (state === 'on') {
    //     keepLight1 = true;
    //     disableSensor1 = true;
    //     console.log(`Disable Sensor 1 set to: `, disableSensor1);
    //   }
    //   if (state === 'off') {
    //     // 延迟开启厨房人体红外感应器
    //     fnDisableSensorOff(keepLight1, disableSensor1, 'Sensor 1', 3000);
    //   }
    // }

    // // 厨房的人体红外感应器
    // if (basic.checkTopicProperty('move-sensor-1', 'occupancy') && !disableSensor1) {
    //   const sendMesg = mesgJSON.occupancy ? '{ "state": "ON" }' :  '{ "state": "OFF" }';
    //   const topics = mesgJSON.occupancy ? kitchen_topics_auto_on : kitchen_topics;
    //   topics.forEach((topic) => {
    //     console.log(`Send Topic: ${topic}, Message: ${sendMesg}`);
    //     client.publish(topic, sendMesg, { qos: 0, retain: false }, (error) => {
    //       if (error) {
    //         console.error(error)
    //       }
    //     })
    //   })

    // }

    const mainBedroomCurtainTopic = 'zigbee2mqtt/curtain-1/set';
    // 主卧窗帘
    if (basic.checkTopicsAction([
      'ikea-styrbar-d-1',
      'd-2',
      'd-3',
    ])) {
      console.log(topic, mesgJSON);
      if (mesgJSON.action === 'arrow_left_click') {
        // 关窗帘
        mainBedroomCurtainAction = mainBedroomCurtainAction === 'close' ? 'stop' : 'close';
      }
      if (mesgJSON.action === 'arrow_right_click') {
        //  开窗帘
        mainBedroomCurtainAction = mainBedroomCurtainAction === 'open' ? 'stop' : 'open';
      }
      if (mesgJSON?.action?.toLowerCase() === 'on' ||
          mesgJSON?.action?.toLowerCase() === 'off') {
        mainBedroomCurtainAction = 'stop';
      }
      console.log(`curtain-1: ${mainBedroomCurtainAction}`)
      client.publish(mainBedroomCurtainTopic, `{ "state": "${mainBedroomCurtainAction}" }`, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }

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

    // keepLight变量: 表示目前希望开/关灯，但关灯会延迟几秒再执行，当延迟时间到时，执行前需检测 keepLight 变量是否还是 false. 
    // 到那时如果还是 false 则需要关灯，否则不需要执行。

    // // 厕所的主开关
    // if (basic.checkTopicsAction('ikea-styrbar-g-1')) {
    //   const state = fnLightControlMessage(mesgJSON, bathroom_topics, bathroom_topics);

    //   if (state === 'on') {
    //     keepLight2 = true;
    //     disableSensor2 = true;
    //     console.log(`Disable Sensor 2 set to: `, disableSensor2);        
    //   }
    //   if (state === 'off') {
    //     // 延迟开启厕所的人体红外感应器
    //     fnDisableSensorOff(keepLight2, disableSensor2, 'Sensor 2', 3000);
    //   }
    // }

    // 厕所的门感应器
    if (basic.checkTopicProperty('door-2', 'contact')) {
      door2contact = mesgJSON.contact;
      console.log('door-2 contact', door2contact);
      // 如果门关着，人体红外感应器要停止检测。
      keepLight2 = mesgJSON.contact;
      disableSensor2 = mesgJSON.contact;
      console.log(`Disable Sensor 2 set to: `, disableSensor2);
    }

    // // 厕所的人体红外感应器
    // if (basic.checkTopicProperty('move-sensor-2', 'occupancy') && !disableSensor2) {
    //   const sendMesg = mesgJSON.occupancy ? '{ "state": "ON" }' :  '{ "state": "OFF" }';
    //   const topics = mesgJSON.occupancy ? bathroom_topics_auto_on : bathroom_topics;
    //   topics.forEach((topic) => {
    //     console.log(`Send Topic: ${topic}, Message: ${sendMesg}`);
    //     client.publish(topic, sendMesg, { qos: 0, retain: false }, (error) => {
    //       if (error) {
    //         console.error(error)
    //       }
    //     })
    //   })

    // }
  }
});