import path from 'node:path';
import {lstat, readdir} from 'node:fs/promises';

import webpack from 'webpack';
import {VueLoaderPlugin} from 'vue-loader';
import {VuetifyPlugin} from 'webpack-plugin-vuetify';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const __dirname = import.meta.dirname;

const {
  default: {version: appVersion}
} = await import('./package.json', {with: {type: 'json'}});
const {
  default: {revisions: storageRevisions}
} = await import('./src/storage/config.json', {with: {type: 'json'}});

export default async function (env, argv) {
  const targetEnv = process.env.TARGET_ENV || 'chrome';
  const isProduction = process.env.NODE_ENV === 'production';
  const enableContributions =
    (process.env.ENABLE_CONTRIBUTIONS || 'true') === 'true';

  const mv3 = env.mv3 === 'true';

  const provideExtApi = !['firefox', 'safari'].includes(targetEnv);

  const provideModules = {};
  if (provideExtApi) {
    provideModules.browser = 'webextension-polyfill';
  }

  const scriptsRootDir = path.join(__dirname, 'src/scripts');
  const scripts = (await readdir(scriptsRootDir))
    .filter(async file =>
      (await lstat(path.join(scriptsRootDir, file))).isFile()
    )
    .map(file => file.split('.')[0]);

  const entries = Object.fromEntries(
    scripts.map(script => [script, `./src/scripts/${script}.js`])
  );

  if (mv3 && !['firefox', 'safari'].includes(targetEnv)) {
    entries.offscreen = './src/offscreen/main.js';
  }

  if (enableContributions) {
    entries.contribute = './src/contribute/main.js';
  }

  const plugins = [
    new webpack.DefinePlugin({
      'process.env': {
        TARGET_ENV: JSON.stringify(targetEnv),
        STORAGE_REVISION_LOCAL: JSON.stringify(storageRevisions.local.at(-1)),
        STORAGE_REVISION_SESSION: JSON.stringify(
          storageRevisions.session.at(-1)
        ),
        ENABLE_CONTRIBUTIONS: JSON.stringify(enableContributions.toString()),
        APP_VERSION: JSON.stringify(appVersion),
        MV3: JSON.stringify(mv3.toString())
      },
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }),
    new webpack.ProvidePlugin(provideModules),
    new VueLoaderPlugin(),
    new VuetifyPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name]/style.css',
      ignoreOrder: true
    })
  ];

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'browserslist',
    entry: {
      background: './src/background/main.js',
      options: './src/options/main.js',
      base: './src/base/main.js',
      setup: './src/setup/main.js',
      ...entries
    },
    output: {
      path: path.resolve(__dirname, 'dist', targetEnv, 'src'),
      filename: pathData => {
        return scripts.includes(pathData.chunk.name)
          ? 'scripts/[name].js'
          : '[name]/script.js';
      },
      chunkFilename: '[name]/script.js',
      chunkFormat: 'array-push',
      asyncChunks: false
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false,
          commonsUi: {
            name: 'commons-ui',
            chunks: chunk => {
              return ['options', 'contribute', 'setup'].includes(chunk.name);
            },
            minChunks: 2
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          resolve: {
            fullySpecified: false
          }
        },
        {
          test: /\.vue$/,
          use: [
            {
              loader: 'vue-loader',
              options: {
                transformAssetUrls: {img: ''},
                compilerOptions: {whitespace: 'preserve'}
              }
            }
          ]
        },
        {
          test: /\.(c|sc|sa)ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            {
              loader: 'sass-loader',
              options: {
                api: 'legacy',
                sassOptions: {
                  includePaths: ['node_modules'],
                  silenceDeprecations: ['legacy-js-api'],
                  quietDeps: true
                },
                additionalData: (content, loaderContext) => {
                  return `
                  $target-env: "${targetEnv}";
                  ${content}
                `;
                }
              }
            }
          ]
        }
      ]
    },
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      extensions: ['.js', '.json', '.css', '.scss', '.vue'],
      fallback: {fs: false}
    },
    performance: {
      hints: false
    },
    devtool: false,
    plugins
  };
}
