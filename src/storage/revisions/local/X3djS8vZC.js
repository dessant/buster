const message = 'Add autoUpdateClientApp option';

const revision = 'X3djS8vZC';

async function upgrade() {
  const changes = {
    autoUpdateClientApp: true
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
