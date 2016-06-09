"use strict";
// generated on 2015-04-16 using generator-gulp-bootstrap 0.0.4

var gulp        = require("gulp");
var browserSync = require("browser-sync");
var reload      = browserSync.reload;
var gutil       = require("gulp-util");
var useref      = require("gulp-useref");
var gulpif      = require("gulp-if");
var jslint      = require("gulp-jslint");

// load plugins
var $ = require("gulp-load-plugins")();

gulp.task("styles", function () {
    return gulp.src("ARS.Dispatch/styles/main.scss")
        .pipe($.sass({ errLogToConsole: true }))
        .pipe($.autoprefixer("last 1 version"))
        .pipe(gulp.dest("ARS.Dispatch/styles"))
        .pipe(gulp.dest("dist/styles"))
        .pipe(reload({ stream: true }))
        .pipe($.size());
});

gulp.task("lint", function () {
    var paths;
    paths = [];
    paths.push("ARS.Dispatch/scripts/**/*.js");
    paths.push("!ARS.Dispatch/scripts/jquery-ui-1.11.4.custom/**/*.js");
    paths.push("!ARS.Dispatch/scripts/lib/**/*.js");
    paths.push("!ARS.Dispatch/scripts/vendor/**/*.js");
    return gulp.src(paths).pipe(jslint({
        white: true,
        "this": true
    }));
});

gulp.task("scripts", [ "lint" ], function () {
    return gulp.src("ARS.Dispatch/scripts/**/*.js")
        .pipe($.uglify())
        .pipe($.size());
});

gulp.task("html", [ "styles", "scripts" ], function () {
    var jsFilter = $.filter("**/*.js");
    var cssFilter = $.filter("**/*.css");
    var assets = useref.assets();

    return gulp.src("ARS.Dispatch/**.html")
        .pipe(assets)
        .pipe(jsFilter)
        .pipe(gulpif("**.js", $.uglify()))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe(gulpif("**.css", $.csso()))
        .pipe(cssFilter.restore())
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest("dist"))
        .pipe($.size());
});

gulp.task("images", function () {
    return gulp.src("ARS.Dispatch/images/**/*")
        .pipe($.imagemin({
            optimizationLevel: 3,
            progressive:       true,
            interlaced:        true
        }))
        .pipe(gulp.dest("dist/images"))
        .pipe(reload({
            stream: true,
            once: true
        }))
        .pipe($.size());
});

gulp.task("fonts", function () {
    var streamqueue = require("streamqueue");
    return streamqueue({
        objectMode: true
    }, $.bowerFiles(), gulp.src("ARS.Dispatch/fonts/**/*"))
        .pipe($.filter("**/*.{eot,svg,ttf,woff,woff2}"))
        .pipe($.flatten())
        .pipe(gulp.dest("dist/fonts"))
        .pipe($.size());
});

gulp.task("clean", function () {
    return gulp.src(
        [ "ARS.Dispatch/styles/main.css", "dist" ],
        { read: false })
        .pipe($.clean());
});

gulp.task("build", ["html", "images", "fonts"]);

gulp.task("default", ["clean"], function () {
    gulp.start("build");
});

gulp.task("serve", ["styles"], function () {
    browserSync.init(null, {
        server: {
            baseDir: "ARS.Dispatch",
            directory: true
        },
        debugInfo: false,
        open: false,
        hostnameSuffix: ".xip.io"
    }, function (err, bs) {
        require("opn")(bs.options.url);
        console.log("Started connect web server on " + bs.options.url);
    });
});

// inject bower components
gulp.task("wiredep", function () {
    var wiredep = require("wiredep").stream;
    gulp.src("ARS.Dispatch/styles/*.scss")
        .pipe(wiredep({
            directory: "ARS.Dispatch/bower_components"
        }))
        .pipe(gulp.dest("ARS.Dispatch/styles"));
    gulp.src("ARS.Dispatch/*.html")
        .pipe(wiredep({ directory: "ARS.Dispatch/bower_components" }))
        .pipe(gulp.dest("ARS.Dispatch"));
});

gulp.task("watch", ["serve"], function () {
    // watch for changes
    gulp.watch([ "ARS.Dispatch/*.html" ], reload);
    gulp.watch("ARS.Dispatch/styles/**/*.scss", [ "styles" ]);
    gulp.watch("ARS.Dispatch/scripts/**/*.js", [ "scripts" ]);
    gulp.watch("ARS.Dispatch/fonts/*", [ "fonts" ]);
    gulp.watch("ARS.Dispatch/images/**/*", [ "images" ]);
    gulp.watch("bower.json", [ "wiredep" ]);
});
