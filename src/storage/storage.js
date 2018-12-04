import browser from 'webextension-polyfill';

let syncArea;
async function getSupportedArea(requestedArea) {
  if (typeof syncArea === 'undefined') {
    try {
      await browser.storage.sync.get('');
      syncArea = true;
    } catch (e) {
      syncArea = false;
    }
  }

  return syncArea ? requestedArea : 'local';
}

async function get(keys = null, area = 'local') {
  area = await getSupportedArea(area);
  return browser.storage[area].get(keys);
}

async function set(obj, area = 'local') {
  area = await getSupportedArea(area);
  return browser.storage[area].set(obj);
}

async function remove(keys, area = 'local') {
  area = await getSupportedArea(area);
  return browser.storage[area].remove(keys);
}

async function clear(area = 'local') {
  area = await getSupportedArea(area);
  return browser.storage[area].clear();
}

export default {get, set, remove, clear};
export {getSupportedArea};
