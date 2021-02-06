import browser from 'webextension-polyfill';
import Bowser from 'bowser';

import {targetEnv} from 'utils/config';

const getText = browser.i18n.getMessage;

function createTab(
  url,
  {index = null, active = true, openerTabId = null} = {}
) {
  const props = {url, active};
  if (index !== null) {
    props.index = index;
  }
  if (openerTabId !== null && ['chrome', 'edge', 'opera'].includes(targetEnv)) {
    props.openerTabId = openerTabId;
  }
  return browser.tabs.create(props);
}

async function isAndroid() {
  const {os} = await browser.runtime.getPlatformInfo();
  return os === 'android';
}

async function getPlatform() {
  let {os, arch} = await browser.runtime.getPlatformInfo();
  if (os === 'win') {
    os = 'windows';
  } else if (os === 'mac') {
    os = 'macos';
  }

  if (arch === 'x86-32') {
    arch = '386';
  } else if (arch === 'x86-64' || (arch.startsWith('arm') && os === 'macos')) {
    arch = 'amd64';
  }

  return {os, arch};
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

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    lastFocusedWindow: true,
    active: true
  });
  return tab;
}

function waitForElement(selector, {timeout = 10000} = {}) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(function (mutations, obs) {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        window.clearTimeout(timeoutId);
        resolve(el);
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });

    const timeoutId = window.setTimeout(function () {
      observer.disconnect();
      resolve();
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
  createTab,
  isAndroid,
  getPlatform,
  getBrowser,
  getActiveTab,
  waitForElement,
  arrayBufferToBase64,
  executeCode,
  executeFile,
  scriptsAllowed,
  functionInContext,
  getRandomInt,
  getRandomFloat,
  sleep,
  normalizeAudio,
  sliceAudio
};
