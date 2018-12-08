import browser from 'webextension-polyfill';

const message = 'Add Microsoft Azure Speech to Text API';

const revision = 'UidMDYaYA';
const downRevision = 'ONiJBs00o';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    microsoftSpeechApiLoc: 'eastUs', // 'eastUs', 'eastUs2', 'westUs', 'westUs2', 'eastAsia', 'southeastAsia', 'westEu', 'northEu'
    microsoftSpeechApiKey: ''
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['microsoftSpeechApiLoc', 'microsoftSpeechApiKey']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
