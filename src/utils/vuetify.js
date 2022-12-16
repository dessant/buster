import {createVuetify} from 'vuetify';

import storage from 'storage/storage';
import {getDarkColorSchemeQuery} from 'utils/common';

const LightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6750A4',
    secondary: '#625B71'
  }
};

const DarkTheme = {
  dark: true,
  colors: {
    background: '#1C1B1F',
    surface: '#1C1B1F',
    primary: '#D0BCFF',
    secondary: '#CCC2DC'
  }
};

async function configTheme(vuetify) {
  async function setTheme(theme) {
    if (!theme) {
      ({appTheme: theme} = await storage.get('appTheme'));
    }

    if (theme === 'auto') {
      theme = getDarkColorSchemeQuery().matches ? 'dark' : 'light';
    }

    document.documentElement.style.setProperty('color-scheme', theme);

    vuetify.theme.global.name.value = theme;
  }

  getDarkColorSchemeQuery().addEventListener('change', function () {
    setTheme();
  });

  browser.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local' && changes.appTheme) {
      setTheme(changes.appTheme.newValue);
    }
  });

  await setTheme();
}

async function configVuetify(app) {
  const vuetify = createVuetify({
    theme: {
      themes: {light: LightTheme, dark: DarkTheme}
    }
  });

  await configTheme(vuetify);

  app.use(vuetify);
}

export {configTheme, configVuetify};
