import postcssPresetEnv from 'postcss-preset-env';
import cssnano from 'cssnano';

export default function (api) {
  const plugins = [postcssPresetEnv()];

  if (api.env === 'production') {
    plugins.push(cssnano({zindex: false, discardUnused: false}));
  }

  return {plugins};
}
