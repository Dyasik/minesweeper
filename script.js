'use strict';

var xmlns = "http://www.w3.org/2000/svg";
var ROWS = 25;
var COLS = 20;
var TILE_SIZE = 20 + (-4);
var BOMBS_COUNT = 103;
var TILES_COUNT = 500;
var REVEALED_COUNT;
var configs; // Array of tiles' configs

var TILE_CLASS = 'tile';

// Messages for the user
var MSG = {
    LOSE: 'BOOOM! Game over :(\nPress on that sad face to play again.',
    WIN: 'You win!\nPress on that smiley face to play again.',
    RESTART: 'Do you really want to restart?'
};


document.addEventListener("DOMContentLoaded", start);

function start(event) {
    var FIELD = document.querySelector("#field");
    var BTN = document.querySelector('#re');
    var BOMBS_DIV = document.querySelector('#bombs');
    var TIME_DIV = document.querySelector('#time');

    var SMILE = document.querySelector('#smile');
    var DEAD = document.querySelector('#dead');
    var BOSS = document.querySelector('#boss');
    var FLAG = document.querySelector("#flag");
    var BOMB = document.querySelector("#bomb");

    var tiles = [];

    var BOMBS_COUNTER = new Counter(0, BOMBS_DIV);
    var TIME_COUNTER = new Counter(0, TIME_DIV);
    var TIME_COUNTER_ID; // for setTimeout
    var everClicked = false; // False from the start, true on first click

    // returns the SVG node with requested icon
    function getSVG(name) {
        var obj;
        switch (name) {
            case 'flag':
                obj = FLAG.cloneNode(true);
                break;
            case 'bomb':
                obj = BOMB.cloneNode(true);
                break;
            case 'nobomb':
            obj = BOMB.cloneNode(true);
                var tmp = document.createElementNS(xmlns, "path");
                tmp.setAttributeNS(null, "d", "M 3 3 L 13 13 \
                                               M 3 13 L 13 3");
                tmp.setAttributeNS(null, "stroke", "red");
                tmp.setAttributeNS(null, "stroke-width", "2");
                obj.appendChild(tmp);
                break;
            case 'smile':
                obj = SMILE.cloneNode(true);
                break;
            case 'dead':
                obj = DEAD.cloneNode(true);
                break;
            case 'boss':
                obj = BOSS.cloneNode(true);
                break;
            default:
                return;
        }
        obj.style.display = 'inline';
        return obj;
    }

    var playing = false;

    BTN.addEventListener('click', function () {
        if (playing && everClicked && !confirm(MSG.RESTART)) {
            return;
        }

        FIELD.innerHTML = '';
        playing = true;
        BOMBS_COUNTER.setValue(BOMBS_COUNT);
        TIME_COUNTER.setValue(999);
        everClicked = false;

        BTN.lastChild && BTN.removeChild(BTN.lastChild);
        BTN.appendChild(getSVG('smile'));

        configs = [];
        REVEALED_COUNT = 0;

        // filling in the bombs
        var bomb_count = 0;
        var i = 0;
        while (true) {
            if (bomb_count == BOMBS_COUNT) {
                while (i < TILES_COUNT) {
                    configs[i % TILES_COUNT] = {
                        isBomb: false,
                        isOpen: false,
                        isMarked: false, 
                        i: i % TILES_COUNT
                    };
                    i++;
                } 
                break;
            }
            if (Math.random() + 0.01 < BOMBS_COUNT / TILES_COUNT) {
                if (!configs[i % TILES_COUNT] || !configs[i % TILES_COUNT].isBomb) {
                    configs[i % TILES_COUNT] = {
                        isBomb: true,
                        isOpen: false,
                        isMarked: false,
                        i: i % TILES_COUNT
                    };
                    bomb_count++;
                }
            } else {
                if (configs[i % TILES_COUNT] == undefined) {
                    configs[i % TILES_COUNT] = {
                        isBomb: false,
                        isOpen: false,
                        isMarked: false, 
                        i: i % TILES_COUNT
                    };
                }
            }
            i++;
        }

        // calculating the digits
        // __ __ __
        //|0_|1_|2_|
        //|3_|ij|4_|
        //|5_|6_|7_|
        //
        function dig_calc (i, j) {
            return (configs[i * COLS + j].isBomb) ? 1 : 0;
        }
        for (i = 0; i < TILES_COUNT; i++) {
            if (!configs[i].isBomb) {
                var result = 0;
                var row = Math.floor(i / COLS);
                var col = i % COLS;
                var tmp_row;
                var tmp_col;
                var tmp_i;
                // 0
                tmp_row = row - 1;
                tmp_col = col - 1;
                if ((tmp_row != -1)&&(tmp_col != -1)) result += dig_calc(tmp_row, tmp_col);
                // 1
                tmp_row = row - 1;
                tmp_col = col;
                if (tmp_row != -1) result += dig_calc(tmp_row, tmp_col);
                // 2
                tmp_row = row - 1;
                tmp_col = col + 1;
                if ((tmp_row != -1)&&(tmp_col != COLS)) result += dig_calc(tmp_row, tmp_col);
                // 3
                tmp_row = row;
                tmp_col = col - 1;
                if (tmp_col != -1) result += dig_calc(tmp_row, tmp_col);
                // 4
                tmp_row = row;
                tmp_col = col + 1;
                if (tmp_col != COLS) result += dig_calc(tmp_row, tmp_col);
                // 5
                tmp_row = row + 1;
                tmp_col = col - 1;
                if ((tmp_row != ROWS)&&(tmp_col != -1)) result += dig_calc(tmp_row, tmp_col);
                // 6
                tmp_row = row + 1;
                tmp_col = col;
                if (tmp_row != ROWS) result += dig_calc(tmp_row, tmp_col);
                // 7
                tmp_row = row + 1;
                tmp_col = col + 1;
                if ((tmp_row != ROWS)&&(tmp_col != COLS)) result += dig_calc(tmp_row, tmp_col);

                configs[i].digit = result;
            }
        }

        tiles = [];
        for (i = 0; i < TILES_COUNT; i++){
            tiles[i] = /*new*/ Tile(configs[i]);
            tiles[i].append();
        }
    });

    BTN.click();

    // Pushes an element into the array if it is not already there.
    function pushIfNotIn(el, arr) {
        if (!~arr.indexOf(el)) {
            arr.push(el);
        }
    }
    // when clicking on an empty (digit == 0) tile
    function reveal(i) {
        var to_reveal = [i];
        while (to_reveal.length) {
            var new_to_reveal = [];
            to_reveal.forEach( function (i) {
                if (!tiles[i].isOpen) {
                    REVEALED_COUNT++;
                }
                tiles[i].open();
                checkForWin();
                if (tiles[i].digit) {
                    return;
                }
                var row = Math.floor(i / COLS);
                var col = i % COLS;
                var tmp_row, tmp_col, tmp_i;
                // 0
                tmp_row = row - 1;
                tmp_col = col - 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != -1 && tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 1
                tmp_row = row - 1;
                tmp_col = col;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != -1 && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 2
                tmp_row = row - 1;
                tmp_col = col + 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != -1 && tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 3
                tmp_row = row;
                tmp_col = col - 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 4
                tmp_row = row;
                tmp_col = col + 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 5
                tmp_row = row + 1;
                tmp_col = col - 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != ROWS && tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 6
                tmp_row = row + 1;
                tmp_col = col;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != ROWS && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
                // 7
                tmp_row = row + 1;
                tmp_col = col + 1;
                tmp_i = tmp_row * COLS + tmp_col;
                if (tmp_row != ROWS && tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
                    pushIfNotIn(tmp_i, new_to_reveal);
                }
            });
            to_reveal = new_to_reveal;
        }
    }

    function checkForWin() {
        if (TILES_COUNT - BOMBS_COUNT === REVEALED_COUNT) {
            playing = false;
            clearTimeout(TIME_COUNTER_ID);
            BOMBS_COUNTER.setValue(0);
            tiles.forEach( function(e) {
                e.onWin();
            });
            BTN.removeChild(BTN.lastChild);
            BTN.appendChild(getSVG('boss'));
            alert(MSG.WIN);
        }
    }

    // Tile class
    function Tile(config) {
        // instance to be returned
        var $ = {
            isBomb: config.isBomb,
            isOpen: config.isOpen,
            isMarked: config.isMarked,
            digit: config.digit
        };

        var tile = document.createElement("div");
        tile.setAttribute("class", TILE_CLASS);

        var I = config.i;

        tile.addEventListener("click", function (event) {
            if (!$.isOpen && !$.isMarked && playing) {
                if (!everClicked) {
                    TIME_COUNTER.setValue(0);
                    TIME_COUNTER_ID = setTimeout(function anon() {
                        TIME_COUNTER.delta(1);
                        TIME_COUNTER_ID = setTimeout(anon, 1000);
                    }, 1000);
                    everClicked = true;
                }
                if ($.isBomb) {
                    tile.classList.add('boom');
                    tiles.forEach( function(e) {
                        e.onLose();
                    });
                    tile.appendChild(getSVG('bomb'));
                    playing = false;
                    clearTimeout(TIME_COUNTER_ID);
                    BTN.removeChild(BTN.lastChild);
                    BTN.appendChild(getSVG('dead'));
                    alert(MSG.LOSE);
                } else {
                    $.open();
                    if (!$.digit) {
                        reveal(I);
                    }
                    REVEALED_COUNT++;
                    checkForWin();
                }
            } 
        });

        tile.addEventListener("contextmenu", function (event) {
            event.preventDefault();
            if (!$.isOpen && playing) {
                if ($.isMarked) {
                    $.isMarked = false;
                    BOMBS_COUNTER.delta(1);
                    tile.removeChild(tile.lastElementChild);
                } else {
                    if (!BOMBS_COUNTER.val) {
                        // don't let mark tiles if all of the bombs are marked
                        return;
                    }
                    $.isMarked = true;
                    BOMBS_COUNTER.delta(-1);
                    tile.appendChild(getSVG('flag'));
                }
            }
        });

        $.onLose = function () {
            if ($.isMarked && !$.isBomb) {
                tile.classList.add('open');
                tile.removeChild(tile.lastElementChild);
                tile.appendChild(getSVG('nobomb'));
                return;
            }
            if ($.isBomb && !$.isMarked) {
                tile.classList.add('open');
                tile.appendChild(getSVG('bomb'));
            }
        };

        $.onWin = function () {
            if ($.isBomb && !$.isMarked) {
                tile.classList.add('open');
                tile.appendChild(getSVG('bomb'));
            }
        };

        $.append = function () {
            FIELD.appendChild(tile);
        };

        $.click = function () {
            tile.click();
        };

        $.open = function () {
            tile.classList.add('open');
            $.isOpen = true;
            tile.classList.add('d' + $.digit);
            tile.innerHTML = $.digit ? $.digit : '';
        };

        $.freeToReveal = function () {
            return !($.isOpen || $.isBomb || $.isMarked);
        };

        return $;
    }

    // Counter class
    function Counter(val, container) {
        // instance to be returned
        var $ = {
            val: +val
        };

        container.innerHTML = val;

        // Changes value on d
        $.delta = function(d) {
            $.val += d;
            container.innerHTML = $.val;
        };

        $.setValue = function(v) {
            $.val = v;
            container.innerHTML = $.val;
        };

        return $;
    }
}
