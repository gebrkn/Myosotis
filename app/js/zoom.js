$zoom = (function() {

    var timer = 0;
    
    function off() {
        $("#zoom").hide();
        clearTimeout(timer);
    }

    function init() {

        $("body").on("mouseenter", "u", function() {
            var t = $(this), oo = t.offset();

            $("#zoom").html($f("<p class='word'>{0}</p><p class='feature'>{2}</p>",
                t.text().replace(/\d+/g, ""), t.data("form"), t.data("feature")));

            clearTimeout(timer);
            timer = setTimeout(function() {
                var z = $("#zoom");
                var w = z.width(),  bw = $("body").width();
                var h = z.height(), bh = $("body").height();
                z.css({
                    left: Math.min(oo.left, bw - w - 20),
                    top:  Math.min(oo.top + 20, bh - h - 20)
                });
                z.show();

            }, 1000);

        });
        
        $("body").on("mouseleave", "u", off);
    }

    return {init:init, off:off};

})();