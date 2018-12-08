import browser from 'webextension-polyfill';

const message = 'Add IBM Speech to Text';

const revision = 'ONiJBs00o';
const downRevision = 'UoT3kGyBH';

const storage = browser.storage.sync;

async function upgrade() {
  const changes = {
    ibmSpeechApiLoc: 'frankfurt', // frankfurt, dallas, washington, sydney, tokyo
    ibmSpeechApiKey: ''
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['ibmSpeechApiLoc', 'ibmSpeechApiKey']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
