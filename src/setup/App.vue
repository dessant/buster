<template>
  <div id="app" v-if="dataLoaded">
    <div class="wrap" v-if="!isInstallSuccess && !isInstallError">
      <div class="title">
        {{ getText('pageContent_installTitle') }}
      </div>
      <div class="desc">
        {{ getText('pageContent_installDesc') }}
      </div>

      <v-textfield
        v-model.trim="appDir"
        :label="getText('inputLabel_appLocation')"
      >
      </v-textfield>

      <div class="manifest-desc" v-if="manifestDirEditable">
        {{ getText('pageContent_manifestLocationDesc') }}
      </div>

      <v-textfield
        v-if="manifestDirEditable"
        v-model.trim="manifestDir"
        :label="getText('inputLabel_manifestLocation')"
      >
      </v-textfield>

      <v-button
        class="button install-button"
        :unelevated="true"
        :disabled="
          isInstalling || !appDir || (manifestDirEditable && !manifestDir)
        "
        :label="getText('buttonText_installApp')"
        @click="runInstall"
      >
      </v-button>
    </div>

    <div class="wrap" v-if="isInstallSuccess">
      <div class="title">{{ getText('pageContent_installSuccessTitle') }}</div>
      <div class="desc">{{ getText('pageContent_installSuccessDesc') }}</div>

      <div class="success-icon">🎉</div>
    </div>

    <div class="wrap" v-if="isInstallError">
      <div class="title error-title">
        {{ getText('pageContent_installErrorTitle') }}
      </div>
      <div class="desc">{{ getText('pageContent_installErrorDesc') }}</div>

      <v-button
        class="button error-button"
        :unelevated="true"
        :label="getText('buttonText_goBack')"
        @click="isInstallError = false"
      >
      </v-button>
    </div>
  </div>
</template>

<script>
import browser from 'webextension-polyfill';
import {Button, TextField} from 'ext-components';

import storage from 'storage/storage';
import {pingClientApp} from 'utils/app';
import {getText} from 'utils/common';
import {targetEnv} from 'utils/config';

export default {
  components: {
    [Button.name]: Button,
    [TextField.name]: TextField
  },

  data: function() {
    const urlParams = new URL(window.location.href).searchParams;
    const apiURL = new URL('http://127.0.0.1/api/v1');
    apiURL.port = urlParams.get('port');

    return {
      dataLoaded: false,

      apiUrl: apiURL.href,
      session: urlParams.get('session'),
      browser: '',
      appDir: '',
      manifestDir: '',
      manifestDirEditable: false,

      isInstalling: false,
      isInstallSuccess: false,
      isInstallError: false
    };
  },

  methods: {
    getText,

    getExtensionId: function() {
      let id = browser.runtime.id;
      if (targetEnv !== 'firefox') {
        const scheme = window.location.protocol;
        id = `${scheme}//${id}/`;
      }

      return id;
    },

    setLocation: async function() {
      try {
        await this.location();
      } catch (err) {
        this.isInstallError = true;
        console.log(err.toString());
      }
    },

    runInstall: async function() {
      this.isInstalling = true;

      try {
        await this.install();
      } catch (err) {
        this.isInstallError = true;
        console.log(err.toString());
      } finally {
        this.isInstalling = false;
      }

      if (this.isInstallSuccess) {
        const data = new FormData();
        data.append('session', this.session);

        await fetch(`${this.apiUrl}/setup/close`, {
          referrer: '',
          mode: 'cors',
          method: 'POST',
          body: data
        });
      }
    },

    location: async function() {
      const data = new FormData();
      data.append('session', this.session);
      data.append('browser', this.browser);
      data.append('targetEnv', targetEnv);

      const rsp = await fetch(`${this.apiUrl}/setup/location`, {
        referrer: '',
        mode: 'cors',
        method: 'POST',
        body: data
      });

      const results = await rsp.json();

      if (rsp.status === 200) {
        this.appDir = results.appDir;
        this.manifestDir = results.manifestDir;
      } else {
        throw new Error(results.error);
      }
    },

    install: async function() {
      const data = new FormData();
      data.append('session', this.session);
      data.append('appDir', this.appDir);
      data.append('manifestDir', this.manifestDir);
      data.append('browser', this.browser);
      data.append('targetEnv', targetEnv);
      data.append('extension', this.getExtensionId());

      const rsp = await fetch(`${this.apiUrl}/setup/install`, {
        referrer: '',
        mode: 'cors',
        method: 'POST',
        body: data
      });

      if (rsp.status === 200) {
        await pingClientApp();
        await storage.set({simulateUserInput: true}, 'sync');

        this.isInstallSuccess = true;
      } else {
        throw new Error((await rsp.json()).error);
      }
    }
  },

  created: async function() {
    this.browser = (await browser.runtime.sendMessage({id: 'getBrowser'})).name;

    await this.setLocation();

    const {os} = await browser.runtime.sendMessage({id: 'getPlatform'});
    if (os !== 'windows') {
      this.manifestDirEditable = true;
    }

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/theme/mixins';
@import '@material/typography/mixins';
@import '@material/button/mixins';

body {
  @include mdc-typography-base;
  font-size: 100%;
  background-color: #ecf0f1;
  margin: 0;
}

#app {
  display: flex;
  justify-content: center;
  padding: 12px;
}

.wrap {
  display: flex;
  flex-direction: column;
  max-width: 400px;
}

.title,
.desc,
.manifest-desc {
  @include mdc-theme-prop(color, text-primary-on-light);
}

.title {
  @include mdc-typography(headline6);
  margin-top: 48px;
}

.error-title {
  color: #e74c3c;
}

.desc {
  @include mdc-typography(body2);
  margin-top: 24px;
  margin-bottom: 24px;
}

.manifest-desc {
  @include mdc-typography(caption);
  margin-top: 12px;
  margin-bottom: 4px;
}

.button {
  @include mdc-button-ink-color(#fff);
  width: 200px;
  height: 48px;
}

.install-button {
  margin-top: 36px;
}

.error-button {
  margin-top: 12px;
}

.success-icon {
  font-size: 72px;
  margin-top: 36px;
}
</style>
