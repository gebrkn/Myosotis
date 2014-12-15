var $dict = (function() {

    var dicts = null, forms = null;

    return {
        init: function(dir) {

            dicts = {
                ml   : require('ml').openRead(dir),
                morph: require('morph').openRead(dir)
            };

            forms = require('forms').openRead(dir);
        },

        similarForms: function(form, limit) {
            return forms.similars(form, limit || 30);
        },

        lemmas: function(form) {
            return forms.lemmas(form)
        },

        renderAll: function(lemmas, renderGreek) {
            // returns {lemma1: {dict1: entry, dict2: entry}, lemma2: ... }

            var r = {};

            lemmas.forEach(function(lemma) {
                Object.keys(dicts).forEach(function(dictName) {
                    dicts[dictName].lookup(lemma).forEach(function(e) {
                        if(!r[e.key])
                            r[e.key] = {};
                        r[e.key][dictName] = dicts[dictName].render(e, renderGreek);
                    });
                });
            });

            return r;
        }

    };

})();