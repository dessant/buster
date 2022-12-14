import {createApp} from 'vue';

import {configApp} from 'utils/app';
import {configVuetify} from 'utils/vuetify';
import App from './App';

async function init() {
  const app = createApp(App);

  await configApp(app);
  await configVuetify(app);

  app.mount('body');
}

init();
