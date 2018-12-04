import {migrate} from 'storage-versions';

import {getSupportedArea} from './storage';

async function initStorage(area = 'local') {
  area = await getSupportedArea(area);
  const context = require.context('storage/versions', true, /\.(?:js|json)$/i);
  return migrate(context, {area});
}

export {initStorage};
