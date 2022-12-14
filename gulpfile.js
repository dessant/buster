const path = require('node:path');
const {exec} = require('node:child_process');
const {
  lstatSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync
} = require('node:fs');

const {series, parallel, src, dest} = require('gulp');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const jsonMerge = require('gulp-merge-json');
const jsonmin = require('gulp-jsonmin');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const {ensureDirSync, readJsonSync} = require('fs-extra');
const sharp = require('sharp');
const CryptoJS = require('crypto-js');

const targetEnv = process.env.TARGET_ENV || 'chrome';
const isProduction = process.env.NODE_ENV === 'production';
const enableContributions =
  (process.env.ENABLE_CONTRIBUTIONS || 'true') === 'true';
const distDir = path.join(__dirname, 'dist', targetEnv);

function initEnv() {
  process.env.BROWSERSLIST_ENV = targetEnv;
}

function init(done) {
  initEnv();

  rmSync(distDir, {recursive: true, force: true});
  ensureDirSync(distDir);
  done();
}

function js(done) {
  exec('webpack-cli build --color', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    done(err);
  });
}

function html() {
  return src(
    enableContributions
      ? 'src/**/*.html'
      : ['src/**/*.html', '!src/contribute/*.html'],
    {base: '.'}
  )
    .pipe(gulpif(isProduction, htmlmin({collapseWhitespace: true})))
    .pipe(dest(distDir));
}

function css() {
  return src('src/solve/*.css', {base: '.'})
    .pipe(postcss())
    .pipe(dest(distDir));
}

async function images(done) {
  ensureDirSync(path.join(distDir, 'src/assets/icons/app'));
  const appIconSvg = readFileSync('src/assets/icons/app/icon.svg');
  const appIconSizes = [16, 19, 24, 32, 38, 48, 64, 96, 128];
  for (const size of appIconSizes) {
    await sharp(appIconSvg, {density: (72 * size) / 24})
      .resize(size)
      .toFile(path.join(distDir, `src/assets/icons/app/icon-${size}.png`));
  }
  // Chrome Web Store does not correctly display optimized icons
  if (isProduction && targetEnv !== 'chrome') {
    await new Promise(resolve => {
      src(path.join(distDir, 'src/assets/icons/app/*.png'), {base: '.'})
        .pipe(imagemin())
        .pipe(dest('.'))
        .on('error', done)
        .on('finish', resolve);
    });
  }

  if (enableContributions) {
    await new Promise(resolve => {
      src('node_modules/vueton/components/contribute/assets/*.@(png|svg)')
        .pipe(gulpif(isProduction, imagemin()))
        .pipe(dest(path.join(distDir, 'src/contribute/assets')))
        .on('error', done)
        .on('finish', resolve);
    });
  }
}

async function fonts(done) {
  await new Promise(resolve => {
    src('src/assets/fonts/roboto.css', {base: '.'})
      .pipe(postcss())
      .pipe(dest(distDir))
      .on('error', done)
      .on('finish', resolve);
  });

  await new Promise(resolve => {
    src(
      'node_modules/@fontsource/roboto/files/roboto-latin-@(400|500|700)-normal.woff2'
    )
      .pipe(dest(path.join(distDir, 'src/assets/fonts/files')))
      .on('error', done)
      .on('finish', resolve);
  });
}

async function locale(done) {
  const localesRootDir = path.join(__dirname, 'src/assets/locales');
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
  return src(`src/assets/manifest/${targetEnv}.json`)
    .pipe(
      jsonMerge({
        fileName: 'manifest.json',
        edit: (parsedJson, file) => {
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
  return src('LICENSE').pipe(dest(distDir));
}

function secrets(done) {
  try {
    let data = process.env.BUSTER_SECRETS;
    if (data) {
      data = JSON.parse(data);
    } else {
      data = readJsonSync('secrets.json');
    }
    data = JSON.stringify(data);

    const key = CryptoJS.SHA256(
      readFileSync(path.join(distDir, 'src/background/script.js')).toString() +
        readFileSync(path.join(distDir, 'src/solve/script.js')).toString()
    ).toString();

    const ciphertext = CryptoJS.AES.encrypt(data, key).toString();

    writeFileSync(path.join(distDir, 'secrets.txt'), ciphertext);
  } catch (err) {
    console.log(
      'Secrets are missing, secrets.txt will not be included in the extension package.'
    );
  }

  done();
}

function zip(done) {
  exec(
    `web-ext build -s dist/${targetEnv} -a artifacts/${targetEnv} -n "{name}-{version}-${targetEnv}.zip" --overwrite-dest`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
}

function inspect(done) {
  initEnv();

  exec(
    `npm run build:prod:chrome && \
    webpack --profile --json > report.json && \
    webpack-bundle-analyzer --mode static report.json dist/chrome/src && \
    sleep 3 && rm report.{json,html}`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
}

exports.build = series(
  init,
  parallel(js, html, css, images, fonts, locale, manifest, license),
  secrets
);
exports.zip = zip;
exports.inspect = inspect;
exports.secrets = secrets;
