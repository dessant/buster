<template>
  <v-app id="app" v-if="dataLoaded">
    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_services') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_speechService')"
            :items="listItems.speechService"
            v-model="options.speechService"
          >
          </vn-select>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'googleSpeechApi'"
        >
          <vn-text-field
            :label="getText('inputLabel_apiKey')"
            v-model.trim="options.googleSpeechApiKey"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'googleSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/dessant/buster/wiki/Configuring-Google-Cloud-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <div
          class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.ibmSpeechApiUrl"
            :label="getText('inputLabel_apiUrl')"
          >
          </vn-text-field>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.ibmSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'ibmSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/dessant/buster/wiki/Configuring-IBM-Watson-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <div
          class="option select"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <vn-select
            :label="getText('optionTitle_microsoftSpeechApiLoc')"
            :items="listItems.microsoftSpeechApiLoc"
            v-model="options.microsoftSpeechApiLoc"
          >
          </vn-select>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.microsoftSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'microsoftSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/dessant/buster/wiki/Configuring-Microsoft-Azure-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <vn-text-field
          class="text-field"
          v-if="options.speechService === 'witSpeechApi'"
          v-for="item in witSpeechApis"
          :key="item.id"
          :model-value="options.witSpeechApiKeys[item] || ''"
          :label="
            getText('inputLabel_apiKeyType', [
              getText(`optionValue_witSpeechApiLang_${item}`)
            ])
          "
          @update:modelValue="saveWitSpeechApiKey($event.trim(), item)"
        >
        </vn-text-field>
        <div
          class="wit-add-api"
          v-if="options.speechService === 'witSpeechApi'"
        >
          <vn-select
            :label="getText('optionTitle_witSpeechApiLang')"
            :items="listItems.witSpeechApiLang"
            v-model="witSpeechApiLang"
          >
          </vn-select>

          <vn-button :disabled="!witSpeechApiLang" @click="addWitSpeechApi">
            {{ getText('buttonLabel_addApi') }}
          </vn-button>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'witSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/dessant/buster/wiki/Configuring-Wit.ai"
        >
          {{ getText('linkText_apiGuide') }}
        </a>
      </div>
    </div>

    <div class="section section-client">
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
          <vn-switch
            :label="getText('optionTitle_simulateUserInput')"
            v-model="options.simulateUserInput"
          ></vn-switch>
        </div>

        <div
          class="option"
          v-if="clientAppVerified && options.simulateUserInput"
        >
          <vn-switch
            :label="getText('optionTitle_navigateWithKeyboard')"
            v-model="options.navigateWithKeyboard"
          ></vn-switch>
        </div>

        <div class="option" v-if="clientAppInstalled">
          <vn-switch
            :label="getText('optionTitle_autoUpdateClientApp')"
            v-model="options.autoUpdateClientApp"
          ></vn-switch>
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

          <vn-button
            class="download-button"
            :disabled="!clientAppDownloadUrl"
            @click="$refs.dlLink.click()"
            variant="elevated"
          >
            {{ getText('buttonLabel_downloadApp') }}
          </vn-button>
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
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_appTheme')"
            :items="listItems.appTheme"
            v-model="options.appTheme"
          >
          </vn-select>
        </div>
        <div class="option">
          <vn-switch
            :label="getText('optionTitle_loadEnglishChallenge')"
            v-model="options.loadEnglishChallenge"
          ></vn-switch>
        </div>
        <div class="option" v-if="!options.loadEnglishChallenge">
          <vn-switch
            :label="getText('optionTitle_tryEnglishSpeechModel')"
            v-model="options.tryEnglishSpeechModel"
          ></vn-switch>
        </div>
        <div class="option" v-if="enableContributions">
          <vn-switch
            :label="getText('optionTitle_showContribPage')"
            v-model="options.showContribPage"
          ></vn-switch>
        </div>
        <div class="option button" v-if="enableContributions">
          <vn-button
            class="contribute-button vn-icon--start"
            @click="showContribute"
            ><vn-icon src="/src/contribute/assets/heart.svg"></vn-icon>
            {{ getText('buttonLabel_contribute') }}
          </vn-button>
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import {toRaw} from 'vue';
import {Button, Icon, Select, Switch, TextField} from 'vueton';

import storage from 'storage/storage';
import {getListItems, showContributePage, pingClientApp} from 'utils/app';
import {getText} from 'utils/common';
import {enableContributions, clientAppVersion} from 'utils/config';
import {
  optionKeys,
  clientAppPlatforms,
  captchaWitSpeechApiLangCodes,
  microsoftSpeechApiRegions
} from 'utils/data';

export default {
  components: {
    [Button.name]: Button,
    [Icon.name]: Icon,
    [Select.name]: Select,
    [Switch.name]: Switch,
    [TextField.name]: TextField
  },

  data: function () {
    return {
      dataLoaded: false,

      listItems: {
        ...getListItems(
          {
            speechService: [
              'witSpeechApiDemo',
              'googleSpeechApi',
              'witSpeechApi',
              'ibmSpeechApi',
              'microsoftSpeechApi'
            ]
          },
          {scope: 'optionValue_speechService'}
        ),
        ...getListItems(
          {microsoftSpeechApiLoc: microsoftSpeechApiRegions},
          {scope: 'optionValue_microsoftSpeechApiLoc'}
        ),
        ...getListItems(
          {
            witSpeechApiLang: [
              ...new Set(
                Object.values(captchaWitSpeechApiLangCodes).filter(Boolean)
              )
            ].sort()
          },
          {scope: 'optionValue_witSpeechApiLang'}
        ),
        ...getListItems(
          {appTheme: ['auto', 'light', 'dark']},
          {scope: 'optionValue_appTheme'}
        )
      },

      enableContributions,

      witSpeechApiLang: null,
      witSpeechApis: [],

      clientAppVerified: false,
      clientAppInstalled: false,
      clientAppDownloadUrl: '',
      installGuideUrl: '',

      options: {
        speechService: '',
        googleSpeechApiKey: '',
        ibmSpeechApiUrl: '',
        ibmSpeechApiKey: '',
        microsoftSpeechApiLoc: '',
        microsoftSpeechApiKey: '',
        witSpeechApiKeys: {},
        loadEnglishChallenge: false,
        tryEnglishSpeechModel: false,
        simulateUserInput: false,
        autoUpdateClientApp: false,
        navigateWithKeyboard: false,
        appTheme: '',
        showContribPage: false
      }
    };
  },

  methods: {
    getText,

    verifyClientApp: async function () {
      try {
        await pingClientApp();
        this.clientAppInstalled = true;
      } catch (err) {
        if (!this.installGuideUrl) {
          this.installGuideUrl =
            'https://github.com/dessant/buster/wiki/Installing-the-client-app';
          const {os, arch} = this.$env;
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
      this.listItems.witSpeechApiLang = this.listItems.witSpeechApiLang.filter(
        item => !this.witSpeechApis.includes(item.value)
      );
    },

    addWitSpeechApi: function () {
      this.witSpeechApis.push(this.witSpeechApiLang);
      this.witSpeechApiLang = null;
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
    },

    showContribute: async function () {
      await showContributePage();
    }
  },

  created: async function () {
    const options = await storage.get(optionKeys);

    for (const option of Object.keys(this.options)) {
      this.options[option] = options[option];

      this.$watch(
        `options.${option}`,
        async function (value) {
          await storage.set({[option]: toRaw(value)});
          await browser.runtime.sendMessage({id: 'optionChange'});
        },
        {deep: true}
      );
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
@use 'vueton/styles' as vueton;

@include vueton.theme-base;

.v-application__wrap {
  display: grid;
  grid-row-gap: 32px;
  grid-column-gap: 48px;
  padding: 24px;
  grid-auto-rows: min-content;
  grid-auto-columns: min-content;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 32px;
}

.section-desc {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;

  padding-top: 8px;
  max-width: 380px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 24px;
  padding-top: 24px;
}

.option {
  display: flex;
  align-items: center;
  height: 20px;

  &.button {
    height: 40px;
  }

  &.select,
  &.text-field {
    height: 56px;
  }

  & .contribute-button {
    @include vueton.theme-prop(color, primary);

    & .vn-icon {
      @include vueton.theme-prop(background-color, cta);
    }
  }
}

.text-field .v-input__control {
  width: 326px;
}

.section-client .section-desc {
  width: 272px;
}

.wit-add-api {
  display: flex;
  align-items: center;

  & .vn-select {
    & .v-input__control,
    & .v-input__details {
      max-width: calc(100vw - 48px - 124px) !important;
    }
  }

  & .vn-button {
    margin-left: 24px;
    @include vueton.theme-prop(color, primary);
  }
}

.service-guide {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.5px;
  line-height: 24px;
}

.client-download {
  width: 272px;
}

.download-desc,
.download-error {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc a {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc {
  max-width: 240px;
}

.download-error {
  margin-top: 12px;
  @include vueton.theme-prop(color, error);
}

.download-link {
  visibility: hidden;
}

.download-button {
  margin-top: 24px;
  @include vueton.theme-prop(background-color, primary);

  & .v-btn__content {
    @include vueton.theme-prop(color, on-primary);
  }
}
</style>
