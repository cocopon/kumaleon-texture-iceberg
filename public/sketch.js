const PARAMS = {
	text: '',
	cell: {
		x: 12,
		y: 16,
	},
	noiseScale: .015,
	fontSize: 12,
	seed: 0,
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

const GRADI = [
	'░',
	'▒',
	'▓',
];

function setUpText() {
	PARAMS.text = PARAMS.text.join('')
		.replace(/[\n\s\t]+/g, '')
		.toUpperCase();
}

function colorCells(pat, col) {
	let tx = PARAMS.text;
	let oj = 0;
	let j = 0;
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
			// CELLS[oj + dj].alpha += random(0.5);
			CELLS[oj + dj].color = col;
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
			const r = noise(x * PARAMS.noiseScale, y * PARAMS.noiseScale, 0);
			const rr = step(pow(r, 4));
			const cell = {
				alpha: rr,
				char: PARAMS.text[i % PARAMS.text.length],
				color: ICEBERG.fg.normal,
			};

			CELLS.push(cell);
		}
	}

	colorCells(/(for|if|else|const|function|do|while)/i, ICEBERG.fg.blue);
	colorCells(/(fill|stroke|background|noise)/i, ICEBERG.fg.green);
	colorCells(/[0-9.]+/, ICEBERG.fg.purple);
	colorCells(/'.*?'/, ICEBERG.fg.lblue);

	let x = 0;
	while (x < CELLS.length) {
		if (random(1) < 0.1 * 4 * CELLS[x].alpha) {
			CELLS[x].char = GRADI[floor(random(GRADI.length))];
		}
		x += 1;
	}
}

function step(v) {
	return v > .5 ? 1 : v > .25 ? .5 : 0;
	// return v - v % 0.33;
}

function drawTexts() {
	textSize(PARAMS.fontSize);

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	for (let iy = 0; iy < h; iy++) {
		for (let ix = 0; ix < w; ix++) {
			const i = iy * w + ix;
			const x = ix * PARAMS.cell.x;
			const y = iy * PARAMS.cell.y;
			const cell = CELLS[i];
			fill(
				red(cell.color),
				green(cell.color),
				blue(cell.color),
				map(cell.alpha, 0, 1, 0, 255),
			);

			if (cell.alpha < 1e-3) {
					fill(
						red(cell.color),
						green(cell.color),
						blue(cell.color),
						40,
					);
					text('·', x + PARAMS.cell.x * 0.5, y + PARAMS.cell.y * 0.5);
			} else {
				text(cell.char, x + PARAMS.cell.x * 0.5, y + PARAMS.cell.y * 0.5);
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
		blendMode(ADD);
		drawTexts();
		// filter(BLUR, 8);

		fill(
			red(ICEBERG.bg),
			green(ICEBERG.bg),
			blue(ICEBERG.bg),
			127,
		);
		blendMode(BLEND);
		rect(0, 0, width, height);
	}
	pop();

	blendMode(ADD);
	drawTexts();
}

function preload() {
	PARAMS.text = loadStrings('/sketch.js');
}

function setup() {
	createCanvas(600, 600);
	textFont('Roboto Mono');
	textAlign(CENTER, CENTER);
	noStroke();
	noiseDetail(8, .65);

	setUpText();
	console.log(PARAMS.text);

	setTimeout(() => {
		drawArtwork();
	}, 200);

	const pane = new Tweakpane.Pane({
		title: 'Parameters',
	});
	pane.addInput(PARAMS, 'cell', {
		x: {min: 1, max: 30, step: 1},
		y: {min: 1, max: 30, step: 1},
	});
	pane.addInput(PARAMS, 'noiseScale', {
		min: 0,
		max: .05,
		format: (v) => v.toFixed(4),
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
	pane.on('change', () => {
		drawArtwork();
	});
}

function draw() {
}

function mousePressed() {
}