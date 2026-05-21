import { _x, XUIObject, XUIObjectData, _xem, _xd, _xlog } from "@xpell/ui";

export class TicTacToeBoard extends XUIObject {

    static _xtype = "ttt-board";

    private _board: string[][];

    constructor(data: XUIObjectData) {
        super(data, {
            _type: TicTacToeBoard._xtype,
            _id: "ttt-board"
        }, true);
        this._board = [
            ["?", "?", "?"],
            ["?", "?", "?"],
            ["?", "?", "?"]
        ];

        this.parse(data);
        this.buildBoard();

        this.addEventListener("ttt:reset", () => {
            this.resetBoard();
        });

        if (this._debug) {
            _xlog.log("TicTacToeBoard initialized", this);
        }
    }

    buildBoard() {
        _xd.set("ttt:turn", "X") // set initial turn
        _xd.set("ttt:status", "Turn: X") // set initial status
        _xd.set("ttt:gameover", false) // set initial game state
        const boardContainer = {
            _type: "view",
            class: "ttt-board-container",
            _children: [
                {
                    "_type": "label",
                    "class": "ttt-status-label",
                    "_id": "ttt-status",

                    "_data_source": "ttt:status",

                    "_on_data": [
                        {
                            "_op": "set-field",
                            "_params": {
                                "name": "_text",
                                "value": "$data"
                            }
                        }
                    ],
                    "_on_frame": (xobj, frame) => {
                        xobj.dom.style.color = "hsl(" + (frame) + ", 100%, 50%)"
                    }
                },
                this.createRow(0),
                this.createRow(1),
                this.createRow(2)
            ]
        };
        this.append(boardContainer);
    }

    createRow(row: number) {
        return {
            _type: "view",
            class: "ttt-board-row",
            _children: [
                this.createCell(row, 0),
                this.createCell(row, 1),
                this.createCell(row, 2)
            ]

        }
    }

    createCell(row: number, col: number) {
        return {
            _type: "button",
            class: "ttt-board-button",
            _id: `cell-${row}-${col}`,
            _text: this._board[row][col],
            _on: {
                click: (xobj, event) => {
                    this.playTurn(row, col, xobj);
                },
                "xem:ttt:reset": (xobj, event) => {
                    xobj._text = "?"
                    xobj.dom.style.backgroundColor = "var(--x-bg)"
                    xobj.dom.style.color = "var(--x-text)"
                }
            }
        }
    }

    playTurn(row: number, col: number, xobj: any) {
        if (_xd.get("ttt:gameover") || this._board[row][col] !== "?") return
        const turn = _xd.get("ttt:turn")
        this._board[row][col] = turn
        xobj._text = turn
        xobj.dom.style.color = turn === "X" ? "var(--x-text)" : "var(--x-text-2)"
        xobj.dom.style.backgroundColor = turn === "X" ? "var(--x-surface)" : "var(--x-surface-2)"
        _xd.set("ttt:turn", turn === "X" ? "O" : "X")
        _xd.set("ttt:status", `Turn: ${_xd.get("ttt:turn")}`)
        _xem.fire("ttt:cell:played", {
            row,
            col,
            turn
        });

        //check for winner
        let winner: any = undefined
        for (let i = 0; i < 3; i++) {
            if (this._board[i][0] === this._board[i][1] && this._board[i][1] === this._board[i][2] && this._board[i][0] !== "?") {
                winner = this._board[i][0]
            }
        }
        for (let i = 0; i < 3; i++) {
            if (this._board[0][i] === this._board[1][i] && this._board[1][i] === this._board[2][i] && this._board[0][i] !== "?") {
                winner = this._board[0][i]
            }
        }
        if (this._board[0][0] === this._board[1][1] && this._board[1][1] === this._board[2][2] && this._board[0][0] !== "?") {
            winner = this._board[0][0]
        }
        // check diagonals
        if (this._board[0][2] === this._board[1][1] && this._board[1][1] === this._board[2][0] && this._board[0][2] !== "?") {
            winner = this._board[0][2]
        }
        if (this._board[0][0] === this._board[1][1] && this._board[1][1] === this._board[2][2] && this._board[0][0] !== "?") {
            winner = this._board[0][0]
        }
        if (winner) {
            _xd.set("ttt:gameover", true)
            _xd.set("ttt:status", `Player ${winner} wins!`)
            _xem.fire("ttt:gameover", {
                winner
            });
        } else {
            //check for draw
            let draw = true
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (this._board[i][j] === "?") {
                        draw = false
                    }
                }
            }
            if (draw) {
                _xd.set("ttt:gameover", true)
                _xd.set("ttt:status", "Game over! It's a draw!")
                _xem.fire("ttt:gameover", {
                    winner: "draw"
                });
            }
        }
    }

    resetBoard() {
        this._board = [
            ["?", "?", "?"],
            ["?", "?", "?"],
            ["?", "?", "?"]
        ];
        _xd.set("ttt:turn", "X") // reset turn
        _xd.set("ttt:status", "Turn: X") // reset status
        _xd.set("ttt:gameover", false) // reset game state
    }
}