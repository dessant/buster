const path = require('node:path');

const corejsVersion = require(
  path.join(path.dirname(require.resolve('core-js')), 'package.json')
).version;

module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      '@babel/env',
      {
        modules: false,
        bugfixes: true,
        useBuiltIns: 'usage',
        corejs: {version: corejsVersion}
      }
    ]
  ];

  const plugins = [];

  const ignore = [
    new RegExp(`node_modules\\${path.sep}(?!(vueton|wesa)\\${path.sep}).*`)
  ];

  const parserOpts = {plugins: ['importAttributes']};

  return {presets, plugins, ignore, parserOpts};
};
