const BLOCK_CHARS = ['░', '▒', '▓'];
const LINE_CHARS = {
	h: ['┈', '┉'],
	v: ['┊', '┋'],
};
const CELLS = [];
let SKETCH_JS = '';
let TEXT_G, CHAR_G;

function formatText(text) {
	return text
		.join('')
		.replace(/[\n\s\t]+/g, '·')
		.toUpperCase();
}

function paintCells(pat, col, reverse = false) {
	let tx = SKETCH_JS;
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
		}

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
				(PARAMS.noise.offset.x + x) *
					PARAMS.noise.scale *
					(1 - PARAMS.noise.aspect) *
					2,
				(PARAMS.noise.offset.y + y) *
					PARAMS.noise.scale *
					PARAMS.noise.aspect *
					2,
				0
			);
			const rs = noise(
				(PARAMS.noise.offset.x * PARAMS.sub.speed + x) *
					PARAMS.noise.scale *
					(1 - PARAMS.noise.aspect) *
					2,
				(PARAMS.noise.offset.y * PARAMS.sub.speed + y) *
					PARAMS.noise.scale *
					PARAMS.noise.aspect *
					2,
				0
			);
			const rr = grade(
				pow(rm, PARAMS.aperture) * (1 - PARAMS.sub.balance) +
					pow(rs, PARAMS.aperture) * PARAMS.sub.balance
			);
			const cell = {
				alpha: rr,
				char: SKETCH_JS[i % SKETCH_JS.length],
				color: ICEBERG[theme].fg.normal,
				reverse: false,
			};

			CELLS.push(cell);
		}
	}

	paintCells(
		/(for|if|else|const|let|do|while|break|return)/i,
		ICEBERG[theme].fg.blue
	);
	paintCells(/(function)/i, ICEBERG[theme].fg.orange);
	paintCells(
		/(fill|stroke|background|noise|random|ceil|floor)/i,
		ICEBERG[theme].fg.green
	);
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
		const glitch =
			random(1) < PARAMS.error * CELLS[x].alpha && !CELLS[x].reverse;
		CELLS[x].char = glitch
			? BLOCK_CHARS[floor(random(BLOCK_CHARS.length))]
			: SKETCH_JS.charAt(x % SKETCH_JS.length);
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
			const ch = LINE_CHARS.v[floor(random(LINE_CHARS.v.length))];
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
			const ch = LINE_CHARS.h[floor(random(LINE_CHARS.h.length))];
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
	const t0 = PARAMS.threshold.t0;
	const t1 = t0 * PARAMS.threshold.t1;
	return v > t0 ? 1 : v > t1 ? 0.2 : 0;
}

function drawTexts(theme) {
	TEXT_G.clear();
	CHAR_G.clear();

	const bm = PARAMS.theme === 'dark' ? ADD : BLEND;
	TEXT_G.blendMode(bm);

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	const ox = (width - w * PARAMS.cell.x) / 2;
	const oy = (height - h * PARAMS.cell.y) / 2;
	const bg = ICEBERG[theme].bg;
	for (let iy = 0; iy < h; iy++) {
		for (let ix = 0; ix < w; ix++) {
			const i = iy * w + ix;
			const x = ox + ix * PARAMS.cell.x;
			const y = oy + iy * PARAMS.cell.y;
			const cell = CELLS[i];
			const dot = cell.alpha < 1e-3;
			const ch = dot ? '·' : cell.char;
			const al = map(dot ? PARAMS.grid : cell.alpha, 0, 1, 0, 255);
			const by = BLOCK_CHARS.includes(ch) ? 0 : PARAMS.baselineOffset;

			if (cell.reverse && !dot) {
				CHAR_G.clear();
				CHAR_G.fill(red(cell.color), green(cell.color), blue(cell.color), al);
				CHAR_G.rect(0, 0, PARAMS.cell.x, PARAMS.cell.y);
				CHAR_G.fill(
					PARAMS.theme === 'dark' ? 0 : color(red(bg), green(bg), blue(bg), 220)
				);
				CHAR_G.text(ch, PARAMS.cell.x * 0.5, by + PARAMS.cell.y * 0.5);
				TEXT_G.image(CHAR_G, x, y);
			} else {
				TEXT_G.fill(red(cell.color), green(cell.color), blue(cell.color), al);
				TEXT_G.text(ch, x + PARAMS.cell.x * 0.5, y + by + PARAMS.cell.y * 0.5);
			}
		}
	}

	blendMode(bm);
	image(TEXT_G, 0, 0);
}

function prepareArtwork() {
	PARAMS = {...PARAMS_ORG};

	const l = Math.max(width, height);
	const sz = Math.floor(Math.max(l / 60, 12));
	PARAMS.cell.x = sz;
	PARAMS.cell.y = sz;
	PARAMS.fontSize = sz;
	PARAMS.noise.scale = (0.027 * 12) / sz;
	PARAMS.baselineOffset = sz / 12;

	const dark = matchMedia('(prefers-color-scheme: dark)').matches;
	PARAMS.theme = dark ? 'dark' : 'light';
	PARAMS.grid = dark ? 0.12 : 0.2;
	PARAMS.postEffect.blur = dark ? 30 : 5;
	PARAMS.postEffect.depth = dark ? 1 : 0.3;

	TEXT_G = createGraphics(width, height);
	TEXT_G.noStroke();
	TEXT_G.textFont('Roboto Mono');
	TEXT_G.textAlign(CENTER, CENTER);
	TEXT_G.textSize(PARAMS.fontSize);

	CHAR_G = createGraphics(PARAMS.cell.x, PARAMS.cell.y);
	CHAR_G.noStroke();
	CHAR_G.textFont('Roboto Mono');
	CHAR_G.textAlign(CENTER, CENTER);
	CHAR_G.textSize(PARAMS.fontSize);
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
		map(PARAMS.postEffect.depth, 0, 1, 255, 0)
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
				50
			);
			rect(0, y, width, 1);
		}
	}
}

function preload() {
	const src = 'https://raw.githubusercontent.com/cocopon/kumaleon-texture-iceberg/47e131e10e4d9f78bd49765f61e86e07a959f85a/public/sketch.js';//document.querySelector('script[src*="sketch.js"]').src;
	SKETCH_JS = loadStrings(src);
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke();
	noiseDetail(8, 0.65);

	SKETCH_JS = formatText(SKETCH_JS);

	prepareArtwork();

	const mm = matchMedia('(prefers-color-scheme: dark)');
	mm.addEventListener('change', () => {
		prepareArtwork();
	});
}

function draw() {
	if (PARAMS.active) {
		PARAMS.noise.offset.x -= PARAMS.noise.velocity.x;
		PARAMS.noise.offset.y -= PARAMS.noise.velocity.y;
		drawArtwork(PARAMS.theme);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	prepareArtwork();
}

// --

const PARAMS_ORG = {
	active: true,
	baselineOffset: +1,
	cell: {
		x: 12,
		y: 12,
	},
	noise: {
		aspect: 0.92,
		offset: {x: 0, y: 0},
		scale: 0.027,
		velocity: {x: 6, y: -0.2},
	},
	fontSize: 12,
	seed: 772,
	postEffect: {
		blur: 30,
		depth: 0.8,
		scanline: true,
	},
	theme: 'dark',
	aperture: 6,
	grid: 0.12,
	error: 0.1,
	lines: {
		x: 50,
		y: 10,
	},
	sub: {
		balance: 0.5,
		speed: 0.4,
	},
	threshold: {
		t0: 0.5,
		t1: 0.8,
	},
};
let PARAMS = {...PARAMS_ORG};

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
