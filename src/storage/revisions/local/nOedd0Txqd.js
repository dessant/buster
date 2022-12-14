const message = 'Add Wit Speech API and tryEnglishSpeechModel option';

const revision = 'nOedd0Txqd';

async function upgrade() {
  const changes = {
    witSpeechApiKeys: {},
    tryEnglishSpeechModel: true
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
