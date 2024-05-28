import Bowser from 'bowser';
import audioBufferToWav from 'audiobuffer-to-wav';

import storage from 'storage/storage';
import {targetEnv, mv3} from 'utils/config';

function getText(messageName, substitutions) {
  return browser.i18n.getMessage(messageName, substitutions);
}

function insertCSS({
  files = null,
  css = null,
  tabId = null,
  frameIds = [0],
  allFrames = false,
  origin = 'USER'
}) {
  if (mv3) {
    const params = {target: {tabId, allFrames}};

    if (!allFrames) {
      params.target.frameIds = frameIds;
    }

    if (files) {
      params.files = files;
    } else {
      params.css = css;
    }

    if (targetEnv !== 'safari') {
      params.origin = origin;
    }

    return browser.scripting.insertCSS(params);
  } else {
    const params = {frameId: frameIds[0]};

    if (files) {
      params.file = files[0];
    } else {
      params.code = code;
    }

    return browser.tabs.insertCSS(tabId, params);
  }
}

async function executeScript({
  files = null,
  func = null,
  args = null,
  tabId = null,
  frameIds = [0],
  allFrames = false,
  world = 'ISOLATED',
  injectImmediately = true,
  unwrapResults = true,

  code = ''
}) {
  if (mv3) {
    const params = {target: {tabId, allFrames}, world};

    if (!allFrames) {
      params.target.frameIds = frameIds;
    }

    if (files) {
      params.files = files;
    } else {
      params.func = func;

      if (args) {
        params.args = args;
      }
    }

    if (targetEnv !== 'safari') {
      params.injectImmediately = injectImmediately;
    }

    const results = await browser.scripting.executeScript(params);

    if (unwrapResults) {
      return results.map(item => item.result);
    } else {
      return results;
    }
  } else {
    const params = {frameId: frameIds[0]};

    if (files) {
      params.file = files[0];
    } else {
      params.code = code;
    }

    if (injectImmediately) {
      params.runAt = 'document_start';
    }

    return browser.tabs.executeScript(tabId, params);
  }
}

async function scriptsAllowed({tabId, frameId = 0} = {}) {
  try {
    await executeScript({
      func: () => true,
      code: 'true;',
      tabId,
      frameIds: [frameId]
    });

    return true;
  } catch (err) {}
}

async function createTab({
  url = '',
  index = null,
  active = true,
  openerTabId = null,
  getTab = false
} = {}) {
  const props = {url, active};

  if (index !== null) {
    props.index = index;
  }
  if (openerTabId !== null) {
    props.openerTabId = openerTabId;
  }

  let tab = await browser.tabs.create(props);

  if (getTab) {
    if (targetEnv === 'samsung') {
      // Samsung Internet 13: tabs.create returns previously active tab.
      // Samsung Internet 13: tabs.query may not immediately return newly created tabs.
      let count = 1;
      while (count <= 500 && (!tab || tab.url !== url)) {
        [tab] = await browser.tabs.query({lastFocusedWindow: true, url});

        await sleep(20);
        count += 1;
      }
    }

    return tab;
  }
}

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  return tab;
}

async function isValidTab({tab, tabId = null} = {}) {
  if (!tab && tabId !== null) {
    tab = await browser.tabs.get(tabId).catch(err => null);
  }

  if (tab && tab.id !== browser.tabs.TAB_ID_NONE) {
    return true;
  }
}

let platformInfo;
async function getPlatformInfo() {
  if (platformInfo) {
    return platformInfo;
  }

  if (mv3) {
    ({platformInfo} = await storage.get('platformInfo', {area: 'session'}));
  } else {
    try {
      platformInfo = JSON.parse(window.sessionStorage.getItem('platformInfo'));
    } catch (err) {}
  }

  if (!platformInfo) {
    let os, arch;

    if (targetEnv === 'samsung') {
      // Samsung Internet 13: runtime.getPlatformInfo fails.
      os = 'android';
      arch = '';
    } else if (targetEnv === 'safari') {
      // Safari: runtime.getPlatformInfo returns 'ios' on iPadOS.
      ({os, arch} = await browser.runtime.sendNativeMessage('application.id', {
        id: 'getPlatformInfo'
      }));
    } else {
      ({os, arch} = await browser.runtime.getPlatformInfo());
    }

    platformInfo = {os, arch};

    if (mv3) {
      await storage.set({platformInfo}, {area: 'session'});
    } else {
      try {
        window.sessionStorage.setItem(
          'platformInfo',
          JSON.stringify(platformInfo)
        );
      } catch (err) {}
    }
  }

  return platformInfo;
}

async function getPlatform() {
  if (!isBackgroundPageContext()) {
    return browser.runtime.sendMessage({id: 'getPlatform'});
  }

  let {os, arch} = await getPlatformInfo();

  if (os === 'win') {
    os = 'windows';
  } else if (os === 'mac') {
    os = 'macos';
  }

  if (['x86-32', 'i386'].includes(arch)) {
    arch = '386';
  } else if (['x86-64', 'x86_64'].includes(arch)) {
    arch = 'amd64';
  } else if (arch.startsWith('arm')) {
    arch = 'arm';
  }

  const isWindows = os === 'windows';
  const isMacos = os === 'macos';
  const isLinux = os === 'linux';
  const isAndroid = os === 'android';
  const isIos = os === 'ios';
  const isIpados = os === 'ipados';

  const isMobile = ['android', 'ios', 'ipados'].includes(os);

  const isChrome = targetEnv === 'chrome';
  const isEdge =
    ['chrome', 'edge'].includes(targetEnv) &&
    /\sedg(?:e|a|ios)?\//i.test(navigator.userAgent);
  const isFirefox = targetEnv === 'firefox';
  const isOpera =
    ['chrome', 'opera'].includes(targetEnv) &&
    /\sopr\//i.test(navigator.userAgent);
  const isSafari = targetEnv === 'safari';
  const isSamsung = targetEnv === 'samsung';

  return {
    os,
    arch,
    targetEnv,
    isWindows,
    isMacos,
    isLinux,
    isAndroid,
    isIos,
    isIpados,
    isMobile,
    isChrome,
    isEdge,
    isFirefox,
    isOpera,
    isSafari,
    isSamsung
  };
}

async function isAndroid() {
  const {os} = await getPlatform();
  return os === 'android';
}

function getDarkColorSchemeQuery() {
  return window.matchMedia('(prefers-color-scheme: dark)');
}

function getDayPrecisionEpoch(epoch) {
  if (!epoch) {
    epoch = Date.now();
  }

  return epoch - (epoch % 86400000);
}

function isBackgroundPageContext() {
  const backgroundUrl = mv3
    ? browser.runtime.getURL('/src/background/script.js')
    : browser.runtime.getURL('/src/background/index.html');

  return self.location.href === backgroundUrl;
}

function getExtensionDomain() {
  try {
    const {hostname} = new URL(
      browser.runtime.getURL('/src/background/script.js')
    );

    return hostname;
  } catch (err) {}

  return null;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const length = bytes.byteLength;
  for (var i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return self.btoa(binary);
}

function base64ToArrayBuffer(string) {
  const byteString = self.atob(string);
  const length = byteString.length;

  const array = new Uint8Array(new ArrayBuffer(length));
  for (let i = 0; i < length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return array.buffer;
}

function querySelectorXpath(selector, {rootNode = null} = {}) {
  rootNode = rootNode || document;

  return document.evaluate(
    selector,
    rootNode,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function nodeQuerySelector(
  selector,
  {rootNode = null, selectorType = 'css'} = {}
) {
  rootNode = rootNode || document;

  return selectorType === 'css'
    ? rootNode.querySelector(selector)
    : querySelectorXpath(selector, {rootNode});
}

function findNode(
  selector,
  {
    timeout = 60000,
    throwError = true,
    observerOptions = null,
    rootNode = null,
    selectorType = 'css'
  } = {}
) {
  return new Promise((resolve, reject) => {
    rootNode = rootNode || document;

    const el = nodeQuerySelector(selector, {rootNode, selectorType});
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(function (mutations, obs) {
      const el = nodeQuerySelector(selector, {rootNode, selectorType});
      if (el) {
        obs.disconnect();
        window.clearTimeout(timeoutId);
        resolve(el);
      }
    });

    const options = {
      childList: true,
      subtree: true
    };
    if (observerOptions) {
      Object.assign(options, observerOptions);
    }

    observer.observe(rootNode, options);

    const timeoutId = window.setTimeout(function () {
      observer.disconnect();

      if (throwError) {
        reject(new Error(`DOM node not found: ${selector}`));
      } else {
        resolve();
      }
    }, timeout);
  });
}

async function getBrowser() {
  let name, version;
  try {
    ({name, version} = await browser.runtime.getBrowserInfo());
  } catch (err) {}

  if (!name) {
    ({name, version} = Bowser.getParser(self.navigator.userAgent).getBrowser());
  }

  name = name.toLowerCase();

  return {name, version};
}

async function normalizeAudio(buffer) {
  const ctx = new AudioContext();
  const audioBuffer = await ctx.decodeAudioData(buffer);
  ctx.close();

  const offlineCtx = new OfflineAudioContext(
    1,
    audioBuffer.duration * 16000,
    16000
  );
  const source = offlineCtx.createBufferSource();
  source.connect(offlineCtx.destination);
  source.buffer = audioBuffer;
  source.start();

  return offlineCtx.startRendering();
}

async function sliceAudio({audioBuffer, start, end}) {
  const sampleRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;

  const startOffset = sampleRate * start;
  const endOffset = sampleRate * end;
  const frameCount = endOffset - startOffset;

  const ctx = new AudioContext();
  const audioSlice = ctx.createBuffer(channels, frameCount, sampleRate);
  ctx.close();

  const tempArray = new Float32Array(frameCount);
  for (var channel = 0; channel < channels; channel++) {
    audioBuffer.copyFromChannel(tempArray, channel, startOffset);
    audioSlice.copyToChannel(tempArray, channel, 0);
  }

  return audioSlice;
}

async function prepareAudio(audio, {trimStart = 0, trimEnd = 0} = {}) {
  const audioBuffer = await normalizeAudio(audio);

  const audioSlice = await sliceAudio({
    audioBuffer,
    start: trimStart,
    end: audioBuffer.duration - trimEnd
  });

  return audioBufferToWav(audioSlice);
}

let creatingOffscreenDoc;
async function setupOffscreenDocument({url, reasons, justification} = {}) {
  const offscreenUrl = browser.runtime.getURL(url);
  const existingContexts = await browser.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length) {
    return;
  }

  if (creatingOffscreenDoc) {
    await creatingOffscreenDoc;
  } else {
    creatingOffscreenDoc = browser.offscreen.createDocument({
      url,
      reasons,
      justification
    });
    await creatingOffscreenDoc;
    creatingOffscreenDoc = null;
  }
}

function sendOffscreenMessage(message) {
  return new Promise((resolve, reject) => {
    function removeCallbacks() {
      port.disconnect();
      self.clearTimeout(timeoutId);
    }

    const timeoutId = self.setTimeout(function () {
      removeCallbacks();
      reject();
    }, 20000); // 20 seconds

    const port = browser.runtime.connect({name: 'offscreen'});
    port.postMessage(message);

    port.onMessage.addListener(function (response) {
      port.disconnect();

      resolve(response);
    });
  });
}

function runOnce(name, func) {
  name = `${name}Run`;

  if (!self[name]) {
    self[name] = true;

    if (!func) {
      return true;
    }

    return func();
  }
}

function sleep(ms) {
  return new Promise(resolve => self.setTimeout(resolve, ms));
}

export {
  getText,
  insertCSS,
  executeScript,
  scriptsAllowed,
  createTab,
  getActiveTab,
  isValidTab,
  getPlatformInfo,
  getPlatform,
  isAndroid,
  getDarkColorSchemeQuery,
  getDayPrecisionEpoch,
  isBackgroundPageContext,
  getExtensionDomain,
  getRandomInt,
  getRandomFloat,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  querySelectorXpath,
  nodeQuerySelector,
  findNode,
  getBrowser,
  normalizeAudio,
  sliceAudio,
  prepareAudio,
  setupOffscreenDocument,
  sendOffscreenMessage,
  runOnce,
  sleep
};
