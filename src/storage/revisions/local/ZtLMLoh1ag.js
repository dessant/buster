const message = 'Add loadEnglishChallenge option';

const revision = 'ZtLMLoh1ag';

async function upgrade() {
  const changes = {
    loadEnglishChallenge: true
  };

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
