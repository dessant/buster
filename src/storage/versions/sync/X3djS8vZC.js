import browser from 'webextension-polyfill';

const message = 'Add autoUpdateClientApp option';

const revision = 'X3djS8vZC';
const downRevision = 't335iRDhZ8';

const storage = browser.storage.sync;

async function upgrade() {
  const changes = {
    autoUpdateClientApp: true
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['autoUpdateClientApp']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
