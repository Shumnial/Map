'use strict';
const _ = require('lodash'),
      path = require('path'),
      gulp = require('gulp'),
      del = require('del'),
      log = require('fancy-log'),
      less = require('gulp-less'),
      gls = require('gulp-live-server'),
      prettify = require('gulp-html-prettify'),
      replace = require('gulp-replace'),
      merge = require('merge-stream'),
      sourcemaps = require('gulp-sourcemaps'),
      LessPluginAutoPrefix = require('less-plugin-autoprefix'),
      LessPluginCleanCSS = require('less-plugin-clean-css'),
      uglify = require('gulp-uglify'),
      concat = require('gulp-concat'),
      notify = require('gulp-notify'),
      babel = require('gulp-babel'),
      exec = require('child_process').exec,
      gap = require('gulp-append-prepend'),
      runSequence = require('run-sequence'),
      imagemin = require('gulp-imagemin'),
      svgSprite = require('gulp-svg-symbols'),
      svgo = require('gulp-svgo'),
      config = require('./config.json');

gulp.task('sprites', function () {
    return gulp.src('public/svg/*.svg')
        .pipe(svgo({
          removeXMLProcInst: true,
          removeTitle: true,
          removeComments: true,
          removeStyleElement: true,
          convertPathData: true
        }))
        .pipe(svgSprite({
          id: "i-%f",
          svgClassname: "svg-icon-store",
          templates: ['default-svg']
        }))
        .pipe(gulp.dest("views/blocks"));
});

gulp.task('less:dev', () => {
  const autoprefix = new LessPluginAutoPrefix({
    browsers: ["last 2 versions"]
  });

  return gulp.src('public/less/*.less')
    //.pipe(sourcemaps.init())
    .pipe(gap.prependText(`@storage: "../storage/";`))
    .pipe(less({
      plugins: [autoprefix]
    })
      .on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "Less Compile Error"
      }))
    )
    //.pipe(sourcemaps.write('.', {includeContent: false, mapSources: 'public/less/**'}))
    .pipe(gulp.dest('public/stylesheets/'));
});

gulp.task('less:prod', () => {
  let cleancss = new LessPluginCleanCSS({
      advanced: true
    });

  let autoprefix = new LessPluginAutoPrefix({
      browsers: ["last 10 versions", "IE 8", "IE 9", "IE 10", "IE 11"]
    });

  return gulp.src('public/less/*.less')
    .pipe(gap.prependText(`@storage: "${config.storage}";`))
    .pipe(less({
      plugins: [autoprefix, cleancss]
    })
      .on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "Less Compile Error"
      }))
    )
    .pipe(gulp.dest('public/stylesheets/'));
});

gulp.task('js', () => {
  return gulp.src('public/javascripts/sources/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    })
      .on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "JS Compile Error"
      }))
    )
    .pipe(uglify())
    .pipe(sourcemaps.write('../javascripts/'))
    .pipe(gulp.dest('public/javascripts/'));
});

gulp.task('imgmin', () => {
    gulp.src('public/images/*')
      .pipe(imagemin([
          imagemin.gifsicle({interlaced: true}),
          imagemin.jpegtran({progressive: true}),
          imagemin.optipng({optimizationLevel: 5}),
          imagemin.svgo({})
      ]))
      .pipe(gulp.dest(`${config.buildDir}/images`))});

gulp.task('compressLib', () => {
  return gulp.src(['public/javascripts/libs/*.js'])
    .pipe(uglify())
    .pipe(concat('libs.js'))
    .pipe(gulp.dest('public/javascripts/'));
});

gulp.task('lodash', cb => {
  // require npm install -g lodash-cli
  return exec(`lodash ${config.lodash} -p -o "public/javascripts/libs/lodash.custom.min.js"`, (err, stdout, stderr) => {
    console.log(`lodash file created with: ${config.lodash}`);
    cb(err)
  })
});

gulp.task('default', () => {
  let server = gls.new(['bin/www']);
  server.start();

  gulp.watch([
    'views/blocks/*.html', 
    'views/*.html', 
    'datasource/*.json', 
    'app.js', 
    'config.json', 
    'gulpfile.js', 
    'routes/**/*.js'
    ], file => {
      log(`File ${path.basename(file.path)} was ${file.type} => livereload`);
      server.start.bind(server)();
      server.notify.apply(server, [file]);
  });

  gulp.watch(['public/stylesheets/*.css', 'public/javascripts/*.js'], file => {
      log(`File ${path.basename(file.path)} was ${file.type} => livereload`);
      server.notify.apply(server, [file]);
  });

  gulp.watch(['public/javascripts/libs/*.js'], ['compressLib']);
  gulp.watch(['public/svg/*.svg'], ['sprites']);
  gulp.watch(['public/javascripts/sources/*.js'], ['js']);
  gulp.watch(['public/less/*.less', 'public/less/**/*.less'], ['less:dev']);
  gulp.watch(['public/__icons/*.png'], ['sprites']);
  
});

gulp.task('clean', () => {
  return del.sync([`${config.buildDir}/*`, `!${config.buildDir}/.git`, `!${config.buildDir}/.git/**`])
})

gulp.task('compileHtml', cb => {
  exec('node __export.js', (err, stdout, stderr) => {
    cb(err);
  });
});

gulp.task('exportHTML', () => {
  
  gulp.src(['html/*.html'])
    .pipe(prettify({
      indent_char: ' ',
      indent_size: 2
    }))
    .pipe(gulp.dest(`${config.buildDir}`));
});


gulp.task('copyStatic', () => {
  let arr = ['public/**'];
  if (config.buildIgnore.length > 0 ) {
    _.each(config.buildIgnore, el => {
      if (el.split('.').length === 1 ) {
        arr.push(`!public/${el}`, `!public/${el}/**`)
      } else {
        arr.push(`!public/${el}`);
      }
    })
  }
  
  gulp.src(arr).pipe(gulp.dest(`${config.buildDir}`))
});

gulp.task('publish', ['compileHtml'], cb => {
  runSequence('clean',
              'exportHTML',
              ['less:prod', 'js'],
              'copyStatic',
              'imgmin',
              cb)
});