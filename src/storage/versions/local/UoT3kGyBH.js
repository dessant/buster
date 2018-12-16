import browser from 'webextension-polyfill';

const message = 'Initial version';

const revision = 'UoT3kGyBH';
const downRevision = null;

const storage = browser.storage.local;

async function upgrade() {
  const changes = {
    speechService: 'googleSpeechApiDemo', // 'googleSpeechApiDemo', 'witSpeechApiDemo', 'googleSpeechApi', 'witSpeechApi', 'ibmSpeechApi', 'microsoftSpeechApi'
    googleSpeechApiKey: '',
    installTime: new Date().getTime(),
    useCount: 0
  };

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  return storage.clear();
}

export {message, revision, upgrade, downgrade};
