const message = 'Add Microsoft Azure Speech to Text API';

const revision = 'UidMDYaYA';

async function upgrade() {
  const changes = {
    microsoftSpeechApiLoc: 'eastUs', // 'eastUs', 'eastUs2', 'westUs', 'westUs2', 'eastAsia', 'southeastAsia', 'westEu', 'northEu'
    microsoftSpeechApiKey: ''
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
