import browser from 'webextension-polyfill';

const message = 'Add Wit Speech API and tryEnglishSpeechModel option';

const revision = 'nOedd0Txqd';
const downRevision = 'UidMDYaYA';

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    witSpeechApiKeys: {},
    tryEnglishSpeechModel: true
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};
  await storage.remove(['witSpeechApiKeys', 'tryEnglishSpeechModel']);

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
