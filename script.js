'use strict';

var ROWS = 25;
var COLS = 20;
var TILE_SIZE = 20 + (-4);
var BOMBS_COUNT = 103;
var TILES_COUNT = 500;
var REVEALED_COUNT;
// SVG icons
var FLAG, BOMB;
// Array of tiles' configs
var configs;

var TILE_CLASS = 'tile';
var BOMB_CLASS = 'bomb';
var MARK_CLASS = 'marked';

document.addEventListener("DOMContentLoaded", start);

function start(event) {
	var FIELD = document.querySelector("#field");
	var BTN = document.querySelector('#re');
	var tiles = [];

	FLAG = document.querySelector("#flag");
	BOMB = document.querySelector("#bomb");
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
			default:
				break;
		}
		obj.style.display = 'inline';
		return obj;
	}

	var playing = true;

	BTN.addEventListener('click', function () {
		FIELD.innerHTML = '';
		playing = true;

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
			if (Math.round(Math.random() * 99) < 20) {
				if (configs[i % TILES_COUNT] == undefined || configs[i % TILES_COUNT].isBomb == false) {
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
		//
		// __ __ __
		//|0_|1_|2_|
		//|3_|ij|4_|
		//|5_|6_|7_|
		//
		function dig_calc (i, j) {
			return (configs[i * COLS + j].isBomb) ? 1 : 0;
		}
		for (var i = 0; i < TILES_COUNT; i++) {
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
		for (var i = 0; i < TILES_COUNT; i++){
			tiles[i] = new Tile(configs[i]);
			tiles[i].append();
		}
	});

	BTN.click();

	// when clicking on an empty (digit == 0) tile
	function reveal(i) {
		var row = Math.floor(i / COLS);
		var col = i % COLS;
		var tmp_row;
		var tmp_col;
		var tmp_i;
		// 0
		tmp_row = row - 1;
		tmp_col = col - 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != -1 && tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 1
		tmp_row = row - 1;
		tmp_col = col;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != -1 && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 2
		tmp_row = row - 1;
		tmp_col = col + 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != -1 && tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 3
		tmp_row = row;
		tmp_col = col - 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 4
		tmp_row = row;
		tmp_col = col + 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 5
		tmp_row = row + 1;
		tmp_col = col - 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != ROWS && tmp_col != -1 && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 6
		tmp_row = row + 1;
		tmp_col = col;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != ROWS && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
		// 7
		tmp_row = row + 1;
		tmp_col = col + 1;
		tmp_i = tmp_row * COLS + tmp_col;
		if (tmp_row != ROWS && tmp_col != COLS && tiles[tmp_i].freeToReveal()) {
			tiles[tmp_i].click();
		}
	}

	// Shows all the bombs on loose
	function showBombs() {
		tiles.forEach(function(tile, index) {
			//if (tile.isMarked)
			//if (!tile.isBomb) {
			//	return;
			//}
			//tile.classList.add('open');
			console.log(tile);
		});
	}

	// Tile class
	function Tile(config) {
		var tile = document.createElement("div");
		tile.setAttribute("class", TILE_CLASS);

		var I = config.i;
		var isBomb = config.isBomb;
		var isOpen = config.isOpen;
		var isMarked = config.isMarked;
		var digit = config.digit;

		function open() {
			tile.classList.add('open');
		}

		tile.addEventListener("click", function (event) {
			if (!isOpen && !isMarked && playing) {
				if (isBomb) {
					tile.classList.add('boom');
					showBombs();
					playing = false;
					alert('BOOOM! Game over :(\nPress RESTART to play again.');
				} else {
					open();
					isOpen = true;
					tile.classList.add('d' + digit);
					tile.innerHTML = digit ? digit : '';
					if (!digit) {
						reveal(I);
					}
					REVEALED_COUNT++;
					if (TILES_COUNT - BOMBS_COUNT === REVEALED_COUNT) {
						playing = false;
						alert('You win!\nPress RESTART to play again.');
					}
				}
			} 
		});

		tile.addEventListener("contextmenu", function (event) {
			event.preventDefault();
			if (!isOpen && playing) {
				if (isMarked) {
					isMarked = false;
					tile.removeChild(tile.lastElementChild);
				} else {
					isMarked = true;
					tile.appendChild(getSVG('flag'));
				}
			}
		});

		if (isBomb) {
			tile.classList.add(BOMB_CLASS);
		}

		function append () {
			FIELD.appendChild(tile);
		}

		function click () {
			tile.click();
		}

		function freeToReveal () {
			return !(isOpen||isBomb||isMarked);
		}

		return {
			isBomb: isBomb,
			isOpen: isOpen,
			isMarked: isMarked,
			digit: digit,
			append: append, 
			click: click,
			freeToReveal: freeToReveal,
			addClassOpen: open
		};
	}
}
