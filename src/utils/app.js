import {v4 as uuidv4} from 'uuid';

import storage from 'storage/storage';
import {
  getText,
  getActiveTab,
  getPlatform,
  getDayPrecisionEpoch,
  getRandomInt,
  sleep
} from 'utils/common';
import {targetEnv, enableContributions} from 'utils/config';

async function showNotification({
  message,
  messageId,
  title,
  type = 'info',
  timeout = 0
}) {
  if (!title) {
    title = getText('extensionName');
  }
  if (messageId) {
    message = getText(messageId);
  }
  const notification = await browser.notifications.create(
    `bc-notification-${type}`,
    {
      type: 'basic',
      title,
      message,
      iconUrl: '/src/assets/icons/app/icon-64.png'
    }
  );

  if (timeout) {
    window.setTimeout(() => {
      browser.notifications.clear(notification);
    }, timeout);
  }

  return notification;
}

function getListItems(data, {scope = ''} = {}) {
  const labels = {};
  for (const [group, items] of Object.entries(data)) {
    labels[group] = [];
    items.forEach(function (value) {
      const item = {
        value,
        title: getText(`${scope ? scope + '_' : ''}${value}`)
      };

      labels[group].push(item);
    });
  }
  return labels;
}

async function configApp(app) {
  const platform = await getPlatform();

  document.documentElement.classList.add(platform.targetEnv, platform.os);

  if (app) {
    app.config.globalProperties.$env = platform;
  }
}

async function loadFonts(fonts) {
  await Promise.allSettled(fonts.map(font => document.fonts.load(font)));
}

function processMessageResponse(response, sendResponse) {
  if (targetEnv === 'safari') {
    response.then(function (result) {
      // Safari 15: undefined response will cause sendMessage to never resolve.
      if (result === undefined) {
        result = null;
      }
      sendResponse(result);
    });

    return true;
  } else {
    return response;
  }
}

async function showContributePage({
  action = '',
  activeTab = null,
  setOpenerTab = true,
  updateStats = true
} = {}) {
  if (updateStats) {
    await storage.set({contribPageLastOpen: getDayPrecisionEpoch()});
  }

  if (!activeTab) {
    activeTab = await getActiveTab();
  }
  let url = browser.runtime.getURL('/src/contribute/index.html');
  if (action) {
    url = `${url}?action=${action}`;
  }

  const props = {url, index: activeTab.index + 1, active: true};

  if (
    setOpenerTab &&
    activeTab.id !== browser.tabs.TAB_ID_NONE &&
    (await getPlatform()).os !== 'android'
  ) {
    props.openerTabId = activeTab.id;
  }

  return browser.tabs.create(props);
}

async function autoShowContributePage({
  minUseCount = 0, // 0-1000
  minInstallDays = 0,
  minLastOpenDays = 0,
  minLastAutoOpenDays = 0,
  activeTab = null,
  setOpenerTab = true,
  action = 'auto'
} = {}) {
  if (enableContributions) {
    const options = await storage.get([
      'showContribPage',
      'useCount',
      'installTime',
      'contribPageLastOpen',
      'contribPageLastAutoOpen'
    ]);

    const epoch = getDayPrecisionEpoch();

    if (
      options.showContribPage &&
      options.useCount >= minUseCount &&
      epoch - options.installTime >= minInstallDays * 86400000 &&
      epoch - options.contribPageLastOpen >= minLastOpenDays * 86400000 &&
      epoch - options.contribPageLastAutoOpen >= minLastAutoOpenDays * 86400000
    ) {
      await storage.set({
        contribPageLastOpen: epoch,
        contribPageLastAutoOpen: epoch
      });

      return showContributePage({
        action,
        activeTab,
        setOpenerTab,
        updateStats: false
      });
    }
  }
}

let useCountLastUpdate = 0;
async function updateUseCount({
  valueChange = 1,
  maxUseCount = Infinity,
  minInterval = 0
} = {}) {
  if (Date.now() - useCountLastUpdate >= minInterval) {
    useCountLastUpdate = Date.now();

    const {useCount} = await storage.get('useCount');

    if (useCount < maxUseCount) {
      await storage.set({useCount: useCount + valueChange});
    } else if (useCount > maxUseCount) {
      await storage.set({useCount: maxUseCount});
    }
  }
}

async function processAppUse({
  activeTab = null,
  setOpenerTab = true,
  action = 'auto'
} = {}) {
  await updateUseCount({
    valueChange: 1,
    maxUseCount: 1000
  });

  return autoShowContributePage({
    minUseCount: 10,
    minInstallDays: 14,
    minLastOpenDays: 14,
    minLastAutoOpenDays: 365,
    activeTab,
    setOpenerTab,
    action
  });
}

function meanSleep(ms) {
  const maxDeviation = 0.1 * ms;
  return sleep(getRandomInt(ms - maxDeviation, ms + maxDeviation));
}

function sendNativeMessage(port, message, {timeout = 10000} = {}) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    message.id = id;

    const messageCallback = function (msg) {
      if (msg.id !== id) {
        return;
      }
      removeListeners();
      resolve(msg);
    };
    const errorCallback = function () {
      removeListeners();
      reject('No response from native app');
    };
    const removeListeners = function () {
      window.clearTimeout(timeoutId);
      port.onMessage.removeListener(messageCallback);
      port.onDisconnect.removeListener(errorCallback);
    };

    const timeoutId = window.setTimeout(function () {
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
  getListItems,
  configApp,
  loadFonts,
  processMessageResponse,
  showContributePage,
  autoShowContributePage,
  updateUseCount,
  processAppUse,
  meanSleep,
  sendNativeMessage,
  pingClientApp
};
