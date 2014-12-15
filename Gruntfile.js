module.exports = function(grunt) {

    var fs = require("fs");
    var shell = require("shelljs");
    var path = require("path");

    function expanduser(p) {
        return p.replace(/~/g, process.env.HOME);
    }

    var p = grunt.file.readJSON('package.json').options, opts = {};
    Object.keys(p).forEach(function(k) { opts[k] = expanduser(p[k]) });

    function $f(str, args) {
        return str.replace(/{(\d+)}/g, function(_, $1) {
            return args[$1];
        }).replace(/{#(\w+)}/g, function(_, $1) {
                return opt($1);
            });
    }

    opts['APP_NW'] = $f("{#BUILD_DIR}/app.nw");

    function opt(name) {
        return opts[name];
    }

    function isNewer(src, dest) {
        var sStat, dStat;

        sStat = fs.statSync(src); // must exist!
        try {
            dStat = fs.statSync(dest);
        } catch(e) {
            if(e.code == "ENOENT") {
                grunt.log.writeln("%s does not exist", dest);
                return true;
            }
        }

        if(sStat.mtime >= dStat.mtime) {
            grunt.log.writeln("%s is newer than %s", src, dest);
            return true;
        }

        //grunt.log.writeln("%s is older than %s", src, dest);
        return false;
    }

    function $$(cmd) {
        cmd = $f(cmd, [].slice.call(arguments, 1));
        grunt.log.writeln("\n> " + cmd);
        var rc = shell.exec(cmd).code;
        if(rc != 0) {
            throw grunt.util.error("Command failed, rc=" + rc);
        }
    }


    grunt.initConfig({
        options: opts,

        buildOSX: {
            app: $f("{#BUILD_DIR}/osx64/{#APPNAME}.app")
        },

        buildWin: {
            app: $f("{#BUILD_DIR}/win32/{#APPNAME}/{#APPNAME}.exe")
        },

        dictMorph: {
            compiler: $f("./compile_dicts.js"),
            src: $f("{#MORPH_PATH}"),
            dest: [
                $f("{#BUILD_DIR}/data/morph.dat"),
                $f("{#BUILD_DIR}/data/morph.idx"),
                $f("{#BUILD_DIR}/data/forms.dat"),
                $f("{#BUILD_DIR}/data/forms.idx")
            ]
        },

        dictML: {
            compiler: $f("./compile_dicts.js"),
            src: $f("{#ML_PATH}"),
            dest: [
                $f("{#BUILD_DIR}/data/ml.dat"),
                $f("{#BUILD_DIR}/data/ml.idx")
            ]
        }
    });


    grunt.registerTask("build", [
        "initBuild",
        "compileDicts",
        "makeApp",
        "buildOSX",
        "buildWin"
    ]);

    grunt.registerTask("initBuild", "", function() {
        $$("mkdir -p {#BUILD_DIR}/data");
        $$("exiftool -all= -overwrite_original -r ..");
    });

    grunt.registerTask("makeApp", "", function() {
        $$("rm -f {#APP_NW}");
        $$('cd ./app && zip -r {#APP_NW} * -x "*/.*"');
        $$('cd {#BUILD_DIR} && zip -r {#APP_NW} data/* -x "*/.*"');
        $$("zip -j {#APP_NW} {#FONT_PATH}");
        $$("echo \"VERSION='{#VERSION}'\" | tee {#BUILD_DIR}/version.js");
        $$("zip -j {#APP_NW} {#BUILD_DIR}/version.js");
        $$("zip -j {#APP_NW} ./icons.iconset/icon_128x128.png");
        $$("zip -j {#APP_NW} ./node_modules/jquery/dist/jquery.js");
    });

    grunt.registerTask("compileDicts", "", function() {
        grunt.task.requires("initBuild");

        ["Morph", "ML"].forEach(function(dict) {
            var conf = grunt.config.get("dict" + dict);
            if(conf.dest.every(function(d) { return !isNewer(conf.compiler, d)})) {
                grunt.log.writeln("%s: nothing to do", dict);
                return;
            }
            var dir = path.dirname(conf.dest[0]);
            grunt.log.writeln("compile %s: %s => %s", dict, conf.src, dir);
            require(conf.compiler).compile(dict, conf.src, dir);
        });
    });

    grunt.registerTask("buildOSX", "", function() {

        function patchPlist(plist, appName) {
            grunt.log.writeln("patching plist");
            var s = fs.readFileSync(plist, "ascii");
            s = s.replace(/(<key>(?:CFBundleDisplayName|CFBundleName)<\/key>\s*<string>).+?(<\/string>)/g, "$1" + appName + "$2");
            fs.writeFileSync(plist, s, "ascii");
        }

        var app = grunt.config.get(this.name).app;
        var dir = path.dirname(app);

        var nwpath = $f("{#NW_PATH}/node-webkit-v{#NW_VERSION}-osx-x64");

        $$("mkdir -p {0}", dir);

        if(!fs.existsSync(app)) {
            $$("cp -r {0}/node-webkit.app {1}/", nwpath, app);
        }

        $$("rm -f {0}/Contents/Resources/*", app);
        $$("cp {#APP_NW} {0}/Contents/Resources", app);

        patchPlist(app + "/Contents/Info.plist", opt("APPNAME"));
        $$("iconutil --convert icns --output {0}/Contents/Resources/nw.icns ./icons.iconset", app);
    });

    grunt.registerTask("buildWin", "", function() {

        var app = grunt.config.get(this.name).app;
        var dir = path.dirname(app);

        var nwpath = $f("{#NW_PATH}/node-webkit-v{#NW_VERSION}-win-ia32");

        $$("mkdir -p {0}", dir);

        if(!fs.existsSync(dir + "/locales")) {
            $$("mkdir -p {0}/locales", dir);
            $$("cp {0}/nw.pak {1}",  nwpath, dir);
            $$("cp {0}/icudtl.* {1}", nwpath, dir);
            $$("cp {0}/locales/en-US.pak {1}/locales", nwpath, dir);
        }

        $$("cp {0}/nw.exe {1}", nwpath, app);
        fs.appendFileSync(app, fs.readFileSync($f("{#APP_NW}")));
    });

    grunt.registerTask("dist", "", function() {
        $$("mkdir -p {#BUILD_DIR}/dist");
        $$('cd {#BUILD_DIR}/osx64 && rm -f {#BUILD_DIR}/dist/{#APPNAME}-{#VERSION}-osx.zip && zip -r {#BUILD_DIR}/dist/{#APPNAME}-{#VERSION}-osx.zip -r {#APPNAME}.app -x "*/.*" ');
        $$('cd {#BUILD_DIR}/win32 && rm -f {#BUILD_DIR}/dist/{#APPNAME}-{#VERSION}-win.zip && zip -r {#BUILD_DIR}/dist/{#APPNAME}-{#VERSION}-win.zip    {#APPNAME}/*   -x "*/.*" ');
    });
    
    grunt.registerTask("clean", "", function() {
        $$("rm -rf {#BUILD_DIR}");
    });

};
