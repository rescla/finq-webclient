//region Require
var gulp = require('gulp');
var gulpif = require('gulp-if');
var del = require('del');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sass = require('gulp-sass');
var minimist = require('minimist');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var autoPrefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var inject = require('gulp-inject');
var ngAnnotate = require('gulp-ng-annotate');
var karma = require('karma').server;
var mainBowerFiles = require('main-bower-files');
var scsslint = require('gulp-scss-lint');
var bourbon = require('node-bourbon');
var neat = require('node-neat');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
//endregion

// region Config
var config = require('./gulpconfig.json');
var paths = config.paths;

var knownOptions = {
    string: 'env',
    default: {env: config.env.default}
};

var options = minimist(process.argv.slice(2), knownOptions);
var env = config.env[options.env];
var karmaDebug = false;
var karmaCoverage = true;
//endregion

// region Tasks
gulp.task('default', function (done) {
    runSequence('clean', 'moveFiles',
        ['scripts', 'sass'], 'injectDependencies', done);
});
gulp.task('serve', function (done) {
    runSequence('default', 'browser-sync', done);
});
gulp.task('test', function (done) {
    runSequence('moveVendors', 'karma', done);
});
gulp.task('testDebug', function (done) {
    karmaDebug = true;
    karmaCoverage = false;
    runSequence('karma');
});
gulp.task('testWatch', function (done) {
    runSequence('moveVendors', 'karmaWatch')
});

gulp.task('clean', Clean);
gulp.task('moveVendors', MoveVendorFiles);
gulp.task('moveViews', MoveViews);
gulp.task('moveStatics', MoveStatics);
gulp.task('moveConfig', MoveConfig);
gulp.task('moveLang', MoveLang);
gulp.task('moveFontAwesomeFonts', MoveFontAwesomeFonts);
gulp.task('injectDependencies', InjectDependencies);
gulp.task('jshint', JsHint);
gulp.task('scsslint', ScssLint);
gulp.task('scripts', Scripts);
gulp.task('sass', Sass);
gulp.task('browser-sync', BrowserSync);
gulp.task('karma', Karma);
gulp.task('moveFiles', MoveFiles);
gulp.task('karmaWatch', ['karma'], KarmaWatch);
//endregion

// region Helper functions
function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}
//endregion

// region Function declarations
/**
 * Clean
 */
function Clean() {
    del.sync(['./build']);
}

function MoveFiles() {
    var bower = MoveVendorFiles();
    var faFonts = MoveFontAwesomeFonts();
    var views = MoveViews();
    var statics = MoveStatics();
    var config = MoveConfig();
    var lang = MoveLang();

    return merge(bower, faFonts, views, statics, config, lang);
}

function MoveVendorFiles() {
    return gulp.src(mainBowerFiles(), {buffer: false})
        .pipe(gulp.dest(paths.dest.vendor))
        .pipe(reload({stream: true}));
}

function MoveFontAwesomeFonts() {
    return gulp.src(paths.src.fafonts, {buffer: false})
        .pipe(gulp.dest(paths.dest.fonts))
        .pipe(reload({stream: true}));
}

function MoveViews() {
    return gulp.src(paths.src.views + '/**/*', {buffer: false})
        .pipe(gulp.dest(paths.dest.views))
        .pipe(reload({stream: true}));
}

/**
 * Move files in source root, exclude index.html because that is parsed
 */
function MoveStatics() {
    return gulp.src([
        paths.sourcedir + '/*',
        '!' + paths.sourcedir + '/index.html'
    ], {nodir: true, dot: true, buffer: false})
        .pipe(gulp.dest(paths.basedir))
        .pipe(reload({stream: true}));
}

function MoveConfig() {
    return gulp.src(paths.src.scripts + '/config.json', {buffer: false})
        .pipe(gulp.dest(paths.dest.scripts))
        .pipe(reload({stream: true}));
}

/**
 * Move language files
 */
function MoveLang() {
    return gulp.src(paths.src.lang + '/**/*', {buffer: false})
        .pipe(gulp.dest(paths.dest.lang))
        .pipe(reload({stream: true}));
}

/**
 * Inject dependencies into index.html
 */
function InjectDependencies() {
    return gulp.src(paths.src.index)
        .pipe(inject(gulp.src([
            // Inject vendor libraries, always include angular first, then everything else
            paths.dest.vendor + '/jquery.js',
            paths.dest.vendor + '/angular.js',
            paths.dest.vendor + '/typeahead*.js',
            paths.dest.vendor + '/**/*.js'], {read: false}), {name: 'vendor', ignorePath: 'build'}))
        .pipe(inject(gulp.src([
            // Inject scripts, always include app.js first, then mocks, then everything else
            paths.dest.scripts + '/app.js',
            paths.dest.scripts + '/modules/mock.js',
            paths.dest.scripts + '/{mockdata,mockdata/**/*.js}', // Matcher for folder first, files second
            paths.dest.scripts + '/**/*.js'], {read: false}), {name: 'app', ignorePath: 'build'}))
        .pipe(inject(gulp.src([
            // Inject vendor css
            paths.dest.vendor + '/**/*.css'
        ], {read: false}), {name: 'vendor', ignorePath: 'build'}))
        .pipe(inject(gulp.src([
            // Inject css
            paths.dest.css + '/**/*.css'
        ], {read: false}), {name: 'app', ignorePath: 'build'}))
        .pipe(gulp.dest('build'))
        .pipe(reload({stream: true}));
}

/**
 * Check JS with jshint
 */
function JsHint() {
    return gulp.src(paths.src.scripts + '/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
}

/**
 * Check SCSS with scsslint
 */
function ScssLint() {
    gulp.src(paths.src.scss)
        .pipe(scsslint())
        .pipe(scsslint.failReporter());
}

/**
 * Generate sourcemaps and output to build
 * Minify if specified in current environment
 */
function Scripts() {
    var sources = [
        paths.src.scripts + '/app.js',
        (env.mockdata ? '' : '!') + paths.src.scripts + '/modules/mock.js',
        (env.mockdata ? '' : '!') + paths.src.scripts + '/mockdata/**/*',
        paths.src.scripts + '/**/*.js'
    ];

    var sourcesOptions = {base: paths.src.scripts};
    var concatFileName = 'all.min.js';

    return gulp.src(sources, sourcesOptions)
        .pipe(gulpif(env.sourcemaps, sourcemaps.init({gulpWarnings: false})))
        .pipe(ngAnnotate({gulpWarnings: false}))
        .on('error', swallowError)
        .pipe(gulpif(env.jsconcat, concat(concatFileName)))
        .pipe(gulpif(env.jsminify, uglify()))
        .pipe(gulpif(env.sourcemaps, sourcemaps.write()))
        .pipe(gulp.dest(paths.dest.scripts))
        .pipe(reload({stream: true}));
}

/**
 * Generate CSS from SASS and output to build
 * Includes autoPrefixer and sourcemaps
 * Minify if specified in current environment
 */
function Sass() {
    var source = paths.src.scss;

    return gulp.src(source)
        .pipe(gulpif(env.sourcemaps, sourcemaps.init()))
        .pipe(sass({
            includePaths: bourbon.with(neat.includePaths)
        }))
        .on('error', swallowError)
        .pipe(gulpif(env.scssminify, csso()))
        .pipe(autoPrefixer('last 1 version'))
        .pipe(gulpif(env.sourcemaps, sourcemaps.write()))
        .pipe(gulp.dest(paths.dest.css))
        .pipe(reload({stream: true}));
}

/**
 * Run Mocha tests with Karma
 */
function Karma(done) {
    var preprocessors = {};
    if (karmaCoverage){
        preprocessors[paths.src.scripts + '/controllers/**/*.js'] = ['coverage'];
        preprocessors[paths.src.scripts + '/directives/**/*.js'] = ['coverage'];
        preprocessors[paths.src.scripts + '/filters/**/*.js'] = ['coverage'];
        preprocessors[paths.src.scripts + '/modules/**/!(mock).js'] = ['coverage'];
        preprocessors[paths.src.scripts + '/services/**/*.js'] = ['coverage'];
    }
    preprocessors[paths.src.views + '/**/*.html'] = ['ng-html2js'];

    var browser = [
        karmaDebug ? 'Chrome' : 'PhantomJS'
    ];

    karma.start({
        configFile: __dirname + '/test/karma.conf.js',
        files: [
            paths.dest.vendor + '/angular.js',
            paths.dest.vendor + '/**/*.js',
            paths.src.scripts + '/*.js',
            paths.src.scripts + '/modules/*.js',
            paths.src.scripts + '/modules/**/*.js',
            paths.src.scripts + '/constants/**/*.js',
            paths.src.scripts + '/directives/**/*.js',
            paths.src.scripts + '/services/**/*.js',
            paths.src.scripts + '/controllers/**/*.js',
            paths.src.scripts + '/filters/**/*.js',
            paths.src.scripts + '/plugins/**/*.js',
            paths.src.scripts + '/mockdata/**/*.js',
            'test/unit/**/*.js',
            paths.src.views + '/**/*.html'
        ],
        preprocessors: preprocessors,
        singleRun: !karmaDebug,
        browsers: browser
    }, function (exitStatus) {
        done(exitStatus ? 'There are failing unit tests' : undefined);
    });
}

function KarmaWatch() {
    gulp.watch(paths.testdir + '/**/*', ['karma']);
}

/**
 * Serve files and watch for changes
 */
function BrowserSync() {
    browserSync({
        server: {
            baseDir: paths.basedir
        }
    });

    // Watch scripts
    gulp.watch(paths.src.scripts + '/**/*.js', function () {
        runSequence('scripts', 'injectDependencies');
    });

    // Watch scss
    gulp.watch(paths.src.scssfolder + '/**/*.scss', ['sass']);

    // Watch views
    gulp.watch(paths.src.views + '/**/*.html', ['moveViews']);

    // Watch index.html
    gulp.watch(paths.src.index, ['injectDependencies']);

    // Watch statics
    gulp.watch([
        paths.sourcedir + '/*',
        '!' + paths.sourcedir + '/index.html'
    ], ['moveStatics']);

    // Watch config
    gulp.watch(paths.src.scripts + '/config.json', ['moveConfig']);

    // Watch lang
    gulp.watch(paths.src.lang + '/**/*.json', ['moveLang']);
}
//endregion



