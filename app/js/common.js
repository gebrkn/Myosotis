global.$f = $f = function(str) {
    var a = [].slice.call(arguments, 1), n = 0;
    return str.replace(/{(.*?)}/g, function(_, $1) {
        var ref = $1.split("."), narg = 0;

        if(/^\d+$/.test(ref[0]))
            narg = parseInt(ref.shift(), 10);
        else if(!ref[0]) {
            narg = n++;
            ref.shift();
        }
        return ref.reduce(function(o, k) {
            return o[k] || "";
        }, a[narg]);
    });
};

global.$local = $local = {
    get: function(key) {
        return JSON.parse(localStorage[key] || 'null');
    },
    set: function(key, val) {
        return localStorage[key] = JSON.stringify(val);
    }
};

global.DOMParser = DOMParser;

function renderGreek(s, feature) {
    var g = require('greek');
    return s.replace(/[^\s!?.,;]+/g, function(word) {
        if(word[0] == "@") // html entities
            return word;
        var m = word.match(/(.+?)(\d*)$/);
        var w = g.fromBeta(m[1]);
        if(m[2].length)
            w += "<sub>" + m[2] + "</sub>";
        return $f('<u data-form="{0}" data-feature="{1}">{2}</u>', word, feature || "", w);
    });
}
