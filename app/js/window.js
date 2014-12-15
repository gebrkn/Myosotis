$window = (function() {

    var gui = global.window.nwDispatcher.requireNwGui();
    var win = gui.Window.get();

    function adjust(min, a, max) {
        a = a || 0;
        if(a > max) a = max;
        if(a < min) a = min;
        return a;
    }

    var winTimer = 0;

    function winSaveState() {
        clearTimeout(winTimer);
        winTimer = setTimeout(function() {
            $local.set("winState", {
                x: win.x, y: win.y, w: win.width, h: win.height
            });
        }, 500);
    }

    function init() {

        try {
            var nativeMenuBar = new gui.Menu({ type: "menubar" });
            nativeMenuBar.createMacBuiltin("Myosotis");
            win.menu = nativeMenuBar;
        } catch (e) {}


        var winState = $local.get("winState");

        if(winState) {
            winState.x = adjust(screen.availLeft, winState.x, screen.availLeft + screen.availWidth);
            winState.y = adjust(screen.availTop,  winState.y, screen.availTop  + screen.availHeight);

            win.moveTo(winState.x, winState.y);
            win.resizeTo(winState.w || 800, winState.h || 600);
        }

        win.on("move", winSaveState);
        win.on("resize", winSaveState);

        win.show();

    }


    return {
        init: init,
        win:  win,
        gui:  gui
    }

})();