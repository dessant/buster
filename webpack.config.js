const path = require('node:path');
const {lstatSync, readdirSync} = require('node:fs');

const webpack = require('webpack');
const {VueLoaderPlugin} = require('vue-loader');
const {VuetifyPlugin} = require('webpack-plugin-vuetify');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const appVersion = require('./package.json').version;
const storageRevisions = require('./src/storage/config.json').revisions;

const targetEnv = process.env.TARGET_ENV || 'chrome';
const isProduction = process.env.NODE_ENV === 'production';
const enableContributions =
  (process.env.ENABLE_CONTRIBUTIONS || 'true') === 'true';

const mv3 = ['chrome', 'edge', 'opera'].includes(targetEnv);

const provideExtApi = !['firefox', 'safari'].includes(targetEnv);

const provideModules = {};
if (provideExtApi) {
  provideModules.browser = 'webextension-polyfill';
}

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      TARGET_ENV: JSON.stringify(targetEnv),
      STORAGE_REVISION_LOCAL: JSON.stringify(storageRevisions.local.at(-1)),
      STORAGE_REVISION_SESSION: JSON.stringify(storageRevisions.session.at(-1)),
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

const scriptsRootDir = path.join(__dirname, 'src/scripts');
const scripts = readdirSync(scriptsRootDir)
  .filter(file => lstatSync(path.join(scriptsRootDir, file)).isFile())
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

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    background: './src/background/main.js',
    options: './src/options/main.js',
    contribute: './src/contribute/main.js',
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
              sassOptions: {
                includePaths: ['node_modules'],
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
  devtool: false,
  plugins
};
