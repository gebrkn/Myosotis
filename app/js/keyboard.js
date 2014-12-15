$keyboard = (function() {

    return {

        show: function() {
            $("#keyboard").show().animate({bottom: 0});
        },

        hide: function() {
            $("#keyboard").animate({bottom: -200});
        },

        init: function() {
            var keys = [
                "a/,a\\,a=,a),a(,a|",
                "q,w,e,r,t,y,u,i,o,p",
                "a,s,d,f,g,h,j,k,l",
                "z,x,c,v,b,n,m"
            ];
            var html = keys.map(function(x) {
                x = x.split(",").map(function(y) {
                    return $f("<button><sup>{0}</sup>{1}</button>",
                        y[y.length - 1], renderGreek(y));
                });
                return $f("<p>{0}</p>", x.join(""));
            }).join("");

            $("#keyboard").html($f("<span>&times;</span>{0}", html));

            $("#keyboard").on("click", "button", function() {
                $("#qry").trigger("insertChar", {char:$(this).find("sup").text()});
            });

            $("#keyboard").on("click", "span", function() {
                $("body").trigger("toggleKeyboard");
            });
        }
    }



})();