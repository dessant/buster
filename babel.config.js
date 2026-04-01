import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

const corejsVersion = require(
  path.join(path.dirname(require.resolve('core-js')), 'package.json')
).version;

export default function (api) {
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

  const parserOpts = {};

  return {presets, plugins, ignore, parserOpts};
}
