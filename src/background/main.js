import browser from 'webextension-polyfill';

import {initStorage} from 'storage/init';
import storage from 'storage/storage';
import {showNotification, showContributePage} from 'utils/app';

async function onMessage(request, sender, sendResponse) {
  if (request.id === 'notification') {
    showNotification({
      message: request.message,
      messageId: request.messageId,
      title: request.title,
      type: request.type
    });
    return;
  }

  if (request.id === 'captchaSolved') {
    let {useCount} = await storage.get('useCount', 'sync');
    useCount += 1;
    await storage.set({useCount}, 'sync');
    if ([30, 100].includes(useCount)) {
      await showContributePage('use');
    }
    return;
  }
}

function addMessageListener() {
  browser.runtime.onMessage.addListener(onMessage);
}

async function onLoad() {
  await initStorage('sync');
  addMessageListener();
}

document.addEventListener('DOMContentLoaded', onLoad);
