const PARAMS = {
	text: '',
	baselineOffset: +1,
	cell: {
		x: 10,
		y: 14,
	},
	noise: {
		aspect: 1.5,
		scale: .015,
	},
	fontSize: 12,
	seed: 0,
	postEffect: {
		blur: false,
		scanline: true,
	},
};

const CELLS = [];

// TODO: dark/light
const ICEBERG = {
	bg: '#161821',
	fg: {
		normal: '#c6c8d1',
		green: '#b4be82',
		blue: '#84a0c6',
		red: '#cc517a',
		orange: '#c57339',
		lblue: '#89b8c2',
		purple: '#7759b4',
		comment: '#8389a3',
	},
};

const BLOCKS = ['░', '▒', '▓'];

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

function setUpCells() {
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
			const rr = step(pow(r, 4));
			const cell = {
				alpha: rr,
				char: PARAMS.text[i % PARAMS.text.length],
				color: ICEBERG.fg.normal,
				reverse: false,
			};

			CELLS.push(cell);
		}
	}

	paintCells(/(for|if|else|const|do|while)/i, ICEBERG.fg.blue);
	paintCells(/(function)/i, ICEBERG.fg.orange);
	paintCells(/(fill|stroke|background|noise)/i, ICEBERG.fg.green);
	paintCells(/[0-9]+/, ICEBERG.fg.purple);
	paintCells(/'.*?'/, ICEBERG.fg.lblue);
	paintCells(/·+/, ICEBERG.fg.comment);
	paintCells(/iceberg/i, ICEBERG.fg.blue, true);

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

function drawTexts() {
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
				fill(ICEBERG.bg);
			} else {
				fill(
					red(cell.color),
					green(cell.color),
					blue(cell.color),
					al,
				);
				blendMode(ADD);
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

function drawArtwork() {
	noiseSeed(PARAMS.seed);
	setUpCells();

	blendMode(BLEND);
	background(ICEBERG.bg);

	push();
	{
		drawTexts();
		if (PARAMS.postEffect.blur) {
			filter(BLUR, 4);
		}

		fill(
			red(ICEBERG.bg),
			green(ICEBERG.bg),
			blue(ICEBERG.bg),
			PARAMS.postEffect.blur ? 100 : 200,
		);
		blendMode(BLEND);
		rect(0, 0, width, height);
	}
	pop();

	drawTexts();

	if (PARAMS.postEffect.scanline) {
		blendMode(BLEND);
		for (let y = 0; y < height; y += 2) {
			fill(
				red(ICEBERG.bg),
				green(ICEBERG.bg),
				blue(ICEBERG.bg),
				50,
			);
			rect(0, y, width, 1);
		}
	}
}

function preload() {
	PARAMS.text = loadStrings('/sketch.js');
}

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
	pane.addInput(PARAMS, 'seed', {
		min: 0,
		max: 1000,
		step: 1,
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
		drawArtwork();
	});
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
		drawArtwork();
	}, 200);
}

function draw() {
}

function mousePressed() {
}