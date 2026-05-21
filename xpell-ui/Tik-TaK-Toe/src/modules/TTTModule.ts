import {
    XModule,
    XData as _xd,
    _xlog,
    type XCommandData
} from "@xpell/core";



export class TTTModule extends XModule {

    static _name = "ttt";

    constructor() {

        super({
            _name: "ttt"
        });

        this.resetBoard();
    }



    // =====================================================
    // RESET BOARD
    // =====================================================

    protected resetBoard() {

        const board = [
            ["?", "?", "?"],
            ["?", "?", "?"],
            ["?", "?", "?"]
        ];

        _xd.set(
            "ttt:board",
            board,
            {
                source: "ttt:init"
            }
        );

        // publish cells individually
        for (let row = 0; row < 3; row++) {

            for (let col = 0; col < 3; col++) {

                _xd.set(
                    `ttt:cell:${row}:${col}`,
                    board[row][col],
                    {
                        source: "ttt:init"
                    }
                );
            }
        }

        _xd.set(
            "ttt:turn",
            "X",
            {
                source: "ttt:init"
            }
        );

        _xd.set(
            "ttt:status",
            "Player X's turn",
            {
                source: "ttt:init"
            }
        );

        _xd.set(
            "ttt:gameover",
            false,
            {
                source: "ttt:init"
            }
        );

        _xd.delete(
            "ttt:winner",
            {
                source: "ttt:init"
            }
        );
    }



    // =====================================================
    // PLAY
    // =====================================================

    async _play(xcmd: XCommandData) {

        const row =
            Number(xcmd?._params?._row);

        const col =
            Number(xcmd?._params?._col);

        // -------------------------------
        // validate
        // -------------------------------

        if (
            Number.isNaN(row) ||
            Number.isNaN(col)
        ) {

            return {
                _ok: false,
                _error: "invalid position"
            };
        }

        const gameover =
            _xd.get("ttt:gameover");

        if (gameover === true) {

            return {
                _ok: false,
                _error: "game over"
            };
        }

        const board =
            structuredClone(
                _xd.get("ttt:board")
            );

        const turn =
            _xd.get("ttt:turn");

        if (
            !board ||
            !board[row]
        ) {

            return {
                _ok: false,
                _error: "invalid board"
            };
        }

        // -------------------------------
        // occupied
        // -------------------------------

        if (board[row][col] !== "?") {

            return {
                _ok: false,
                _error: "cell occupied"
            };
        }

        // -------------------------------
        // play move
        // -------------------------------

        board[row][col] = turn;

        _xd.set(
            "ttt:board",
            board,
            {
                source: "ttt:play"
            }
        );

        _xd.set(
            `ttt:cell:${row}:${col}`,
            turn,
            {
                source: "ttt:play"
            }
        );

        // -------------------------------
        // check winner
        // -------------------------------

        const winner =
            this.checkWinner(board);

        if (winner) {

            _xd.set(
                "ttt:winner",
                winner,
                {
                    source: "ttt:winner"
                }
            );

            _xd.set(
                "ttt:status",
                `Player ${winner} wins!`,
                {
                    source: "ttt:winner"
                }
            );

            _xd.set(
                "ttt:gameover",
                true,
                {
                    source: "ttt:winner"
                }
            );

            _xlog.log(
                `[TTT] Winner: ${winner}`
            );

            return {
                _ok: true,
                _winner: winner
            };
        }

        // -------------------------------
        // draw
        // -------------------------------

        const draw =
            this.checkDraw(board);

        if (draw) {

            _xd.set(
                "ttt:status",
                "It's a draw!",
                {
                    source: "ttt:draw"
                }
            );

            _xd.set(
                "ttt:gameover",
                true,
                {
                    source: "ttt:draw"
                }
            );

            _xlog.log(
                "[TTT] Draw"
            );

            return {
                _ok: true,
                _draw: true
            };
        }

        // -------------------------------
        // next turn
        // -------------------------------

        const next_turn =
            turn === "X"
                ? "O"
                : "X";

        _xd.set(
            "ttt:turn",
            next_turn,
            {
                source: "ttt:turn"
            }
        );

        _xd.set(
            "ttt:status",
            `Player ${next_turn}'s turn`,
            {
                source: "ttt:turn"
            }
        );

        return {
            _ok: true
        };
    }



    // =====================================================
    // RESET
    // =====================================================

    async _reset() {

        this.resetBoard();

        return {
            _ok: true
        };
    }



    // =====================================================
    // CHECK WINNER
    // =====================================================

    protected checkWinner(
        board: string[][]
    ): string | undefined {

        // rows
        for (let i = 0; i < 3; i++) {

            if (
                board[i][0] !== "?" &&
                board[i][0] === board[i][1] &&
                board[i][1] === board[i][2]
            ) {

                return board[i][0];
            }
        }

        // cols
        for (let i = 0; i < 3; i++) {

            if (
                board[0][i] !== "?" &&
                board[0][i] === board[1][i] &&
                board[1][i] === board[2][i]
            ) {

                return board[0][i];
            }
        }

        // diagonal
        if (
            board[0][0] !== "?" &&
            board[0][0] === board[1][1] &&
            board[1][1] === board[2][2]
        ) {

            return board[0][0];
        }

        // reverse diagonal
        if (
            board[0][2] !== "?" &&
            board[0][2] === board[1][1] &&
            board[1][1] === board[2][0]
        ) {

            return board[0][2];
        }

        return undefined;
    }



    // =====================================================
    // CHECK DRAW
    // =====================================================

    protected checkDraw(
        board: string[][]
    ): boolean {

        for (let row = 0; row < 3; row++) {

            for (let col = 0; col < 3; col++) {

                if (board[row][col] === "?") {
                    return false;
                }
            }
        }

        return true;
    }
}