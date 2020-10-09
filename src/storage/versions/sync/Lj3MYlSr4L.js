import browser from 'webextension-polyfill';

const message = 'Add navigateWithKeyboard';

const revision = 'Lj3MYlSr4L';
const downRevision = 'DlgF14Chrh';

const storage = browser.storage.sync;

async function upgrade() {
  const changes = {
    navigateWithKeyboard: false
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove('navigateWithKeyboard');

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
