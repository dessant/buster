const message = 'Revision description';

const revision = 'DlgF14Chrh';

async function upgrade() {
  const changes = {};
  const {speechService} = await browser.storage.local.get('speechService');
  if (speechService === 'googleSpeechApiDemo') {
    changes.speechService = 'witSpeechApiDemo';
  }

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
