import Bowser from 'bowser';

import {targetEnv} from 'utils/config';

function getText(messageName, substitutions) {
  return browser.i18n.getMessage(messageName, substitutions);
}

async function getPlatform({fallback = true} = {}) {
  let os, arch;

  if (targetEnv === 'samsung') {
    // Samsung Internet 13: runtime.getPlatformInfo fails.
    os = 'android';
    arch = '';
  } else {
    try {
      ({os, arch} = await browser.runtime.getPlatformInfo());
    } catch (err) {
      if (fallback) {
        ({os, arch} = await browser.runtime.sendMessage({id: 'getPlatform'}));
      } else {
        throw err;
      }
    }
  }

  if (os === 'win') {
    os = 'windows';
  } else if (os === 'mac') {
    os = 'macos';
  }

  if (
    navigator.platform === 'MacIntel' &&
    (os === 'ios' || typeof navigator.standalone !== 'undefined')
  ) {
    os = 'ipados';
  }

  if (arch === 'x86-32') {
    arch = '386';
  } else if (arch === 'x86-64') {
    arch = 'amd64';
  } else if (arch.startsWith('arm')) {
    arch = 'arm';
  }

  // Client app supports ARM with Rosetta 2
  if (arch === 'arm' && os === 'macos') {
    arch = 'amd64';
  }

  const isWindows = os === 'windows';
  const isMacos = os === 'macos';
  const isLinux = os === 'linux';
  const isAndroid = os === 'android';
  const isIos = os === 'ios';
  const isIpados = os === 'ipados';

  const isMobile = ['android', 'ios', 'ipados'].includes(os);

  const isChrome = targetEnv === 'chrome';
  const isEdge = targetEnv === 'edge';
  const isFirefox = targetEnv === 'firefox';
  const isOpera =
    ['chrome', 'opera'].includes(targetEnv) &&
    / opr\//i.test(navigator.userAgent);
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

async function getBrowser() {
  let name, version;
  try {
    ({name, version} = await browser.runtime.getBrowserInfo());
  } catch (err) {}

  if (!name) {
    ({name, version} = Bowser.getParser(
      window.navigator.userAgent
    ).getBrowser());
  }

  name = name.toLowerCase();

  return {name, version};
}

async function isAndroid() {
  const {os} = await getPlatform();
  return os === 'android';
}

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  return tab;
}

function findNode(
  selector,
  {
    timeout = 60000,
    throwError = true,
    observerOptions = null,
    rootNode = null
  } = {}
) {
  return new Promise((resolve, reject) => {
    rootNode = rootNode || document;

    const el = rootNode.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(function (mutations, obs) {
      const el = rootNode.querySelector(selector);
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

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

function executeCode(string, tabId, frameId = 0, runAt = 'document_start') {
  return browser.tabs.executeScript(tabId, {
    frameId: frameId,
    runAt: runAt,
    code: string
  });
}

function executeFile(file, tabId, frameId = 0, runAt = 'document_start') {
  return browser.tabs.executeScript(tabId, {
    frameId: frameId,
    runAt: runAt,
    file: file
  });
}

async function scriptsAllowed(tabId, frameId = 0) {
  try {
    await browser.tabs.executeScript(tabId, {
      frameId: frameId,
      runAt: 'document_start',
      code: 'true;'
    });
    return true;
  } catch (err) {}
}

async function functionInContext(
  functionName,
  tabId,
  frameId = 0,
  runAt = 'document_start'
) {
  const [isFunction] = await executeCode(
    `typeof ${functionName} === "function"`,
    tabId,
    frameId,
    runAt
  );
  return isFunction;
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
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

export {
  getText,
  isAndroid,
  getPlatform,
  getBrowser,
  getActiveTab,
  findNode,
  arrayBufferToBase64,
  executeCode,
  executeFile,
  scriptsAllowed,
  functionInContext,
  getDarkColorSchemeQuery,
  getDayPrecisionEpoch,
  getRandomInt,
  getRandomFloat,
  sleep,
  normalizeAudio,
  sliceAudio
};
