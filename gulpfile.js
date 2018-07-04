const gulp = require('gulp');

const sass = require('gulp-sass');
const csso = require('gulp-csso');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const inlineCss = require('gulp-inline-css');

const browserSync = require('browser-sync').create();
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify-es').default;
const mainProject = ts.createProject('tsconfig.json', {
    typescript: require('typescript')
});

const OUTPUT = './dist';

gulp.task('copy-html', () => {
    return gulp
        .src('src/**/*.html')
        //.pipe(inlineCss())
        .pipe(gulp.dest(OUTPUT));
});

gulp.task('styles', () => {
    return gulp
        .src('src/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(csso({
            restructure: true,
            debug: true
        }))
        .pipe(concat('styles.css'))
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
        .pipe(sourcemaps.init())
        .pipe(mainProject())
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(`${OUTPUT}`));
});

gulp.task('copy-data', () => {
    return gulp
        .src('src/**/*.json')
        .pipe(gulp.dest(`${OUTPUT}`));
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