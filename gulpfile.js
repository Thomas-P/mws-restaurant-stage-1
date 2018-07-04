const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const ts = require('gulp-typescript');

const OUTPUT = './dist';

gulp.task('default', ['browser-sync', 'copy-html', 'styles', 'ts'], () => {

    return gulp
        .watch('src/sass/**/*.scss', ['styles'])
        .watch('src/**/*.ts', ['ts'])
        .watch('src/**/*.html', ['copy-html'])
        .on('change', browserSync.reload);
});

gulp.task('copy-html', () => {
    return gulp
        .src('src/**/*.html')
        .dest(OUTPUT);
});

gulp.task('styles', () => {
    return gulp
        .src('src/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Chrome 31']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${OUTPUT}/css`))
});


// Static server
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./build"
        }
    });
});

gulp.task('ts', function () {
    return gulp.src('src/**/*.ts')
        .pipe(ts({
            noImplicitAny: true,
            outFile: 'output.js'
        }))
        .pipe(gulp.dest(`${OUTPUT}`));
});