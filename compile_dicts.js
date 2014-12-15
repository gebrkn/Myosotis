module.paths.unshift("./app/node_modules");


var fs = require("fs");
var d = require("dictbase");
var greek = require("greek");

function compileMorph(src, outDir) {


    function eqBuf(a, b) {
        if(a.length != b.length)
            return false;
        for(var i = 0; i < b.length; i++)
            if(a.readInt8(i) != b.readInt8(i))
                return false;
        return true;
    }

    function formExists(es, e) {
        return es.some(function(x, e) {
            var z = x.form === e.form && x.lemma === e.lemma && eqBuf(x.buf, e.buf);
            if(z)
                console.log("FOUND", x, morph.unpack(x.buf));

            return z;
        });
    }

    console.log("collecting");

    var p = fs.readFileSync(src, {encoding:"ascii"});
    var raw = [];

    p.replace(/<analysis>([\s\S]+?)<\/analysis>/g, function(_, $1) {
        var e = {};
        $1.replace(/<(\w+)>(.+?)<\/\1>/g, function(_, k, v) {
            e[k] = v;
        });
        raw.push(e);
    });

    var fo2le = {};
    var le2fo = {};

    raw.forEach(function(e) {
        // remove dash, macron, breve???
        e.form  = e.form.replace(/[_^-]/g, "");
        e.lemma = e.lemma.replace(/[_^-]/g, "");

        // if lemma is lower, lowercase the form too
        if(e.lemma.indexOf("*") < 0)
            e.form = greek.lower(e.form);

        if(!fo2le[e.form])
            fo2le[e.form] = {form:e.form, lemmas:{}};
        fo2le[e.form].lemmas[e.lemma] = 1;

        if(!le2fo[e.lemma])
            le2fo[e.lemma] = {lemma:e.lemma, entries:[]};
        le2fo[e.lemma].entries.push(e);

    });
    raw = null;

    console.log("writing forms");

    fo2le = Object.keys(fo2le).map(function(x) {
        x = fo2le[x];
        x.lemmas = Object.keys(x.lemmas).sort(d.keycmp);
        return x;
    }).sort(function(x, y) {
        return d.keycmp(x.form, y.form) || d.cmp(x.form, y.form);
    });

    var forms = require("forms.js");

    forms.openWrite(outDir);
    fo2le.forEach(function(x) {
        forms.write(x.form, x.lemmas);
    });
    forms.closeWrite();

    console.log("writing morph");

    var morph = require("morph.js");

    morph.openWrite(outDir);
    Object.keys(le2fo).sort().forEach(function(x) {
        morph.write(le2fo[x].lemma, le2fo[x].entries);
    });
    morph.closeWrite();

}

function compileML(src, outDir) {

    var p = fs.readFileSync(src, {encoding:"ascii"});
    var entries = {};

    p = p.replace(/<!--[\s\S]*?-->/g, "");

    p.replace(/<entry.+?key="(.+?)".*?>([\s\S]+?)<\/entry>/g, function(_, key, s) {
        entries[key] = s;
    });

    var ml = require("ml.js");
    ml.openWrite(outDir);

    Object.keys(entries).sort().forEach(function(lemma) {
        ml.write(lemma, entries[lemma]);
    });
    ml.closeWrite();
}

module.exports = {
    compile: function(dict, src, outDir) {
        if(dict == "Morph")
            compileMorph(src, outDir);
        if(dict == "ML")
            compileML(src, outDir);
    }
};

