var $history = (function() {

    var forms = [];
    var maxlen = 100;
    var persist = true;

    function drop() {
        forms = [];
        if(persist)
            $local.set("history", forms);
        update();
    }

    function add(form) {
        forms = forms.filter(function(x, n) { return x != form && forms.indexOf(x) == n });
        forms = forms.slice(0, maxlen - 1);
        forms.unshift(form);
        if(persist)
            $local.set("history", forms);
    }

    function update() {
        $("#history div").html(forms.map(function(f) {
            return "<p>" + renderGreek(f) + "</p>";
        }));
    }

    var init = function() {

        forms = persist ? ($local.get("history") || []) : [];

        if(forms.length) {
            $("body").trigger("loadPage", {form: forms[0]});
        }

        update();


        $("body").on("pageLoaded", function(e, data) {
            add(data.form);
            update();
        });

    };

    return {
        init: init,
        content: function() { return forms }
    }


})();