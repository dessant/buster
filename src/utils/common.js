import browser from 'webextension-polyfill';

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
  if (openerTabId !== null && ['chrome', 'opera'].includes(targetEnv)) {
    props.openerTabId = openerTabId;
  }
  return browser.tabs.create(props);
}

async function isAndroid() {
  const {os} = await browser.runtime.getPlatformInfo();
  return os === 'android';
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

    const observer = new MutationObserver(function(mutations, obs) {
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

    const timeoutId = window.setTimeout(function() {
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

export {
  getText,
  createTab,
  isAndroid,
  getActiveTab,
  waitForElement,
  arrayBufferToBase64
};
