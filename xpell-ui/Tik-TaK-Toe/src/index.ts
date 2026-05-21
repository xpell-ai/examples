//main entry file

import "../public/style.css"
import "animate.css"
import {
    Xpell as _x,
    _xem, //Xpell event manager,
    _xlog, //Xpell logger,
    XUI, //Xpell UI module,
    XData as _xd, //Xpell real-time data cache module,
    XUIAnimate as _xa, //Xpell animation module,


} from "@xpell/ui"
import view from "./view.json"
import { TicTacToeBoard } from "./objects/TicTacToeBoard.ts"

async function main() {
    _x._verbose = true // enable verbose mode (_xlog)
    _x.start() // start xpell engine (frame loop)
    _xd.set("_gameover", false) // set initial game state
    await _x.loadModuleAsync(XUI)

    XUI.importObject(TicTacToeBoard._xtype, TicTacToeBoard) // import game board view as XUI object
    XUI.createPlayer("xplayer") // create XUI player container
    XUI.add(view) // add game view to XUI

    _xem.on("ttt:toggle-theme", () => {
        const button = XUI.getObject("ttt-toggle-theme");
        button._mode = button._mode === "light" ? "dark" : "light";
        button._text = button._mode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";
        // Toggle the data-theme attribute on the root element to switch themes
        const root = document.documentElement;
        root.setAttribute("data-theme", button._mode as string);
        // Handle theme toggle logic
    });
}

main()



