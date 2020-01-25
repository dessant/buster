const path = require('path');
const {exec} = require('child_process');
const {lstatSync, readdirSync, readFileSync, writeFileSync} = require('fs');

const {ensureDirSync} = require('fs-extra');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const svgmin = require('gulp-svgmin');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const del = require('del');
const jsonMerge = require('gulp-merge-json');
const jsonmin = require('gulp-jsonmin');
const svg2png = require('svg2png');
const imagemin = require('gulp-imagemin');

const targetEnv = process.env.TARGET_ENV || 'firefox';
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.join('dist', targetEnv);

gulp.task('clean', function() {
  return del([distDir]);
});

gulp.task('js:webpack', function(done) {
  exec('webpack-cli --display-error-details --bail --colors', function(
    err,
    stdout,
    stderr
  ) {
    console.log(stdout);
    console.log(stderr);
    done(err);
  });
});

gulp.task('js:babel', function(done) {
  gulp
    .src(['src/content/**/*.js'], {base: '.'})
    .pipe(babel())
    .pipe(gulp.dest(distDir));
  done();
});

gulp.task('js', gulp.parallel('js:webpack', 'js:babel'));

gulp.task('html', function(done) {
  gulp
    .src('src/**/*.html', {base: '.'})
    .pipe(gulpif(isProduction, htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest(distDir));
  done();
});

gulp.task('css', function(done) {
  gulp
    .src(['src/solve/style.css'], {
      base: '.'
    })
    .pipe(postcss())
    .pipe(gulp.dest(distDir));
  done();
});

gulp.task('icons', async function(done) {
  ensureDirSync(`${distDir}/src/icons/app`);
  const iconSvg = readFileSync('src/icons/app/icon.svg');
  const appIconSizes = [16, 19, 24, 32, 38, 48, 64, 96, 128];
  for (const size of appIconSizes) {
    const pngBuffer = await svg2png(iconSvg, {width: size, height: size});
    writeFileSync(`${distDir}/src/icons/app/icon-${size}.png`, pngBuffer);
  }

  if (isProduction) {
    gulp
      .src(`${distDir}/src/icons/**/*.png`, {base: '.'})
      .pipe(imagemin())
      .pipe(gulp.dest('.'));
  }

  gulp
    .src('node_modules/ext-contribute/src/assets/*.svg')
    .pipe(gulpif(isProduction, svgmin()))
    .pipe(gulp.dest(`${distDir}/src/contribute/assets`));
  done();
});

gulp.task('fonts', function(done) {
  gulp
    .src('src/fonts/roboto.css', {base: '.'})
    .pipe(postcss())
    .pipe(gulp.dest(distDir));
  gulp
    .src('node_modules/typeface-roboto/files/roboto-latin-@(400|500|700).woff2')
    .pipe(gulp.dest(`${distDir}/src/fonts/files`));
  done();
});

gulp.task('locale', function(done) {
  const localesRootDir = path.join(__dirname, 'src/_locales');
  const localeDirs = readdirSync(localesRootDir).filter(function(file) {
    return lstatSync(path.join(localesRootDir, file)).isDirectory();
  });
  localeDirs.forEach(function(localeDir) {
    const localePath = path.join(localesRootDir, localeDir);
    gulp
      .src(
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
      .pipe(gulp.dest(path.join(distDir, '_locales', localeDir)));
  });
  done();
});

gulp.task('manifest', function(done) {
  gulp
    .src('src/manifest.json')
    .pipe(
      jsonMerge({
        fileName: 'manifest.json',
        edit: (parsedJson, file) => {
          if (['chrome', 'edge', 'opera'].includes(targetEnv)) {
            delete parsedJson.applications;
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
          }

          parsedJson.version = require('./package.json').version;
          return parsedJson;
        }
      })
    )
    .pipe(gulpif(isProduction, jsonmin()))
    .pipe(gulp.dest(distDir));
  done();
});

gulp.task('license', function(done) {
  let year = 2018;
  const currentYear = new Date().getFullYear();
  if (year !== currentYear) {
    year = `${year}-${currentYear}`;
  }

  const notice = `Buster: Captcha Solver for Humans
Copyright (c) ${year} Armin Sebastian

This software is released under the terms of the GNU General Public License v3.0.
See the LICENSE file for further information.
`;

  writeFileSync(`${distDir}/NOTICE`, notice);
  gulp.src(['LICENSE']).pipe(gulp.dest(distDir));
  done();
});

gulp.task('copy', function(done) {
  gulp
    .src('node_modules/ext-contribute/src/assets/*.@(jpg|png)')
    .pipe(gulp.dest(`${distDir}/src/contribute/assets`));
  done();
});

gulp.task(
  'build',
  gulp.series(
    'clean',
    gulp.parallel(
      'js',
      'html',
      'css',
      'icons',
      'fonts',
      'locale',
      'manifest',
      'license'
    ),
    'copy'
  )
);

gulp.task('zip', function(done) {
  exec(
    `web-ext build -s dist/${targetEnv} -a artifacts/${targetEnv} --overwrite-dest`,
    function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
});

gulp.task('inspect', function(done) {
  exec(
    `webpack --profile --json > report.json && webpack-bundle-analyzer report.json dist/firefox/src && sleep 10 && rm report.{json,html}`,
    function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      done(err);
    }
  );
});

gulp.task('default', gulp.series('build'));
