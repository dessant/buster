import browser from 'webextension-polyfill';

const message = 'Add simulateUserInput option';

const revision = 't335iRDhZ8';
const downRevision = 'ZtLMLoh1ag';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    simulateUserInput: false
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['simulateUserInput']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
