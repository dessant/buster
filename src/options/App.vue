<template>
<div id="app" v-if="dataLoaded">
  <div class="section">
    <div class="section-title" v-once>
      {{ getText('optionSectionTitle_services') }}
    </div>
    <div class="option-wrap">
      <div class="option select">
        <v-select :label="getText('optionTitle_speechService')"
            v-model="options.speechService"
            :options="selectOptions.speechService">
        </v-select>
      </div>
      <div class="option text-field"
          v-if="options.speechService === 'googleSpeechApi'">
        <v-textfield v-model="options.googleSpeechApiKey"
            :label="getText('inputLabel_apiKey')">
        </v-textfield>
      </div>
      <div class="option select"
          v-if="options.speechService === 'ibmSpeechApi'">
        <v-select :label="getText('optionTitle_ibmSpeechApiLoc')"
            v-model="options.ibmSpeechApiLoc"
            :options="selectOptions.ibmSpeechApiLoc">
        </v-select>
      </div>
      <div class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'">
        <v-textfield v-model="options.ibmSpeechApiKey"
            :label="getText('inputLabel_apiKey')">
        </v-textfield>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import browser from 'webextension-polyfill';
import {Select, TextField} from 'ext-components';

import storage from 'storage/storage';
import {getOptionLabels} from 'utils/app';
import {getText} from 'utils/common';
import {optionKeys} from 'utils/data';

export default {
  components: {
    [Select.name]: Select,
    [TextField.name]: TextField
  },

  data: function() {
    return {
      dataLoaded: false,

      selectOptions: getOptionLabels({
        speechService: [
          'googleSpeechApiDemo',
          'googleSpeechApi',
          'ibmSpeechApi'
        ],
        ibmSpeechApiLoc: [
          'frankfurt',
          'dallas',
          'washington',
          'sydney',
          'tokyo'
        ]
      }),

      options: {
        speechService: '',
        googleSpeechApiKey: '',
        ibmSpeechApiLoc: '',
        ibmSpeechApiKey: ''
      }
    };
  },

  methods: {
    getText
  },

  created: async function() {
    const options = await storage.get(optionKeys, 'sync');

    for (const option of Object.keys(this.options)) {
      this.options[option] = options[option];
      this.$watch(`options.${option}`, async function(value) {
        if (['googleSpeechApiKey', 'ibmSpeechApiKey'].includes(option)) {
          value = value.trim();
        }
        await storage.set({[option]: value}, 'sync');
      });
    }

    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
$mdc-theme-primary: #1abc9c;

@import '@material/theme/mixins';
@import '@material/typography/mixins';

body {
  @include mdc-typography-base;
  font-size: 100%;
  background-color: #ffffff;
  overflow: visible !important;
}

.mdc-select__menu {
  top: inherit !important;
  left: inherit !important;
}

.mdc-switch {
  margin-right: 12px;
}

#app {
  display: grid;
  grid-row-gap: 32px;
  padding: 12px;
}

.section-title,
.section-desc {
  @include mdc-theme-prop('color', 'text-primary-on-light');
}

.section-title {
  @include mdc-typography('title');
}

.section-desc {
  @include mdc-typography('body1');
  padding-top: 8px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 12px;
  padding-top: 16px;
  grid-auto-columns: min-content;
}

.option {
  display: flex;
  align-items: center;
  height: 36px;
}

.option.select,
.option.text-field {
  height: 56px;
}
</style>
