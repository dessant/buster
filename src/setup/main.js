import Vue from 'vue';

import App from './App';

async function init() {
  try {
    await document.fonts.load('400 14px Roboto');
    await document.fonts.load('500 14px Roboto');
  } catch (err) {}

  new Vue({
    el: '#app',
    render: h => h(App)
  });
}

// only run in a frame
if (window.top !== window) {
  init();
}
