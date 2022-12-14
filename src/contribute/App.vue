<template>
  <v-app id="app">
    <vn-contribute
      :extName="extName"
      :extSlug="extSlug"
      :notice="notice"
      @open="contribute"
    >
    </vn-contribute>
  </v-app>
</template>

<script>
import {Contribute} from 'vueton/components/contribute';

import {getText, getActiveTab} from 'utils/common';

export default {
  components: {
    [Contribute.name]: Contribute
  },

  data: function () {
    return {
      extName: getText('extensionName'),
      extSlug: 'buster',
      notice: ''
    };
  },

  methods: {
    contribute: async function ({url} = {}) {
      const activeTab = await getActiveTab();

      await browser.tabs.create({url, index: activeTab.index + 1});
    }
  },

  created: function () {
    document.title = getText('pageTitle', [
      getText('pageTitle_contribute'),
      this.extName
    ]);

    const query = new URL(window.location.href).searchParams;
    if (query.get('action') === 'auto') {
      this.notice = 'This page is shown once a year while using the extension.';
    }
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;

.v-application__wrap {
  display: flex;
  align-items: center;
}
</style>
