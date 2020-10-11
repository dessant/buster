const path = require('path');
const {exec} = require('child_process');
const {lstatSync, readdirSync, readFileSync, writeFileSync} = require('fs');

const {series, parallel, src, dest} = require('gulp');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const jsonMerge = require('gulp-merge-json');
const jsonmin = require('gulp-jsonmin');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const del = require('del');
const {ensureDirSync} = require('fs-extra');
const sharp = require('sharp');

const targetEnv = process.env.TARGET_ENV || 'firefox';
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.join('dist', targetEnv);

function clean() {
  return del([distDir]);
}

function jsWebpack(done) {
  exec('webpack-cli --display-error-details --bail --colors', function (
    err,
    stdout,
    stderr
  ) {
    console.log(stdout);
    console.log(stderr);
    done(err);
  });
}

function jsBabel() {
  return src(['src/content/**/*.js'], {base: '.'})
    .pipe(babel())
    .pipe(dest(distDir));
}

const js = parallel(jsWebpack, jsBabel);

function html() {
  return src('src/**/*.html', {base: '.'})
    .pipe(gulpif(isProduction, htmlmin({collapseWhitespace: true})))
    .pipe(dest(distDir));
}

function css() {
  return src(['src/solve/*.css'], {
    base: '.'
  })
    .pipe(postcss())
    .pipe(dest(distDir));
}

async function images(done) {
  ensureDirSync(path.join(distDir, 'src/icons/app'));
  const appIconSvg = readFileSync('src/icons/app/icon.svg');
  const appIconSizes = [16, 19, 24, 32, 38, 48, 64, 96, 128];
  for (const size of appIconSizes) {
    await sharp(appIconSvg, {density: (72 * size) / 24})
      .resize(size)
      .toFile(path.join(distDir, `src/icons/app/icon-${size}.png`));
  }
  // Chrome Web Store does not correctly display optimized icons
  if (isProduction && targetEnv !== 'chrome') {
    await new Promise(resolve => {
      src(path.join(distDir, 'src/icons/app/*.png'), {base: '.'})
        .pipe(imagemin())
        .pipe(dest('.'))
        .on('error', done)
        .on('finish', resolve);
    });
  }

  await new Promise(resolve => {
    src('node_modules/ext-contribute/src/assets/*.@(jpg|png|svg)')
      .pipe(gulpif(isProduction, imagemin()))
      .pipe(dest(path.join(distDir, 'src/contribute/assets')))
      .on('error', done)
      .on('finish', resolve);
  });
}

async function fonts(done) {
  await new Promise(resolve => {
    src('src/fonts/roboto.css', {base: '.'})
      .pipe(postcss())
      .pipe(dest(distDir))
      .on('error', done)
      .on('finish', resolve);
  });

  await new Promise(resolve => {
    src(
      'node_modules/fontsource-roboto/files/roboto-latin-@(400|500|700)-normal.woff2'
    )
      .pipe(dest(path.join(distDir, 'src/fonts/files')))
      .on('error', done)
      .on('finish', resolve);
  });
}

async function locale(done) {
  const localesRootDir = path.join(__dirname, 'src/_locales');
  const localeDirs = readdirSync(localesRootDir).filter(function (file) {
    return lstatSync(path.join(localesRootDir, file)).isDirectory();
  });
  for (const localeDir of localeDirs) {
    const localePath = path.join(localesRootDir, localeDir);
    await new Promise(resolve => {
      src(
        [
          path.join(localePath, 'messages.json'),
          path.join(localePath, `messages-${targetEnv}.json`)
        ],
        {allowEmpty: true}
      )
        .pipe(
          jsonMerge({
            fileName: 'messages.json',
            edit: (parsedJson, file) => {
              if (isProduction) {
                for (let [key, value] of Object.entries(parsedJson)) {
                  if (value.hasOwnProperty('description')) {
                    delete parsedJson[key].description;
                  }
                }
              }
              return parsedJson;
            }
          })
        )
        .pipe(gulpif(isProduction, jsonmin()))
        .pipe(dest(path.join(distDir, '_locales', localeDir)))
        .on('error', done)
        .on('finish', resolve);
    });
  }
}

function manifest() {
  return src('src/manifest.json')
    .pipe(
      jsonMerge({
        fileName: 'manifest.json',
        edit: (parsedJson, file) => {
          if (['chrome', 'edge', 'opera'].includes(targetEnv)) {
            delete parsedJson.browser_specific_settings;
            delete parsedJson.options_ui.browser_style;
          }

          if (['chrome', 'edge', 'firefox'].includes(targetEnv)) {
            delete parsedJson.minimum_opera_version;
          }

          if (['firefox', 'opera'].includes(targetEnv)) {
            delete parsedJson.minimum_chrome_version;
          }

          if (targetEnv === 'firefox') {
            delete parsedJson.options_ui.chrome_style;
            delete parsedJson.incognito;
          }

          parsedJson.version = require('./package.json').version;
          return parsedJson;
        }
      })
    )
    .pipe(gulpif(isProduction, jsonmin()))
    .pipe(dest(distDir));
}

function license() {
  let year = '2018';
  const currentYear = new Date().getFullYear().toString();
  if (year !== currentYear) {
    year = `${year}-${currentYear}`;
  }

  const notice = `Buster: Captcha Solver for Humans
Copyright (c) ${year} Armin Sebastian

This software is released under the terms of the GNU General Public License v3.0.
See the LICENSE file for further information.
`;

  writeFileSync(path.join(distDir, 'NOTICE'), notice);
  return src(['LICENSE']).pipe(dest(distDir));
}

function zip(done) {
  exec(
    `web-ext build -s dist/${targetEnv} -a artifacts/${targetEnv} -n '{name}-{version}-${targetEnv}.zip' --overwrite-dest`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
}

function inspect(done) {
  exec(
    `webpack --profile --json > report.json && webpack-bundle-analyzer report.json dist/firefox/src && sleep 10 && rm report.{json,html}`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
}

exports.build = series(
  clean,
  parallel(js, html, css, images, fonts, locale, manifest, license)
);
exports.zip = zip;
exports.inspect = inspect;
