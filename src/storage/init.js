import {migrate} from 'wesa';

import {isStorageArea} from './storage';

async function initStorage({area = 'local', data = null, silent = false} = {}) {
  const context = {
    getAvailableRevisions: async ({area} = {}) =>
      (
        await import(/* webpackMode: "eager" */ 'storage/config.json', {
          with: {type: 'json'}
        })
      ).revisions[area],
    getCurrentRevision: async ({area} = {}) =>
      (await browser.storage[area].get('storageVersion')).storageVersion,
    getRevision: async ({area, revision} = {}) =>
      import(
        /* webpackMode: "eager" */ `storage/revisions/${area}/${revision}.js`
      )
  };

  if (area === 'local') {
    await migrateLegacyStorage();
  }

  return migrate(context, {area, data, silent});
}

async function migrateLegacyStorage() {
  if (await isStorageArea({area: 'sync'})) {
    const {storageVersion: syncVersion} =
      await browser.storage.sync.get('storageVersion');
    if (syncVersion && syncVersion.length < 14) {
      const {storageVersion: localVersion} =
        await browser.storage.local.get('storageVersion');

      if (!localVersion || localVersion.length < 14) {
        const syncData = await browser.storage.sync.get(null);
        await browser.storage.local.clear();
        await browser.storage.local.set(syncData);
        await browser.storage.sync.clear();
      }
    }
  }
}

export {initStorage};
