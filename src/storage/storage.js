import {storageRevisions} from 'utils/config';

async function isStorageArea({area = 'local'} = {}) {
  try {
    await browser.storage[area].get('');
    return true;
  } catch (err) {
    return false;
  }
}

const storageReady = {};
async function isStorageReady({area = 'local'} = {}) {
  if (storageReady[area]) {
    return true;
  } else {
    const {storageVersion} = await browser.storage[area].get('storageVersion');
    if (storageVersion && storageVersion === storageRevisions[area]) {
      storageReady[area] = true;
      return true;
    }
  }

  return false;
}

async function ensureStorageReady({area = 'local'} = {}) {
  if (!storageReady[area]) {
    return new Promise((resolve, reject) => {
      let stop;

      const checkStorage = async function () {
        if (await isStorageReady({area})) {
          window.clearTimeout(timeoutId);
          resolve();
        } else if (stop) {
          reject(new Error(`Storage (${area}) is not ready`));
        } else {
          window.setTimeout(checkStorage, 30);
        }
      };

      const timeoutId = window.setTimeout(function () {
        stop = true;
      }, 60000); // 1 minute

      checkStorage();
    });
  }
}

async function get(keys = null, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return browser.storage[area].get(keys);
}

async function set(obj, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return browser.storage[area].set(obj);
}

async function remove(keys, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return browser.storage[area].remove(keys);
}

async function clear({area = 'local'} = {}) {
  await ensureStorageReady({area});
  return browser.storage[area].clear();
}

export default {get, set, remove, clear};
export {isStorageArea, isStorageReady, ensureStorageReady};
