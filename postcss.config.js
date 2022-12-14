const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');

module.exports = function (api) {
  const plugins = [postcssPresetEnv()];

  if (api.env === 'production') {
    plugins.push(cssnano({zindex: false, discardUnused: false}));
  }

  return {plugins};
};
