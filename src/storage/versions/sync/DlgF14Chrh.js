import browser from 'webextension-polyfill';

const message = 'Revision description';

const revision = 'DlgF14Chrh';
const downRevision = 'X3djS8vZC';

const storage = browser.storage.sync;

async function upgrade() {
  const changes = {};
  const {speechService} = await storage.get('speechService');
  if (speechService === 'googleSpeechApiDemo') {
    changes.speechService = 'witSpeechApiDemo';
  }

  changes.storageVersion = revision;
  return storage.set(changes);
}

async function downgrade() {
  const changes = {};

  changes.storageVersion = downRevision;
  return storage.set(changes);
}

export {message, revision, upgrade, downgrade};
