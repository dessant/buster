const message = 'Initial version';

const revision = '20240514122825_initial_version';

async function upgrade() {
  const changes = {
    platformInfo: null
  };

  changes.storageVersion = revision;
  return browser.storage.session.set(changes);
}

export {message, revision, upgrade};
