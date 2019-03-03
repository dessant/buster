import browser from 'webextension-polyfill';
import uuidV4 from 'uuid/v4';

import {
  getText,
  createTab,
  getActiveTab,
  getRandomInt,
  sleep
} from 'utils/common';

function showNotification({message, messageId, title, type = 'info'}) {
  if (!title) {
    title = getText('extensionName');
  }
  if (messageId) {
    message = getText(messageId);
  }
  return browser.notifications.create(`sbi-notification-${type}`, {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: '/src/icons/app/icon-48.png'
  });
}

function getOptionLabels(data, scope = 'optionValue') {
  const labels = {};
  for (const [group, items] of Object.entries(data)) {
    labels[group] = [];
    items.forEach(function(value) {
      labels[group].push({
        id: value,
        label: getText(`${scope}_${group}_${value}`)
      });
    });
  }
  return labels;
}

async function showContributePage(action = false) {
  const activeTab = await getActiveTab();
  let url = browser.extension.getURL('/src/contribute/index.html');
  if (action) {
    url = `${url}?action=${action}`;
  }
  await createTab(url, {index: activeTab.index + 1});
}

function meanSleep(ms) {
  const maxDeviation = (10 / 100) * ms;
  return sleep(getRandomInt(ms - maxDeviation, ms + maxDeviation));
}

function sendNativeMessage(port, message, {timeout = 10000} = {}) {
  return new Promise((resolve, reject) => {
    const id = uuidV4();
    message.id = id;

    const messageCallback = function(msg) {
      if (msg.id !== id) {
        return;
      }
      removeListeners();
      resolve(msg);
    };
    const errorCallback = function() {
      removeListeners();
      reject('No response from native app');
    };
    const removeListeners = function() {
      window.clearTimeout(timeoutId);
      port.onMessage.removeListener(messageCallback);
      port.onDisconnect.removeListener(errorCallback);
    };

    const timeoutId = window.setTimeout(function() {
      errorCallback();
    }, timeout);

    port.onMessage.addListener(messageCallback);
    port.onDisconnect.addListener(errorCallback);

    port.postMessage(message);
  });
}

async function pingClientApp({
  start = true,
  stop = true,
  checkResponse = true
} = {}) {
  if (start) {
    await browser.runtime.sendMessage({id: 'startClientApp'});
  }

  const rsp = await browser.runtime.sendMessage({
    id: 'messageClientApp',
    message: {command: 'ping'}
  });

  if (stop) {
    await browser.runtime.sendMessage({id: 'stopClientApp'});
  }

  if (checkResponse && (!rsp.success || rsp.data !== 'pong')) {
    throw new Error(`Client app response: ${rsp.data}`);
  }

  return rsp;
}

export {
  showNotification,
  getOptionLabels,
  showContributePage,
  meanSleep,
  sendNativeMessage,
  pingClientApp
};
