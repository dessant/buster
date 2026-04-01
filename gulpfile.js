import path from 'node:path';
import {exec} from 'node:child_process';
import {lstat, readdir, readFile, writeFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';

import {series, parallel, src, dest} from 'gulp';
import postcss from 'gulp-postcss';
import gulpif from 'gulp-if';
import jsonmin from 'gulp-jsonmin';
import htmlmin from 'gulp-htmlmin';
import imagemin from 'gulp-imagemin';
import {optipng, svgo} from 'gulp-imagemin';
import {ensureDir, readJson} from 'fs-extra/esm';
import sharp from 'sharp';
import CryptoJS from 'crypto-js';

const require = createRequire(import.meta.url);
const __dirname = import.meta.dirname;

const jsonMerge = require('gulp-merge-json');

const {
  default: {version: appVersion}
} = await import('./package.json', {with: {type: 'json'}});

const targetEnv = process.env.TARGET_ENV || 'chrome';
const isProduction = process.env.NODE_ENV === 'production';
const enableContributions =
  (process.env.ENABLE_CONTRIBUTIONS || 'true') === 'true';

const mv3 = ['chrome', 'edge', 'opera'].includes(targetEnv);

const distDir = path.join(__dirname, 'dist', targetEnv);

function initEnv() {
  process.env.BROWSERSLIST_ENV = targetEnv;
}

async function init() {
  initEnv();

  await rm(distDir, {recursive: true, force: true});
  await ensureDir(distDir);
}

function js(done) {
  exec(
    `webpack-cli build --color --env mv3=${mv3}`,
    function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
}

function html() {
  const htmlSrc = ['src/**/*.html'];

  if (mv3 && !['firefox', 'safari'].includes(targetEnv)) {
    htmlSrc.push('!src/background/*.html');
  }

  if (!enableContributions) {
    htmlSrc.push('!src/contribute/*.html');
  }

  if (!(mv3 && !['firefox', 'safari'].includes(targetEnv))) {
    htmlSrc.push('!src/offscreen/*.html');
  }

  return src(htmlSrc, {base: '.'})
    .pipe(gulpif(isProduction, htmlmin({collapseWhitespace: true})))
    .pipe(dest(distDir));
}

function css() {
  return src('src/base/*.css', {base: '.'}).pipe(postcss()).pipe(dest(distDir));
}

async function images(done) {
  await ensureDir(path.join(distDir, 'src/assets/icons/app'));
  const appIconSvg = await readFile('src/assets/icons/app/icon.svg');
  const appIconSizes = [16, 19, 24, 32, 38, 48, 64, 96, 128];
  if (targetEnv === 'safari') {
    appIconSizes.push(256, 512, 1024);
  }
  for (const size of appIconSizes) {
    await sharp(appIconSvg, {density: (72 * size) / 24})
      .resize(size)
      .toFile(path.join(distDir, `src/assets/icons/app/icon-${size}.png`));
  }

  if (isProduction) {
    await new Promise(resolve => {
      src(path.join(distDir, 'src/assets/icons/app/*.png'), {
        base: '.',
        encoding: false
      })
        .pipe(imagemin([optipng()]))
        .pipe(dest('.'))
        .on('error', done)
        .on('finish', resolve);
    });
  }

  await new Promise(resolve => {
    src('src/assets/icons/@(app|misc|sponsors)/*.@(png|svg)', {
      base: '.',
      encoding: false
    })
      .pipe(gulpif(isProduction, imagemin([svgo()])))
      .pipe(dest(distDir))
      .on('error', done)
      .on('finish', resolve);
  });

  if (enableContributions) {
    await new Promise(resolve => {
      src(
        'node_modules/vueton/components/contribute/assets/*.@(png|webp|svg)',
        {encoding: false}
      )
        .pipe(gulpif(isProduction, imagemin([svgo()])))
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
      'node_modules/@fontsource/roboto/files/roboto-latin-@(400|500|700)-normal.woff2',
      {encoding: false}
    )
      .pipe(dest(path.join(distDir, 'src/assets/fonts/files')))
      .on('error', done)
      .on('finish', resolve);
  });
}

async function locale(done) {
  const localesRootDir = path.join(__dirname, 'src/assets/locales');
  const localeDirs = (
    await Promise.all(
      (await readdir(localesRootDir)).map(async function (file) {
        if ((await lstat(path.join(localesRootDir, file))).isDirectory()) {
          return file;
        }
      })
    )
  ).filter(Boolean);

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
          parsedJson.version = appVersion;
          return parsedJson;
        }
      })
    )
    .pipe(gulpif(isProduction, jsonmin()))
    .pipe(dest(distDir));
}

async function license(done) {
  let year = '2018';
  const currentYear = new Date().getFullYear().toString();
  if (year !== currentYear) {
    year = `${year}-${currentYear}`;
  }

  let notice = `Buster: Captcha Solver for Humans
Copyright (c) ${year} Armin Sebastian
`;

  if (['safari', 'samsung'].includes(targetEnv)) {
    await writeFile(path.join(distDir, 'NOTICE'), notice);
  } else {
    notice = `${notice}
This software is released under the terms of the GNU General Public License v3.0.
See the LICENSE file for further information.
`;
    await writeFile(path.join(distDir, 'NOTICE'), notice);

    await new Promise(resolve => {
      src('LICENSE')
        .pipe(dest(distDir))
        .on('error', done)
        .on('finish', resolve);
    });
  }
}

async function secrets() {
  try {
    let data = process.env.BUSTER_SECRETS;
    if (data) {
      data = JSON.parse(data);
    } else {
      data = await readJson('secrets.json');
    }
    data = JSON.stringify(data);

    const key = CryptoJS.SHA256(
      (
        await readFile(path.join(distDir, 'src/background/script.js'))
      ).toString() +
        (await readFile(path.join(distDir, 'src/base/script.js'))).toString()
    ).toString();

    const ciphertext = CryptoJS.AES.encrypt(data, key).toString();

    await writeFile(path.join(distDir, 'secrets.txt'), ciphertext);
  } catch (err) {
    console.log(
      'Secrets are missing, secrets.txt will not be included in the extension package.'
    );
  }
}

const build = series(
  init,
  parallel(js, html, css, images, fonts, locale, manifest, license),
  secrets
);

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

export {build, zip, inspect, secrets};
