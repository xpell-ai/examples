//main entry file

import "../public/style.css"
import "animate.css"
import {
    Xpell as _x,
    _xlog, //Xpell logger,
    XUI, //Xpell UI module,
    XData as _xd, //Xpell real-time data cache module,
    XUIAnimate as _xa, //Xpell animation module,


} from "@xpell/ui"
import { TTTModule } from "./modules/TTTModule"
import { view } from "./view.ts"

async function main() {
    _x._verbose = true // enable verbose mode (_xlog)
    // _x.info() // show xpell engine info
    _x.start() // start xpell engine (frame loop)
    _xd.set("_gameover", false) // set initial game state
    await _x.loadModuleAsync(XUI)
    await _x.loadModuleAsync(new TTTModule())

    XUI.add(view) // add game view to the UI
    

    /*

    const turn = "X"

    const board = [
        ["?", "?", "?"],
        ["?", "?", "?"],
        ["?", "?", "?"],
    ]

    //anonymous function to create row in the game board
    const createRow = (id: string, rowNum: number) => {
        const createCell = (id: string, cellNum: number) => {
            return {
                _type: "button",
                class: "ttt-board-button",
                _id: id,
                _text: "?",
                _on: {
                    click: (xobj, event) => {
                        if (_xd.get("_gameover")) return
                        if (board[rowNum][cellNum] !== "?") return //cell already occupied
                        if (_xd.get("ttt-turn") === "X") {
                            xobj._text = "X"
                            xobj.dom.style.color = "white"
                            xobj.dom.style.backgroundColor = "black"
                            _xd.set("ttt-turn", "O")
                            board[rowNum][cellNum] = "X"
                        } else {
                            xobj._text = "O"
                            _xd.set("ttt-turn", "X")
                            board[rowNum][cellNum] = "O"
                            xobj.dom.style.color = "black"
                            xobj.dom.style.backgroundColor = "white"
                        }

                        //check for winner
                        let winner: any = undefined
                        for (let i = 0; i < 3; i++) {
                            if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0] !== "?") {
                                winner = board[i][0]
                            }
                        }
                        for (let i = 0; i < 3; i++) {
                            if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== "?") {
                                winner = board[0][i]
                            }
                        }
                        if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== "?") {
                            winner = board[0][0]
                        }
                        if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== "?") {
                            winner = board[0][2]
                        }
                        if (winner) {
                            _xlog.log("Player " + winner + " wins!");
                            _xd.set("_gameover", true)

                            const lbl = XUI.getObject("ttt-status")
                            lbl._data_source = undefined
                            lbl._text = "Player " + winner + " wins!"
                            lbl._on_frame = (xobj, frame) => {
                                xobj.dom.style.color = "hsl(" + (frame) + ", 100%, 50%)"
                            }
                        }

                        //ceck for draw
                        let draw = true
                        for (let i = 0; i < 3; i++) {
                            for (let j = 0; j < 3; j++) {
                                if (board[i][j] === "?") {
                                    draw = false
                                }
                            }
                        }
                        if (draw && !winner) {
                            _xlog.log("It's a draw!");
                            const lbl = XUI.getObject("ttt-status")
                            lbl._data_source = undefined
                            lbl._text = "It's a draw!"
                            _xd.set("_gameover", true)
                        }
                    }
                }
            }
        }


        return {
            _type: "view",
            _id: id,
            _children: [
                createCell(id + "-cell-1", 0),
                createCell(id + "-cell-2", 1),
                createCell(id + "-cell-3", 2)
            ]
        }
    }



    //create main game tik-tak-toe scene
    const home = XUI.add(
        {
            _type: "view", //same as div 
            _id: "ttt-home",
            class: "ttt-home",
            _parent_element: "root",
            _children: [
                {
                    _type: "view",
                    _data_source: "fps",
                    _on_data: (xobj, data) => {
                        xobj._text = "FPS: " + data.toFixed(2)
                    },
                    style: "position: absolute; top: 10px; right: 10px; font-size: 0.8em; color: gray;"
                },
                {
                    _type: "view",
                    _data_source: "_my_text",
                    _text: "Hello Xpell UI!",
                    // _update_data_source_on_change: true,
                    _on_data: (xobj, data) => {
                        xobj._text = data
                    }
                },
                {
                    _type:"text",
                    _id:"my-text-input",
                    _debug: true,
                    _data_output: "_my_text",
                    // _on: {input:(xobj, data)=>{
                    //     _xlog.log("Input changed:", data)
                    //     _xd.set("_my_text", data) //update data source on input change
                    // }},
                    style:"position: absolute; top: 40px; right: 10px; padding: 5px;"
                },
                //add more views here
                {
                    _type: "view",
                    _id: "ttt-title",
                    _text: "Tic-Tac-Toe Game Xpell UI",
                    style: "font-size: 2em; margin-bottom: 20px;",
                    _on_show_animation: "animate__bounce",
                    _on_mount: (xobj) => {
                        // _xlog.log(xobj);

                    }


                },
                {
                    _type: "view",
                    _id: "ttt-board",
                    _children: [
                        createRow("row-1", 0),
                        createRow("row-2", 1),
                        createRow("row-3", 2)

                    ]
                },
                {
                    _type: "label",
                    _id: "ttt-status",
                    _text: "Player ?'s turn",
                    _data_source: "ttt-turn",
                    _on_data: (xobj, data) => {
                        xobj._text = "Player " + data + "'s turn"
                    },
                    style: "font-size: 1.5em; margin-top: 20px;"
                },
                {
                    _type: "button",
                    _id: "ttt-reset",
                    _text: "New Game",
                    class: "new-game-button",
                    _data_source: "_gameover",
                    _on_data: (xobj, data) => {
                        if (data) {
                            xobj.show()
                            xobj._on_show_animation = "animate__fadeIn"
                        } else {
                            xobj.hide()
                        }
                    },
                    _on_mount: { _op: "hide" },
                    _on: {
                        click: (xobj, event) => {
                            //reset game state
                            for (let i = 0; i < 3; i++) {
                                for (let j = 0; j < 3; j++) {
                                    board[i][j] = "?"
                                }
                            }
                            _xd.set("ttt-turn", "X")
                            _xd.set("_gameover", false)


                            //reset UI
                            for (let i = 1; i <= 3; i++) {
                                for (let j = 1; j <= 3; j++) {
                                    const cell = XUI.getObject("row-" + i + "-cell-" + j)
                                    cell._text = "?"
                                    cell.dom.style.color = ""
                                    cell.dom.style.backgroundColor = ""
                                }
                            }

                            const lbl = XUI.getObject("ttt-status")
                            lbl._data_source = "ttt-turn"
                            lbl._on_data = (xobj, data) => {
                                xobj._text = "Player " + data + "'s turn"
                            }
                            lbl._text = "Player X's turn"
                        }
                    }
                }
            ]
        })


    //set _xdata for the game
    _xd.set("ttt-turn", turn)*/
}


main()



