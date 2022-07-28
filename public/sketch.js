const BLOCKS = ['░', '▒', '▓'];
const CELLS = [];

function formatText(text) {
	return text.join('')
		.replace(/[\n\s\t]+/g, '·')
		.toUpperCase();
}

function paintCells(pat, col, reverse = false) {
	let tx = PARAMS.text;
	let oj = 0;
	do {
		const m = tx.match(pat);
		const j = m && m.index;

		if (!m || j < 0) {
			break;
		}

		oj += j;
		if (oj >= CELLS.length) {
			break;
		}

		for (let dj = 0; dj < m[0].length; dj++) {
			if (!CELLS[oj + dj]) {
				break;
			}
			CELLS[oj + dj].color = col;
			CELLS[oj + dj].reverse = reverse;
		};

		tx = tx.substring(j + m[0].length, tx.length);
		oj += m[0].length;
	} while (true);
}

function setUpCells(theme) {
	CELLS.splice(0);

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	for (let iy = 0; iy < h; iy++) {
		for (let ix = 0; ix < w; ix++) {
			const i = iy * w + ix;
			const x = ix * PARAMS.cell.x;
			const y = iy * PARAMS.cell.y;
			const r = noise(
				x * PARAMS.noise.scale,
				y * PARAMS.noise.scale * PARAMS.noise.aspect,
				0,
			);
			const rr = step(pow(r, PARAMS.aperture));
			const cell = {
				alpha: rr,
				char: PARAMS.text[i % PARAMS.text.length],
				color: ICEBERG[theme].fg.normal,
				reverse: false,
			};

			CELLS.push(cell);
		}
	}

	paintCells(/(for|if|else|const|let|do|while|break)/i, ICEBERG[theme].fg.blue);
	paintCells(/(function)/i, ICEBERG[theme].fg.orange);
	paintCells(/(fill|stroke|background|noise)/i, ICEBERG[theme].fg.green);
	paintCells(/([0-9]+|true|false)/i, ICEBERG[theme].fg.purple);
	paintCells(/'.*?'/, ICEBERG[theme].fg.lblue);
	paintCells(/·+/, ICEBERG[theme].fg.comment);
	paintCells(/iceberg/i, ICEBERG[theme].fg.blue, true);

	let x = 0;
	while (x < CELLS.length) {
		if (random(1) < 0.1 * 4 * CELLS[x].alpha && !CELLS[x].reverse) {
			CELLS[x].char = BLOCKS[floor(random(BLOCKS.length))];
		}
		x += 1;
	}
}

function step(v) {
	return v > .5 ? 1 : v > .25 ? .2 : 0;
}

function drawTexts(theme) {
	textSize(PARAMS.fontSize);

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	const ox = (width - w * PARAMS.cell.x) / 2;
	const oy = (height - h * PARAMS.cell.y) / 2;
	for (let iy = 0; iy < h; iy++) {
		for (let ix = 0; ix < w; ix++) {
			const i = iy * w + ix;
			const x = ox + ix * PARAMS.cell.x;
			const y = oy + iy * PARAMS.cell.y;
			const cell = CELLS[i];
			const al = cell.alpha < 1e-3 ?
				40 :
				map(cell.alpha, 0, 1, 0, 255);
			if (cell.reverse) {
				fill(
					red(cell.color),
					green(cell.color),
					blue(cell.color),
					al,
				);
				rect(x, y, PARAMS.cell.x, PARAMS.cell.y);
				blendMode(BLEND);
				fill(
					red(ICEBERG[theme].bg),
					green(ICEBERG[theme].bg),
					blue(ICEBERG[theme].bg),
					PARAMS.theme === 'dark' ? 220 : 220,
				);
			} else {
				fill(
					red(cell.color),
					green(cell.color),
					blue(cell.color),
					al,
				);
				blendMode(PARAMS.theme === 'dark' ? ADD : BLEND);
			}

			if (cell.alpha < 1e-3) {
				text(
					'·',
					x + PARAMS.cell.x * 0.5,
					y + PARAMS.baselineOffset + PARAMS.cell.y * 0.5,
				);
			} else {
				const by = BLOCKS.includes(cell.char) ? 0 : PARAMS.baselineOffset;
				text(
					cell.char,
					x + PARAMS.cell.x * 0.5,
					y + by + PARAMS.cell.y * 0.5,
				);
			}
		}
	}
}

function drawArtwork(theme) {
	noiseSeed(PARAMS.seed);
	setUpCells(theme);

	blendMode(BLEND);
	background(ICEBERG[theme].bg);

	push();
	{
		drawTexts(theme);
		if (PARAMS.postEffect.blur) {
			filter(BLUR, PARAMS.theme === 'dark' ? 4 : 2);
		}

		fill(
			red(ICEBERG[theme].bg),
			green(ICEBERG[theme].bg),
			blue(ICEBERG[theme].bg),
			PARAMS.postEffect.blur ? 100 : 200,
		);
		blendMode(BLEND);
		rect(0, 0, width, height);
	}
	pop();

	drawTexts(theme);

	if (PARAMS.postEffect.scanline) {
		blendMode(BLEND);
		for (let y = 0; y < height; y += 2) {
			fill(
				red(ICEBERG[theme].bg),
				green(ICEBERG[theme].bg),
				blue(ICEBERG[theme].bg),
				50,
			);
			rect(0, y, width, 1);
		}
	}
}

function preload() {
	PARAMS.text = loadStrings('/sketch.js');
}

function setup() {
	createCanvas(600, 600);

	noStroke();
	textFont('Roboto Mono');
	textAlign(CENTER, CENTER);
	noiseDetail(8, .65);

	PARAMS.text = formatText(PARAMS.text);

	setUpPane();

	setTimeout(() => {
		drawArtwork(PARAMS.theme);
	}, 200);
}

// --

const PARAMS = {
	text: '',
	baselineOffset: +1,
	cell: {
		x: 10,
		y: 14,
	},
	noise: {
		aspect: 3.4,
		scale: .0075,
	},
	fontSize: 12,
	seed: 141,
	postEffect: {
		blur: false,
		scanline: true,
	},
	theme: 'dark',
	aperture: 5,
};

const ICEBERG = {
	dark: {
		bg: '#161821',
		fg: {
			normal: '#c6c8d1',
			green: '#b4be82',
			blue: '#84a0c6',
			red: '#e27878',
			orange: '#e2a478',
			lblue: '#89b8c2',
			purple: '#a093c7',
			comment: '#6b7089',
		},
	},
	light: {
		bg: '#e8e9ec',
		fg: {
			normal: '#33374c',
			green: '#668e3d',
			blue: '#2d539e',
			red: '#cc517a',
			orange: '#c57339',
			lblue: '#3f83a6',
			purple: '#7759b4',
			comment: '#8389a3',
		},
	},
};

function setUpPane() {
	const pane = new Tweakpane.Pane({
		title: 'Parameters',
	});
	pane.addInput(PARAMS, 'cell', {
		x: {min: 1, max: 30, step: 1},
		y: {min: 1, max: 30, step: 1},
	});
	pane.addInput(PARAMS, 'fontSize', {
		min: 0,
		max: 20,
		step: 1,
	});
	pane.addInput(PARAMS, 'aperture', {
		min: 0,
		max: 20,
		step: 1,
	});
	pane.addInput(PARAMS, 'seed', {
		min: 0,
		max: 1000,
		step: 1,
	});
	pane.addInput(PARAMS, 'theme', {
		options: [
			{text: 'dark', value: 'dark'},
			{text: 'light', value: 'light'},
		],
	});
	((f) => {
		f.addInput(PARAMS.noise, 'scale', {
			min: 0,
			max: .05,
			format: (v) => v.toFixed(4),
		});
		f.addInput(PARAMS.noise, 'aspect', {
			min: 0,
			max: 10,
		});
	})(pane.addFolder({title: 'Perlin'}));
	((f) => {
		f.addInput(PARAMS.postEffect, 'blur');
		f.addInput(PARAMS.postEffect, 'scanline');
	})(pane.addFolder({title: 'Post Effect'}));

	pane.on('change', () => {
		drawArtwork(PARAMS.theme);
	});
}
