<!-- prettier-ignore -->
<template>
<div id="app">
  <v-contribute :extName="extName" :extSlug="extSlug" :notice="notice">
  </v-contribute>
</div>
</template>

<script>
import {Contribute} from 'ext-contribute';

import {getText} from 'utils/common';

export default {
  components: {
    [Contribute.name]: Contribute
  },

  data: function() {
    return {
      extName: getText('extensionName'),
      extSlug: 'buster',
      notice: ''
    };
  },

  created: function() {
    document.title = getText('pageTitle', [
      getText('pageTitle_contribute'),
      this.extName
    ]);

    const query = new URL(window.location.href).searchParams;
    if (query.get('action') === 'use') {
      this.notice = `This page is shown during your 30th and 100th use
        of the extension.`;
    }
  }
};
</script>

<style lang="scss">
@import '@material/typography/mixins';

body {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  @include mdc-typography-base;
  font-size: 100%;
  background-color: #ffffff;
}
</style>
