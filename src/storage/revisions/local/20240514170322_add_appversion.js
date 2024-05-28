const message = 'Add appVersion';

const revision = '20240514170322_add_appversion';

async function upgrade() {
  const changes = {
    appVersion: ''
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
