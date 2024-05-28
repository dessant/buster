import {createVuetify} from 'vuetify';

import {getAppTheme, addThemeListener} from 'utils/app';

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

async function configTheme(vuetify, {theme = ''} = {}) {
  async function setTheme({theme = '', dispatchChange = true} = {}) {
    if (!theme) {
      theme = await getAppTheme();
    }

    document.documentElement.style.setProperty('color-scheme', theme);
    vuetify.theme.global.name.value = theme;

    if (dispatchChange) {
      document.dispatchEvent(new CustomEvent('themeChange', {detail: theme}));
    }
  }

  addThemeListener(setTheme);

  await setTheme({theme, dispatchChange: false});
}

async function configVuetify(app) {
  const theme = await getAppTheme();

  const vuetify = createVuetify({
    theme: {
      themes: {light: LightTheme, dark: DarkTheme},
      defaultTheme: theme
    },
    defaults: {
      VDialog: {
        eager: true
      },
      VSelect: {
        eager: true
      },
      VSnackbar: {
        eager: true
      },
      VMenu: {
        eager: true
      }
    }
  });

  await configTheme(vuetify, {theme});

  app.use(vuetify);
}

export {configTheme, configVuetify};
