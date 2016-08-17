var gulp        = require('gulp');
var $           = require('gulp-load-plugins')({
  rename: {
    'gulp-merge-media-queries': 'mmq'
  }
});
var	browserSync = require('browser-sync').create();
var	sequence    = require('run-sequence');
var	del         = require('del');
var panini      = require('panini');

var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

var PATH = {

  dist: 'dist',
  assets: 'dist/assets',
  sass: [
    'bower_components/sanitize-css',
    'src/assets/scss/components',
    'src/assets/scss/pages'
  ],
  javascript: [
    'src/assets/js/app.js'
  ],
  jquery: [
    'bower_components/jquery/dist/jquery.slim.min.js'
  ]
}

/*
 * Browsersync
 */

gulp.task('browserSync', function() {
	browserSync.init({
    server: 'dist',
    port:   8000,
    notify: true, // boolean value, Toggle notifications of bsync activity
    open:   false // toggle auotmatic opening of webpage upong bsync starting
    });
});

/*
 * PANINI
 */
gulp.task('pages', function() {
  gulp.src('src/pages/**/*.html')
    .pipe(panini({
      root:     'src/pages/',
      layouts:  'src/layouts/',
      partials: 'src/partials/',
      helpers:  'src/helpers/',
      data:     'src/data/'
    }))
    .pipe(gulp.dest('dist'));
});
gulp.task('resetPanini', function(){
  return panini.refresh();
});
gulp.task('reloadPages', function(cb) {
  sequence(
    'resetPanini',
    'pages',
    cb
  )
});

/*
 * PIPES
 */

/* Clean */
gulp.task('clean', function() {
  return del('./dist');
});

/* Dev Images */
gulp.task('devImages', function() {
  return gulp.src('src/assets/imgs/**/*')
  .pipe(gulp.dest(PATH.assets + '/imgs'));
});

gulp.task('jquery', function() {
  return gulp.src(PATH.jquery)
  .pipe(gulp.dest(PATH.assets + '/js'));
});

/* Compile SCSS */
gulp.task('compileSass', function() {
	return gulp.src('src/assets/scss/app.scss')
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			includePaths: PATH.sass
		})
			.on('error', $.sass.logError)
		)
		.pipe($.mmq({
			log: true
		}))
		.pipe($.autoprefixer({
			browsers: COMPATIBILITY
		}))
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest(PATH.assets + '/css'))
		.pipe(browserSync.stream({ // Inject Styles
			match: '**/*.css' // Force source map exclusion *This fixes reloading issue on each file change*
		}));
});

/* Concatinate Main JS Files */
gulp.task('concatScripts', function() {
	return gulp.src(PATH.javascript)
	.pipe($.sourcemaps.init())
	.pipe($.concat('app.js'))
	.pipe($.sourcemaps.write('./'))
	.pipe(gulp.dest(PATH.assets + '/js'));
});

/* Watch Task */
gulp.task('watch', ['browserSync'], function() {
	gulp.watch('src/assets/scss/**/*.scss', ['compileSass']);
  gulp.watch('src/assets/js/**/*.js', ['concatScripts']).on('change', browserSync.reload);
  gulp.watch('src/assets/imgs/**/*', ['devImages']).on('change', browserSync.reload);
	gulp.watch(['src/data/**/*', 'src/helpers/**/*', 'src/layouts/**/*', 'src/pages/**/*', 'src/partials/**/*'], ['reloadPages']).on('change', browserSync.reload);
});

/* Development Task */
gulp.task('dev', function(cb) {
	sequence(
		'clean',
    'pages',
    'devImages',
    // 'fonts',
    'jquery',
		'compileSass',
		'concatScripts',
		cb
	);
});

gulp.task('default', function() {
  gulp.start('watch', ['dev']);
});
