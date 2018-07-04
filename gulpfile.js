const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const ts = require('gulp-typescript');
const mainProject = ts.createProject('tsconfig.json', {
    typescript: require('typescript')
});

const OUTPUT = './dist';

gulp.task('copy-html', () => {
    return gulp
        .src('src/**/*.html')
        .pipe(gulp.dest(OUTPUT));
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
gulp.task('browser-sync', () => {
    browserSync
        .init({
            server: {
                baseDir: "./dist"
            }
        });
});

gulp.task('ts', function () {
    return gulp
        .src('src/**/*.ts')
        .pipe(mainProject())
        .pipe(gulp.dest(`${OUTPUT}`));
});

gulp.task('copy-data', () => {
    return gulp
        .src('src/data/**/*')
        .pipe(gulp.dest(`${OUTPUT}/data`));
});

gulp.task('images', () => {
    return gulp
        .src('src/img/**/*')
        .pipe(gulp.dest(`${OUTPUT}/img`));
});

gulp.task('default', gulp.parallel('ts', 'styles', 'copy-html', 'copy-data', 'images', 'browser-sync'));


gulp.task('watch', () => {
    gulp.watch('src/sass/**/*.scss', gulp.parallel('styles'));
    gulp.watch('src/**/*.ts', gulp.parallel('ts'));
    gulp.watch('src/**/*.html', gulp.parallel('copy-html'))
        .on('change', browserSync.reload);
});