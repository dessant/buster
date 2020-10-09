<template>
  <div id="app" v-if="dataLoaded">
    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_services') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <v-select
            :label="getText('optionTitle_speechService')"
            v-model="options.speechService"
            :options="selectOptions.speechService"
          >
          </v-select>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'googleSpeechApi'"
        >
          <v-textfield
            v-model.trim="options.googleSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </v-textfield>
        </div>

        <div
          class="option select"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <v-select
            :label="getText('optionTitle_ibmSpeechApiLoc')"
            v-model="options.ibmSpeechApiLoc"
            :options="selectOptions.ibmSpeechApiLoc"
          >
          </v-select>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <v-textfield
            v-model.trim="options.ibmSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </v-textfield>
        </div>

        <div
          class="option select"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <v-select
            :label="getText('optionTitle_microsoftSpeechApiLoc')"
            v-model="options.microsoftSpeechApiLoc"
            :options="selectOptions.microsoftSpeechApiLoc"
          >
          </v-select>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <v-textfield
            v-model.trim="options.microsoftSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </v-textfield>
        </div>

        <v-textfield
          v-if="options.speechService === 'witSpeechApi'"
          v-for="item in witSpeechApis"
          :key="item.id"
          :value="options.witSpeechApiKeys[item] || ''"
          :label="
            getText('inputLabel_apiKeyType', [
              getText(`optionValue_witSpeechApiLang_${item}`)
            ])
          "
          @input="saveWitSpeechApiKey($event.trim(), item)"
        >
        </v-textfield>
        <div
          class="wit-add-api"
          v-if="options.speechService === 'witSpeechApi'"
        >
          <v-select
            v-model="witSpeechApiLang"
            :options="selectOptions.witSpeechApiLang"
            :label="getText('optionTitle_witSpeechApiLang')"
          >
          </v-select>
          <v-button
            :outlined="true"
            :disabled="!witSpeechApiLang"
            :label="getText('buttonText_addApi')"
            @click="addWitSpeechApi"
          >
          </v-button>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_client') }}
      </div>
      <div class="section-desc" v-once>
        {{ getText('optionSectionDescription_client') }}
      </div>
      <div class="option-wrap">
        <div
          class="option"
          v-if="
            clientAppInstalled ||
            (clientAppVerified && options.simulateUserInput)
          "
        >
          <v-form-field
            input-id="si"
            :label="getText('optionTitle_simulateUserInput')"
          >
            <v-switch id="si" v-model="options.simulateUserInput"></v-switch>
          </v-form-field>
        </div>

        <div class="option" v-if="clientAppInstalled">
          <v-form-field
            input-id="auc"
            :label="getText('optionTitle_autoUpdateClientApp')"
          >
            <v-switch id="auc" v-model="options.autoUpdateClientApp"></v-switch>
          </v-form-field>
        </div>

        <div
          class="client-download"
          v-if="clientAppVerified && !clientAppInstalled"
        >
          <div
            class="download-desc"
            v-html="
              getText('pageContent_optionClientAppDownloadDesc', [
                `<a target='_blank' rel='noreferrer' href='${installGuideUrl}'>${getText(
                  'linkText_installGuide'
                )}</a>`
              ])
            "
          ></div>
          <div class="download-error" v-if="!clientAppDownloadUrl">
            {{ getText('pageContent_optionClientAppOSError') }}
          </div>

          <v-button
            class="download-button"
            :unelevated="true"
            :disabled="!clientAppDownloadUrl"
            :label="getText('buttonText_downloadApp')"
            @click="$refs.dlLink.click()"
          >
          </v-button>
          <a
            ref="dlLink"
            class="download-link"
            target="_blank"
            rel="noreferrer"
            :href="clientAppDownloadUrl"
          ></a>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_misc') }}
      </div>
      <div class="option-wrap">
        <div class="option">
          <v-form-field
            input-id="lec"
            :label="getText('optionTitle_loadEnglishChallenge')"
          >
            <v-switch
              id="lec"
              v-model="options.loadEnglishChallenge"
            ></v-switch>
          </v-form-field>
        </div>

        <div class="option" v-if="!options.loadEnglishChallenge">
          <v-form-field
            input-id="esm"
            :label="getText('optionTitle_tryEnglishSpeechModel')"
          >
            <v-switch
              id="esm"
              v-model="options.tryEnglishSpeechModel"
            ></v-switch>
          </v-form-field>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import browser from 'webextension-polyfill';
import {Button, Select, Switch, FormField, TextField} from 'ext-components';

import storage from 'storage/storage';
import {getOptionLabels, pingClientApp} from 'utils/app';
import {getText, getPlatform} from 'utils/common';
import {clientAppVersion} from 'utils/config';
import {
  optionKeys,
  clientAppPlatforms,
  captchaWitSpeechApiLangCodes
} from 'utils/data';

export default {
  components: {
    [Button.name]: Button,
    [Select.name]: Select,
    [Switch.name]: Switch,
    [FormField.name]: FormField,
    [TextField.name]: TextField
  },

  data: function () {
    return {
      dataLoaded: false,

      selectOptions: getOptionLabels({
        speechService: [
          'witSpeechApiDemo',
          'googleSpeechApi',
          'witSpeechApi',
          'ibmSpeechApi',
          'microsoftSpeechApi'
        ],
        ibmSpeechApiLoc: [
          'london',
          'frankfurt',
          'dallas',
          'washington',
          'sydney',
          'tokyo'
        ],
        microsoftSpeechApiLoc: [
          'eastAu',
          'centralCa',
          'centralUs',
          'centralFr',
          'centralIn',
          'eastJp',
          'centralKr',
          'northCentralUs',
          'southCentralUs',
          'southUk',
          'eastUs',
          'eastUs2',
          'westUs',
          'westUs2',
          'eastAsia',
          'southeastAsia',
          'westEu',
          'northEu'
        ],
        witSpeechApiLang: [
          ...new Set(
            Object.values(captchaWitSpeechApiLangCodes).filter(Boolean)
          )
        ].sort()
      }),

      witSpeechApiLang: '',
      witSpeechApis: [],

      clientAppVerified: false,
      clientAppInstalled: false,
      clientAppDownloadUrl: '',
      installGuideUrl: '',

      options: {
        speechService: '',
        googleSpeechApiKey: '',
        ibmSpeechApiLoc: '',
        ibmSpeechApiKey: '',
        microsoftSpeechApiLoc: '',
        microsoftSpeechApiKey: '',
        witSpeechApiKeys: {},
        loadEnglishChallenge: false,
        tryEnglishSpeechModel: false,
        simulateUserInput: false,
        autoUpdateClientApp: false
      }
    };
  },

  methods: {
    getText,

    verifyClientApp: async function () {
      try {
        await pingClientApp();
        this.clientAppInstalled = true;
      } catch (e) {
        if (!this.installGuideUrl) {
          this.installGuideUrl =
            'https://github.com/dessant/buster/wiki/Installing-the-client-app';
          const {os, arch} = await getPlatform();
          if (clientAppPlatforms.includes(`${os}/${arch}`)) {
            this.installGuideUrl += `#${os}`;
            this.clientAppDownloadUrl = `https://github.com/dessant/buster-client/releases/download/v${clientAppVersion}/buster-client-setup-v${clientAppVersion}-${os}-${arch}`;
            if (os === 'windows') {
              this.clientAppDownloadUrl += '.exe';
            }
          }
        }

        this.clientAppInstalled = false;
      }

      this.clientAppVerified = true;
    },

    setWitSpeechApiLangOptions: function () {
      this.selectOptions.witSpeechApiLang = this.selectOptions.witSpeechApiLang.filter(
        item => !this.witSpeechApis.includes(item.id)
      );
    },

    addWitSpeechApi: function () {
      this.witSpeechApis.push(this.witSpeechApiLang);
      this.witSpeechApiLang = '';
      this.setWitSpeechApiLangOptions();
    },

    saveWitSpeechApiKey: function (value, lang) {
      const apiKeys = this.options.witSpeechApiKeys;
      if (value) {
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys, {
          [lang]: value
        });
      } else if (apiKeys[lang]) {
        delete apiKeys[lang];
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys);
      }
    }
  },

  created: async function () {
    const options = await storage.get(optionKeys, 'sync');

    for (const option of Object.keys(this.options)) {
      this.options[option] = options[option];
      this.$watch(`options.${option}`, async function (value) {
        await storage.set({[option]: value}, 'sync');
      });
    }

    this.witSpeechApis = Object.keys(options.witSpeechApiKeys);
    this.setWitSpeechApiLangOptions();

    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.verifyClientApp();

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/select/mdc-select';
@import '@material/theme/mixins';
@import '@material/typography/mixins';
@import '@material/button/mixins';

body {
  margin: 0;
  @include mdc-typography-base;
  font-size: 100%;
  background-color: #ffffff;
  overflow: visible !important;
}

#app {
  display: grid;
  grid-row-gap: 32px;
  padding: 24px;
}

.mdc-switch {
  margin-right: 16px;
}

.section-title,
.section-desc {
  @include mdc-theme-prop(color, text-primary-on-light);
}

.section-title {
  @include mdc-typography(headline6);
}

.section-desc {
  @include mdc-typography(body2);
  padding-top: 8px;
  max-width: 380px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 24px;
  padding-top: 24px;
  grid-auto-columns: min-content;
}

.option {
  display: flex;
  align-items: center;
  height: 24px;

  & .mdc-form-field {
    max-width: calc(100vw - 48px);

    & label {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.option {
  &.select,
  &.text-field {
    height: 56px;
  }
}

.option.select {
  align-items: start;

  & .mdc-select__anchor,
  & .mdc-select__menu {
    max-width: calc(100vw - 48px);
  }

  & .mdc-select__selected-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.wit-add-api {
  display: flex;
  align-items: center;
}

.wit-add-api > button {
  margin-left: 24px;
  white-space: nowrap;
}

.client-download {
  min-width: 300px;
}

.download-desc,
.download-error {
  @include mdc-theme-prop(color, text-primary-on-light);
  @include mdc-typography(body2);
}

.download-desc {
  max-width: 240px;
}

.download-error {
  margin-top: 12px;
  color: #e74c3c;
}

.download-link {
  visibility: hidden;
}

.download-button {
  @include mdc-button-ink-color(#fff);
  width: 200px;
  height: 48px;
  margin-top: 24px;
}
</style>
