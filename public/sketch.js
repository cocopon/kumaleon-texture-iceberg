const BLOCKS = ['░', '▒', '▓'];
const LINES = {
	h: ['┈', '┉'],
	v: ['┊', '┋'],
};
const CELLS = [];
let TEXT = '';
let TEXT_G;

function formatText(text) {
	return text.join('')
		.replace(/[\n\s\t]+/g, '·')
		.toUpperCase();
}

function paintCells(pat, col, reverse = false) {
	let tx = TEXT;
	let ox = 0;
	do {
		const m = tx.match(pat);
		const x = m && m.index;

		if (!m || x < 0) {
			break;
		}

		ox += x;
		if (ox >= CELLS.length) {
			break;
		}

		for (let dx = 0; dx < m[0].length; dx++) {
			if (!CELLS[ox + dx]) {
				break;
			}
			CELLS[ox + dx].color = col;
			CELLS[ox + dx].reverse = reverse;
		};

		tx = tx.substring(x + m[0].length, tx.length);
		ox += m[0].length;
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
			const rm = noise(
				(PARAMS.noise.offset.x + x) * PARAMS.noise.scale * (1 - PARAMS.noise.aspect) * 2,
				(PARAMS.noise.offset.y + y) * PARAMS.noise.scale * PARAMS.noise.aspect * 2,
				0,
			);
			const rs = noise(
				(PARAMS.noise.offset.x * PARAMS.sub.speed + x) * PARAMS.noise.scale * (1 - PARAMS.noise.aspect) * 2,
				(PARAMS.noise.offset.y * PARAMS.sub.speed + y) * PARAMS.noise.scale * PARAMS.noise.aspect * 2,
				0,
			);
			const rr = grade(
				pow(rm, PARAMS.aperture) * (1 - PARAMS.sub.balance) +
				pow(rs, PARAMS.aperture) * PARAMS.sub.balance
			);
			const cell = {
				alpha: rr,
				char: TEXT[i % TEXT.length],
				color: ICEBERG[theme].fg.normal,
				reverse: false,
			};

			CELLS.push(cell);
		}
	}

	paintCells(/(for|if|else|const|let|do|while|break|return)/i, ICEBERG[theme].fg.blue);
	paintCells(/(function)/i, ICEBERG[theme].fg.orange);
	paintCells(/(fill|stroke|background|noise|random|ceil|floor)/i, ICEBERG[theme].fg.green);
	paintCells(/([0-9]+|true|false)/i, ICEBERG[theme].fg.purple);
	paintCells(/(error)/i, ICEBERG[theme].fg.red);
	paintCells(/'.*?'/, ICEBERG[theme].fg.lblue);
	paintCells(/·+/, ICEBERG[theme].fg.comment);
	paintCells(/iceberg/i, ICEBERG[theme].fg.blue, true);

	glitchCells();
}

function glitchCells() {
	let x = 0;
	while (x < CELLS.length) {
		const glitch = random(1) < PARAMS.error * CELLS[x].alpha && !CELLS[x].reverse;
		CELLS[x].char = glitch ?
			BLOCKS[floor(random(BLOCKS.length))] :
			TEXT.charAt(x % TEXT.length);
		x += 1;
	}

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	let ix = PARAMS.lines.x;
	let iy = PARAMS.lines.y;
	do {
		if (iy > 0) {
			const l = 1 + floor(random(1) * random(1) * 10);
			const oy = floor(random(0, h - l));
			const x = floor(random(0, w));
			const ch = LINES.v[floor(random(LINES.v.length))];
			for (let dy = 0; dy < l; dy++) {
				const i = (oy + dy) * w + x;
				if (!CELLS[i].reverse) {
					CELLS[i].char = ch;
				}
			}
			iy -= 1;
		}

		if (ix > 0) {
			const l = 1 + floor(random(1) * random(1) * 10);
			const ox = floor(random(0, w - l));
			const y = floor(random(0, h));
			const ch = LINES.h[floor(random(LINES.h.length))];
			for (let dx = 0; dx < l; dx++) {
				const i = y * w + (ox + dx);
				if (!CELLS[i].reverse) {
					CELLS[i].char = ch;
				}
			}
			ix -= 1;
		}
	} while (ix > 0 || iy > 0);
}

function grade(v) {
	return v > .5 ? 1 : v > .25 ? (0.2 + random(-1, +1) * PARAMS.flicker) : 0;
}

function drawTexts(theme) {
	TEXT_G.clear();
	TEXT_G.noStroke();
	TEXT_G.textFont('Roboto Mono');
	TEXT_G.textAlign(CENTER, CENTER);
	TEXT_G.textSize(PARAMS.fontSize);

	const charG = createGraphics(PARAMS.cell.x, PARAMS.cell.y);
	charG.noStroke();
	charG.textFont('Roboto Mono');
	charG.textAlign(CENTER, CENTER);
	charG.textSize(PARAMS.fontSize);

	const bm = PARAMS.theme === 'dark' ? ADD : MULTIPLY;
	TEXT_G.blendMode(bm);
	blendMode(bm);

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
			const dot = cell.alpha < 1e-3;
			const ch = dot ? '·' : cell.char;
			const al = map(dot ? PARAMS.grid : cell.alpha, 0, 1, 0, 255);
			const by = BLOCKS.includes(ch) ? 0 : PARAMS.baselineOffset;

			if (cell.reverse && !dot) {
				charG.clear();
				charG.fill(
					red(cell.color),
					green(cell.color),
					blue(cell.color),
					al,
				);
				charG.rect(0, 0, PARAMS.cell.x, PARAMS.cell.y);
				charG.fill(PARAMS.theme === 'dark' ? 0 : 255);
				charG.text(
					ch,
					PARAMS.cell.x * 0.5,
					by + PARAMS.cell.y * 0.5,
				);
				TEXT_G.image(charG, x, y);
			} else {
				TEXT_G.fill(
					red(cell.color),
					green(cell.color),
					blue(cell.color),
					al,
				);
				TEXT_G.text(
					ch,
					x + PARAMS.cell.x * 0.5,
					y + by + PARAMS.cell.y * 0.5,
				);
			}
		}
	}
	image(TEXT_G, 0, 0);

	charG.remove();
}

function drawArtwork(theme) {
	noiseSeed(PARAMS.seed);
	setUpCells(theme);

	blendMode(BLEND);
	background(ICEBERG[theme].bg);

	{
		if (PARAMS.postEffect.blur > 0) {
			drawingContext.filter = `blur(${PARAMS.postEffect.blur}px)`;
		}
		drawTexts(theme);
		drawingContext.filter = 'none';
	}

	blendMode(BLEND);
	fill(
		red(ICEBERG[theme].bg),
		green(ICEBERG[theme].bg),
		blue(ICEBERG[theme].bg),
		map(PARAMS.postEffect.depth, 0, 1, 255, 0),
	);
	rect(0, 0, width, height);

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
	const src = document.querySelector('script[src*="sketch.js"]').src;
	TEXT = loadStrings(src);
}

function setup() {
	createCanvas(600, 600);
	noStroke();
	noiseDetail(8, .65);

	TEXT = formatText(TEXT);
	TEXT_G = createGraphics(width, height);

	setUpPane();

	setTimeout(() => {
		drawArtwork(PARAMS.theme);
	}, 200);
}

function draw() {
	if (PARAMS.active) {
		PARAMS.noise.offset.x -= PARAMS.noise.velocity.x;
		PARAMS.noise.offset.y -= PARAMS.noise.velocity.y;
		drawArtwork(PARAMS.theme);
	}
}

// --

const PARAMS = {
	active: false,
	baselineOffset: +1,
	cell: {
		x: 12,
		y: 12,
	},
	noise: {
		aspect: 0.78,
		offset: {x: 0, y: 0},
		scale: .027,
		velocity: {x: 0, y: 0},
	},
	fontSize: 12,
	seed: 380,
	postEffect: {
		blur: 30,
		depth: .7,
		scanline: true,
	},
	theme: 'dark',
	aperture: 6,
	grid: 0.12,
	error: 0.3,
	lines: {
		x: 150,
		y: 100,
	},
	flicker: 0.1,
	sub: {
		balance: 0,
		speed: 0.5,
	},
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
	pane.addInput(PARAMS, 'active');
	pane.addInput(PARAMS, 'cell', {
		x: {min: 1, max: 30, step: 1},
		y: {min: 1, max: 30, step: 1},
	});
	pane.addInput(PARAMS, 'fontSize', {
		min: 0,
		max: 20,
		step: 1,
	});
	pane.addInput(PARAMS, 'grid', {
		min: 0,
		max: 1,
	});
	pane.addInput(PARAMS, 'theme', {
		options: [
			{text: 'dark', value: 'dark'},
			{text: 'light', value: 'light'},
		],
	});
	((f) => {
		f.addInput(PARAMS, 'error', {
			min: 0,
			max: 1,
		});
		f.addInput(PARAMS, 'lines', {
			x: {min: 0, max: 500, step: 1},
			y: {min: 0, max: 500, step: 1},
		});
	})(pane.addFolder({title: 'Decoration'}));
	((f) => {
		f.addInput(PARAMS.noise, 'scale', {
			min: 0,
			max: .05,
			format: (v) => v.toFixed(4),
		});
		f.addInput(PARAMS.noise, 'aspect', {
			min: 0,
			max: 1,
		});
		f.addInput(PARAMS.noise, 'velocity', {
			x: {min: -10, max: 10},
			y: {min: -10, max: 10},
		});
		f.addInput(PARAMS, 'aperture', {
			min: 0,
			max: 20,
			step: 1,
		});
		f.addInput(PARAMS.sub, 'balance', {
			min: 0,
			max: 1,
		});
		f.addInput(PARAMS.sub, 'speed', {
			min: 0,
			max: 1,
		});
		f.addInput(PARAMS, 'flicker', {
			min: 0,
			max: 1,
		});
		f.addInput(PARAMS, 'seed', {
			min: 0,
			max: 1000,
			step: 1,
		});
	})(pane.addFolder({title: 'Distribution'}));
	((f) => {
		f.addInput(PARAMS.postEffect, 'scanline');
		f.addInput(PARAMS.postEffect, 'blur', {
			min: 0,
			max: 100,
		});
		f.addInput(PARAMS.postEffect, 'depth', {
			min: 0,
			max: 1,
		});
	})(pane.addFolder({title: 'Post Effect'}));

	pane.on('change', () => {
		drawArtwork(PARAMS.theme);
	});
}
