<template>
  <v-app id="app" v-if="dataLoaded">
    <div class="wrap" v-if="!isInstallSuccess && !isInstallError">
      <div class="title">
        {{ getText('pageContent_installTitle') }}
      </div>
      <div class="desc">
        {{ getText('pageContent_installDesc') }}
      </div>

      <vn-text-field
        :label="getText('inputLabel_appLocation')"
        v-model.trim="appDir"
      >
      </vn-text-field>

      <vn-text-field
        class="manifest-location"
        v-if="manifestDirEditable"
        :label="getText('inputLabel_manifestLocation')"
        v-model.trim="manifestDir"
      >
      </vn-text-field>

      <div class="manifest-desc" v-if="manifestDirEditable">
        {{ getText('pageContent_manifestLocationDesc') }}
      </div>

      <vn-button
        class="button install-button"
        :disabled="
          isInstalling || !appDir || (manifestDirEditable && !manifestDir)
        "
        @click="runInstall"
        variant="elevated"
      >
        {{ getText('buttonLabel_installApp') }}
      </vn-button>
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

      <vn-button
        class="button error-button"
        @click="isInstallError = false"
        variant="elevated"
      >
        {{ getText('buttonLabel_goBack') }}
      </vn-button>
    </div>
  </v-app>
</template>

<script>
import {Button, TextField} from 'vueton';

import storage from 'storage/storage';
import {pingClientApp} from 'utils/app';
import {getText} from 'utils/common';

export default {
  components: {
    [Button.name]: Button,
    [TextField.name]: TextField
  },

  data: function () {
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

    getExtensionId: function () {
      let id = browser.runtime.id;
      if (!this.$env.isFirefox) {
        const scheme = window.location.protocol;
        id = `${scheme}//${id}/`;
      }

      return id;
    },

    setLocation: async function () {
      try {
        await this.location();
      } catch (err) {
        this.isInstallError = true;
        console.log(err.toString());
      }
    },

    runInstall: async function () {
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
          mode: 'cors',
          method: 'POST',
          body: data
        });
      }
    },

    location: async function () {
      const data = new FormData();
      data.append('session', this.session);
      data.append('browser', this.browser);
      data.append('targetEnv', this.$env.targetEnv);

      const rsp = await fetch(`${this.apiUrl}/setup/location`, {
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

    install: async function () {
      const data = new FormData();
      data.append('session', this.session);
      data.append('appDir', this.appDir);
      data.append('manifestDir', this.manifestDir);
      data.append('browser', this.browser);
      data.append('targetEnv', this.$env.targetEnv);
      data.append('extension', this.getExtensionId());

      const rsp = await fetch(`${this.apiUrl}/setup/install`, {
        mode: 'cors',
        method: 'POST',
        body: data
      });

      if (rsp.status === 200) {
        await pingClientApp();
        await storage.set({simulateUserInput: true});

        this.isInstallSuccess = true;
      } else {
        throw new Error((await rsp.json()).error);
      }
    }
  },

  created: async function () {
    this.browser = (await browser.runtime.sendMessage({id: 'getBrowser'})).name;

    await this.setLocation();

    if (!this.$env.isWindows) {
      this.manifestDirEditable = true;
    }

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;

.v-application__wrap {
  display: flex;
  align-items: center;
  padding: 24px;
}

.wrap {
  display: flex;
  flex-direction: column;
  max-width: 400px;
}

.title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 32px;

  margin-top: 48px;
  align-self: center;
}

.error-title {
  @include vueton.theme-prop(color, error);
}

.desc {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;

  margin-top: 32px;
  margin-bottom: 24px;
}

.manifest-location {
  margin-top: 24px;
}

.manifest-desc {
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.4px;
  line-height: 20px;

  margin-top: 12px;
}

.button {
  @include vueton.theme-prop(background-color, primary);

  & .v-btn__content {
    @include vueton.theme-prop(color, on-primary);
  }
}

.install-button {
  margin-top: 32px;
  align-self: center;
}

.error-button {
  margin-top: 8px;
  align-self: center;
}

.success-icon {
  font-size: 72px;
  margin-top: 48px;
  align-self: center;
}
</style>
