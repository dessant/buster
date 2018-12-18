import browser from 'webextension-polyfill';

import {initStorage} from 'storage/init';
import storage from 'storage/storage';
import {showNotification, showContributePage} from 'utils/app';

function challengeRequestCallback(details) {
  const url = new URL(details.url);
  if (url.searchParams.get('hl') !== 'en') {
    url.searchParams.set('hl', 'en');
    return {redirectUrl: url.toString()};
  }
}

async function setChallengeLocale() {
  const {loadEnglishChallenge} = await storage.get(
    'loadEnglishChallenge',
    'sync'
  );

  if (loadEnglishChallenge) {
    if (
      !browser.webRequest.onBeforeRequest.hasListener(challengeRequestCallback)
    ) {
      browser.webRequest.onBeforeRequest.addListener(
        challengeRequestCallback,
        {
          urls: [
            'https://www.google.com/recaptcha/api2/anchor*',
            'https://www.google.com/recaptcha/api2/bframe*'
          ],
          types: ['sub_frame']
        },
        ['blocking']
      );
    }
  } else if (
    browser.webRequest.onBeforeRequest.hasListener(challengeRequestCallback)
  ) {
    browser.webRequest.onBeforeRequest.removeListener(challengeRequestCallback);
  }
}

async function onMessage(request, sender, sendResponse) {
  if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type
    });
  } else if (request.id === 'captchaSolved') {
    let {useCount} = await storage.get('useCount', 'sync');
    useCount += 1;
    await storage.set({useCount}, 'sync');
    if ([30, 100].includes(useCount)) {
      await showContributePage('use');
    }
  }
}

async function onStorageChange(changes, area) {
  await setChallengeLocale();
}

function addStorageListener() {
  browser.storage.onChanged.addListener(onStorageChange);
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

async function onLoad() {
  await initStorage('sync');
  await setChallengeLocale();
  addStorageListener();
  addMessageListener();
}

document.addEventListener('DOMContentLoaded', onLoad);
