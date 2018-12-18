import browser from 'webextension-polyfill';

const message = 'Add loadEnglishChallenge option';

const revision = 'ZtLMLoh1ag';
const downRevision = 'nOedd0Txqd';

const storage = browser.storage.sync;

async function upgrade() {
  const changes = {
    loadEnglishChallenge: true
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['loadEnglishChallenge']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
