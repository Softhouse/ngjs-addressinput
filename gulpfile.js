var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var del = require('del');
var runSequence = require('run-sequence');
var babel = require('gulp-babel');

// Deletes the ./dist folder
gulp.task('delete-dist-folder', function() {
  return del(['./dist']);
});

// 
// Concatenates application scripts (defined in config) and writes
// one single file to destination folder.
gulp.task('app-scripts', function () {
  return gulp.src([
      './src/ngjs-addressinput.module.js',
      './src/ngjs-addressinput.directive.js',
      './src/ngjs-addressvalidator.directive.js'
    ])
    .pipe(concat('ngjs-addressinput.js'))
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('./dist'));
});

//
// Convinience task for building a fresh build-folder without serving.
gulp.task('dist', function (callback) {
  return runSequence('delete-dist-folder', 'app-scripts', callback);
});





