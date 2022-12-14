const message = 'Add simulateUserInput option';

const revision = 't335iRDhZ8';

async function upgrade() {
  const changes = {
    simulateUserInput: false
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
