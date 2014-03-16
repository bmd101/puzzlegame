window.onload = (function() {
    var WIDTH = 800,
        HEIGHT = 640,
        BOX_WIDTH = 32,
        BOX_HEIGHT = 32,
        BOARD_TOP = 100,
        BOARD_LEFT = 160,
        BOARD_ROWS = 5,
        BOARD_COLS = 6,
        TWEEN_FRAMES = 15,
        FONT = "SyntaxError",
        // Rumble Hero Variables
        COMBO_MULTIPLIER = 1.05,
        COMBO_BONUS = 1.05,
        TIME = 3000;

    var score = 0;

    Crafty.init(WIDTH, HEIGHT, 30);

    /*
     * Loads the Sprite PNG and create the only sprite 'crate' from it
     */
    Crafty.sprite(32, "assets/crate.png", { crate: [0, 0]});


    /**
     * The 'Box' component.
     * The component defines how to draw itself: 2D, Canvas, Color, use the sprite 'create'.
     * It also binds the mouse click (using the 'Mouse' component) and calls the onClickCallback function when clicked
     */
    Crafty.c("Box", {
        /**
         * Initialisation. Adds components, sets positions, binds mouse click handler
         */
        init: function() {
            this.addComponent("2D, Canvas, Color, Mouse, Tween, crate");

            this.w = BOX_WIDTH;
            this.h = BOX_HEIGHT;

            this.bind("MouseUp", function(obj) {
                if (this._onMouseUp) this._onMouseUp({
                    x: obj.realX,
                    y: obj.realY,
                    color: this._color
                });
            });
            this.bind("MouseDown", function(obj) {
                if (this._onMouseDown) this._onMouseDown({
                    x: obj.realX,
                    y: obj.realY,
                    color: this._color
                });
            });
            this.bind("MouseOver", function(obj) {
                if (this._onMouseOver) this._onMouseOver({
                    x: obj.realX,
                    y: obj.realY,
                    color: this._color
                });
            });
        },
        /**
         * Convenience method for creating new boxes
         * @param x position on the x axis
         * @param y position on the y axis
         * @param color background color
         * @param onClickCallback a callback function that is called for mouse click events
         */
        makeBox: function(x, y, color, onMouseDown, onMouseUp, onMouseOver) {
            this.attr({x: x, y: y}).color(color);
            this._onMouseDown = onMouseDown;
            this._onMouseUp = onMouseUp;
            this._onMouseOver = onMouseOver;
            return this;
        }
    });

    /**
     * The Game 'Board' Component that includes the game logic.
     */
    Crafty.c("Board", {
        /* The list of colors used for the game */
        COLORS: ["#F00", "#0F0", "#FF0", "#F0F"],
        /**
         * Initialisation. Adds components, sets positions, creates the board
         */
        init: function() {
            this.addComponent("2D, Canvas, Color");
            this.x = BOARD_LEFT;
            this.y = BOARD_TOP;
            this.w = BOX_WIDTH * BOARD_COLS;
            this.h = BOX_HEIGHT * BOARD_ROWS;
            this.color("#000");
            this._setupBoard(BOARD_LEFT, BOARD_TOP, BOARD_ROWS, BOARD_COLS, BOX_WIDTH, BOX_HEIGHT);

            score = 0;
        },
        /**
         * Set up the board.
         * The board is an Array of columns, which again is an Array of Boxes.
         */
        _setupBoard: function(x, y, rows, cols, bw, bh) {
            this._board = _.range(cols).map(function(c) {
                return _.range(rows).map(function(r) {
                    var pos = this._computeBoxPos(x, y, c, r, BOX_WIDTH, BOX_HEIGHT);
                    var color = this.COLORS[Crafty.math.randomInt(0, this.COLORS.length - 1)];
                    return Crafty.e("Box").makeBox(pos.x, pos.y, color, _.bind(this._mouseDown, this), _.bind(this._mouseUp, this), _.bind(this._mouseOver, this));
                }, this);
            }, this);
        },
        /**
         * Computes the coordinates for a box.<F5>
         * @param x the left side of the board
         * @param y the top of the board
         * @param col the column of the box
         * @param row the row of the box
         * @param bw box width
         * @param bh box height
         */
        _computeBoxPos: function(x, y, col, row, bw, bh) {
            return {
                x: x + col * bw,
                y: y + (bh * BOARD_ROWS - (row + 1) * bh)
            };
        },
        // TODO: Mousedown handler
        _mouseDown: function(obj) {
            var frame = Crafty.frame();
            var $this = this;
            var board = this._board;
            console.log(board);

            window._miniLoop = setInterval(function() {            
                if (!$this._blockUntil || $this._blockUntil < frame) {
                    var aPos = $this._translateToArrayPos(obj.x, obj.y);
                    console.log(aPos);
                    console.log(window._mouseOverBox);
                    // console.log(board[aPos.x][aPos.y]);
                    // console.log($this);

                    // Constantly update the selected box to be above current mouse.
                    // board[window._mouseOverBox.x][window._mouseOverBox.y] = $this;
                    // board[aPos.x][aPos.y] = board[window._mouseOverBox.x][window._mouseOverBox.y];
                    // $this = board[window._mouseOverBox.x][window._mouseOverBox.y];

                }
            }, 50);
            
            console.log(board);

            setTimeout(function(){
                if(window._miniLoop) {
                    clearInterval(window._miniLoop);
                }
            }, 3000);
        },
        _mouseOver: function(obj) {
            var frame = Crafty.frame();
            if (!this._blockUntil || this._blockUntil < frame) {
                var aPos = this._translateToArrayPos(obj.x, obj.y);
                window._mouseOverBox = aPos;
            }
        },
        // TODO: Mouseup handler
        _mouseUp: function(obj) {
            if(window._miniLoop) {
                clearInterval(window._miniLoop);
            }
            this._flagConnectedBoxes();
            this._purgeColumns();
            this._moveBoxesToNewPositions();
        },
        /**
         * Convert mouse coordinates into board position.
         * Box (0,0) is in the left bottom corner, while coordinate (0,0) is in the left top!!
         */
        _translateToArrayPos: function(x, y) {
            return {
                x: Math.floor((x - BOARD_LEFT) / BOX_WIDTH),
                y: (BOARD_ROWS - 1) - Math.floor((y - BOARD_TOP) / BOX_HEIGHT)
            };
        },
        /**
         * Iterate through all boxes and set new coordinates
         */
        _moveBoxesToNewPositions: function() {
            _(this._board).each(function(column, c) {
                _(column).each(function(box, r) {
                    var pos = this._computeBoxPos(BOARD_LEFT, BOARD_TOP, c, r, BOX_WIDTH, BOX_HEIGHT);
                    this._blockUntil = Crafty.frame() + TWEEN_FRAMES;
                    box.tween({x: pos.x, y: pos.y}, TWEEN_FRAMES);
                }, this);
            }, this);
        },
        /**
         * Remove flagged boxes from the columns and empty columns from the board
         */
        _purgeColumns: function() {
            var filter = function(el) { return !el._flagged; };

            var count =_(this._board).chain().flatten().reject(filter).value().length;
            score += (count === 1) ? -1000 : (count * count * 10);
            
            _(this._board).each(function(column, c) {
                _(column).chain().reject(filter, this).each(function (el) {
                    el.destroy()
                }, this);
            }, this);

            this._board = _(this._board).chain().map(function(column, c) {
                return _(column).select(filter);
            }, this).reject(function(column) {
                return false;
            }, this).value();

        },
        /**
         * Flags the passed Box and all connected Boxes of the same color by adding a new property '_flagged = true'.
         * @param aPos Array position of clicked Box
         * @param color color of clicked Box
         */
        _flagConnectedBoxes: function() {
            var board = this._board;
            var matches = false;
            function sameColor(a, b) {
                if(a && b && a._color === b._color) {
                    return true;
                }
                else {
                    return false;
                }
            }
            for (var i = 0; i < BOARD_ROWS; i++) {
                for (var j = 0; j < BOARD_COLS; j++) {
                    if(board[i-1] && board[i+1] && sameColor(board[i][j], board[i-1][j]) && sameColor(board[i][j], board[i+1][j])) {
                        board[i][j]._flagged = true;
                        board[i-1][j]._flagged = true;
                        board[i+1][j]._flagged = true;
                        matches = true;
                    }
                    if(board[i][j-1] && board[i][j+1] && sameColor(board[i][j], board[i][j-1]) && sameColor(board[i][j], board[i][j+1])) {
                        board[i][j]._flagged = true;
                        board[i][j-1]._flagged = true;
                        board[i][j+1]._flagged = true;
                        matches = true;
                    }
                };
            };
            return matches;
        },
        /*
         * Rumble Hero Functions
        */
        // TODO: After boxes have fallen, replace empty space with new boxes
        _createNewBoxes: function() {
        }
    });

    /*
     * Game Scene
     */
    Crafty.scene("Game", function() {
        Crafty.e("Board");
    });

    // Load assets, then start Game
    Crafty.scene("Loading", function() {
        Crafty.load(["assets/crate.png", "assets/OSDM_Fnt32x32_SyntaxTerror-Copy2.png"], function() {
            Crafty.scene("Game");
        });
    });
    
    // start with the Loading scene
    Crafty.scene("Loading");
    
});
