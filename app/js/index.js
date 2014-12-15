$index = (function() {

    var g = require('greek');


    function page(form) {
        var tabs = "", labels = "";

        function tab(lemma, n, defs) {
            var r = externalLinks(lemma);
            var top = Object.keys(r).map(function(k) {
                return $f("<a href='{0}'>{1}</a>", r[k], k);
            }).join(" | ");

            return $f("<div id='t{0}' class='tab'><p class='tabtop'>{1}</p>{2}</div>", n, top, defs);
        }

        var r = $dict.renderAll($dict.lemmas(form), renderGreek);

        Object.keys(r).sort().forEach(function(lemma, n) {
            labels += $f("<td id='l{0}'>{1}</td>", n, renderGreek(lemma));

            var defs = Object.keys(r[lemma]).map(function(dictName) {
                return $f("<div class='entry {0}'>{1}</div>", dictName, r[lemma][dictName]);
            }).join("");

            tabs += tab(lemma, n, defs);
        });

        if(!labels.length) {
            labels += $f("<td id='l{0}'>{1}</td>", 0, renderGreek(form));
            tabs += tab(form, 0, "");
        }

        return $f("<div class='tabs'><table class='tablabels'><tr>{0}</tr></table>{1}</div>", labels, tabs);
    }

    function showKeyboard() {
        var show = $local.get("optKeyboard");
        if(show) $keyboard.show(); else $keyboard.hide();
        $("#btnKeyboard").toggleClass("on", show);
    }

    function showFullMorphology() {
        var full = $local.get("optFullmorph");
        if(!full && $(".highlight").length) {
            $(".morph table tr").hide();
            $(".morph table u").hide();
            $(".highlight").each(function() {
                $(this).show();
                $(this).closest("tr").show();
                $(this).closest("table").find(".head").show();
            });
        } else {
            $(".morph table tr").show();
            $(".morph table u").show();
        }
        $("#btnFullmorph").toggleClass("on", full);
    }

    function showTab(n) {
        $(".tablabels td").removeClass("on");
        $("#l" + n).addClass("on");
        $(".tab").removeClass("on");
        $("#t" + n).addClass("on");
    }

    function highlightForm(form) {
        $("#toc p.selected").removeClass("selected");
        $("#toc p").each(function() {
            if($(this).find("u").data("form") == form) {
                $(this).addClass("selected")[0].scrollIntoView(false);
            }
        });
    }

    function updateQueryBox() {
        var q = $("#qry")[0];
        var val = q.value;
        var a = val.slice(0, q.selectionStart);
        var b = val.slice(q.selectionStart);
        var ga = g.fromBeta(a);
        var gb = g.fromBeta(b);

        val = g.cleanup(ga + b);

        q.value = val;
        q.selectionStart = q.selectionEnd = ga.length;

    }

    function show(form) {
        highlightForm(form);
        $("#content").html(page(form));
        showTab(0);

        $(".morph table u").each(function() {
            if($(this).data("form") == form)
                $(this).addClass("highlight");
        });
        showFullMorphology();


        $("body").trigger("pageLoaded", {form: form});
    }

    function externalLinks(word) {
        var links = {
            'View in Perseus':  "http://www.perseus.tufts.edu/hopper/morph?l={0}&la=greek",
            'View in Logeion':  "http://logeion.uchicago.edu/index.html#{0}",
            'Search in Google': "https://www.google.com/search?q=\"{0}\""
        };
        var u = encodeURIComponent(g.fromBeta(word.replace(/\d+/g, "")));
        var r = {};
        Object.keys(links).forEach(function(k) {
            r[k] = $f(links[k], u);
        });
        return r;
    }

    $(function() {

        $("body").on("loadPage", function(e, data) {
            show(data.form);
            $zoom.off();
        });

        $("#qry").on("keydown", function(e) {

            function highlight() {
                [].some.call(arguments, function(el) {
                    var u = el.find("u");
                    if(!u.length)
                        return false;
                    var form = u.data("form");
                    $("#qry").val(form);
                    updateQueryBox();
                    highlightForm(form);
                    return true;
                });
            }

            switch(e.keyCode) {
                case 13:
                    highlight($("#toc p.selected"), $("#toc p:first"));
                    $("body").trigger("loadPage", {form: g.toBeta($("#qry").val()) });
                    e.preventDefault();
                    break;
                case 38:
                    highlight($("#toc p.selected").prev(), $("#toc p:last"));
                    e.preventDefault();
                    break;
                case 40:
                    highlight($("#toc p.selected").next(), $("#toc p:first"));
                    e.preventDefault();
                    break;
            }
        });


        $("#qry").on("keypress", function(e) {
            $("#qry").trigger("insertChar", {char: String.fromCharCode(e.which)});
            e.preventDefault();
        });

        $("#qry").on("insertChar", function(e, data) {
            var q = $("#qry")[0], sel = q.selectionStart;
            q.focus();
            q.value = q.value.slice(0, sel) + data.char + q.value.slice(q.selectionEnd);
            q.selectionStart = q.selectionEnd = sel + 1;
            updateQueryBox();
            var form = g.toBeta($("#qry").val());
            var fs = $dict.similarForms(form, 200);
            $("#toc div").html(fs.map(function(f) {
                return "<p>" + renderGreek(f) + "</p>";
            }));
        });

        $("body").on("click", ".tab u, #toc u, #history u", function() {
            $("body").trigger("loadPage", {form: $(this).data("form")});
        });

        $("body").on("click", ".tablabels td", function() {
            var n = this.id.substr(1);
            showTab(n);
        });

        $("body").on("click", "a", function(e) {
            $window.gui.Shell.openExternal(this.href);
            e.preventDefault();
        });

        $("body").on("contextmenu", "u", function(e) {
            var gui = $window.gui;
            var menu = new gui.Menu();
            var form = $(this).data("form");

            var r = externalLinks(form);

            Object.keys(r).forEach(function(k) {
                menu.append(new gui.MenuItem({
                    label: k,
                    click: function() { gui.Shell.openExternal(r[k]) }
                }));
            });

            var x = e.x || e.pageX, y = e.y || e.pageY;
            menu.popup(x, y);
        });

        $("body").on("click", "#btnFullmorph", function() {
            $("body").trigger("toggleFullMorphology");
        });

        $("body").on("click", "#btnKeyboard",  function() {
            $("body").trigger("toggleKeyboard");
        });

        $("body").on("click", "#btnAbout",  function() {
            $("body").trigger("toggleAbout");
        });

        $("body").on("toggleKeyboard", function() {
            var show = $local.get("optKeyboard");
            $local.set("optKeyboard", !show);
            showKeyboard();
        });

        $("body").on("toggleFullMorphology", function() {
            var full = $local.get("optFullmorph");
            $local.set("optFullmorph", !full);
            showFullMorphology();
        });

        var aboutVisible = false;

        $("body").on("toggleAbout", function() {
            $("#version").html(VERSION);
            $("#about").animate({top: aboutVisible ? -500 : 0 });
            aboutVisible = !aboutVisible;
            $("#btnAbout").toggleClass("on", aboutVisible);
        });

        $("body").on("click", "#about button",  function() {
            $("body").trigger("toggleAbout");
        });


        $("body").on("keydown", function(e) {
            if(e.ctrlKey && e.keyCode == 74) // ^J
                global.window.nwDispatcher.requireNwGui().Window.get().showDevTools().moveTo(300, 300);
        });


        var baseDir = window.location.toString()
            .replace(/^.+?:\/+/, "")
            .replace(/([\\\/])[^\\\/]+$/, "");
        if(!baseDir.match(/^\w:/))
            baseDir = "/" + baseDir;

        $dict.init(baseDir + "/data");
        $history.init();
        $window.init();
        $zoom.init();
        $keyboard.init();

        showKeyboard();

        setTimeout(function() {
            $("body").show();
            $("#qry").focus();
        }, 1000);
    });

})();


