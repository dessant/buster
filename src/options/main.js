import {createApp} from 'vue';

import {configApp, loadFonts} from 'utils/app';
import {configVuetify} from 'utils/vuetify';
import App from './App';

async function init() {
  await loadFonts(['400 14px Roboto', '500 14px Roboto']);

  const app = createApp(App);

  await configApp(app);
  await configVuetify(app);

  app.mount('body');
}

init();
