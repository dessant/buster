const message = 'Update services';

const revision = '20221214080901_update_services';

async function upgrade() {
  const changes = {};

  const {witSpeechApiKeys} = await browser.storage.local.get(
    'witSpeechApiKeys'
  );
  delete witSpeechApiKeys['catalan'];
  delete witSpeechApiKeys['telugu'];
  changes.witSpeechApiKeys = witSpeechApiKeys;

  await browser.storage.local.remove('ibmSpeechApiLoc');
  changes.ibmSpeechApiUrl = '';

  changes.microsoftSpeechApiLoc = 'eastus';

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
