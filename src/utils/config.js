const targetEnv = process.env.TARGET_ENV;

const enableContributions = process.env.ENABLE_CONTRIBUTIONS === 'true';

const storageRevisions = {local: process.env.STORAGE_REVISION_LOCAL};

const clientAppVersion = '0.3.0';

export {targetEnv, enableContributions, storageRevisions, clientAppVersion};
