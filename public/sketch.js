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

function placeChunks() {
	for (let i = 0; i < PARAMS.chunks; i++) {
		const rw = floor(map(random() * random(), 0, 1, 4, 16));
		const rh = floor(map(random() * random(), 0, 1, 1, 4));
		const ox = floor(random(0, PARAMS.cells - rw - 1));
		const oy = floor(random(0, PARAMS.cells - rh - 1));
		for (let ix = 0; ix < rw; ix++) {
			for (let iy = 0; iy < rh; iy++) {
				const i = (oy + iy) * PARAMS.cells + (ox + ix);
				CELLS[i].alpha = 1;
			}
		}
	}
}

function setUpCells(theme) {
	CELLS.splice(0);
	for (let iy = 0; iy < PARAMS.cells; iy++) {
		for (let ix = 0; ix < PARAMS.cells; ix++) {
			const i = iy * PARAMS.cells + ix;
			const rm = min(noise(
				ix * PARAMS.bg.scale * (1 - PARAMS.bg.aspect),
				iy * PARAMS.bg.scale * PARAMS.bg.aspect,
			), 1);
			const cell = {
				alpha: rm * 0.2,
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

	placeChunks();
	glitchCells();
}

function glitchCells() {
	let x = 0;
	while (x < CELLS.length) {
		const glitch =
			random() < PARAMS.error * CELLS[x].alpha && !CELLS[x].reverse;
		CELLS[x].char = glitch
			? BLOCK_CHARS[floor(random(BLOCK_CHARS.length))]
			: SKETCH_JS.charAt(x % SKETCH_JS.length);
		x += 1;
	}

	let ix = PARAMS.lines.x;
	let iy = PARAMS.lines.y;
	do {
		if (iy > 0) {
			const l = floor(map(
				random() * random(),
				0, 1,
				PARAMS.lines.len.min, PARAMS.lines.len.max,
			) * (1 - PARAMS.lines.aspect));
			const oy = floor(random(0, PARAMS.cells - l));
			const x = floor(random(0, PARAMS.cells));
			const ch = LINE_CHARS.v[floor(random(LINE_CHARS.v.length))];
			for (let dy = 0; dy < l; dy++) {
				const i = (oy + dy) * PARAMS.cells + x;
				const c = CELLS[i];
				if (!c) {
					break;
				}

				c.alpha = c.reverse ? 1 : PARAMS.lines.alpha;
				if (!c.reverse && c.char !== '╳') {
					c.char = LINE_CHARS.h.includes(c.char) ? '╳' : ch;
				}
			}
			iy -= 1;
		}

		if (ix > 0) {
			const l = floor(map(
				random() * random(),
				0, 1,
				PARAMS.lines.len.min, PARAMS.lines.len.max,
			) * PARAMS.lines.aspect);
			const ox = floor(random(0, PARAMS.cells - l));
			const y = floor(random(0, PARAMS.cells));
			const ch = LINE_CHARS.h[floor(random(LINE_CHARS.h.length))];
			for (let dx = 0; dx < l; dx++) {
				const i = y * PARAMS.cells + (ox + dx);
				const c = CELLS[i];
				if (!c) {
					break;
				}

				c.alpha = c.reverse ? 1 : PARAMS.lines.alpha;
				if (!c.reverse && c.char !== '╳') {
					c.char = LINE_CHARS.v.includes(c.char) ? '╳' : ch;
				}
			}
			ix -= 1;
		}
	} while (ix > 0 || iy > 0);
}

function drawTexts(theme) {
	const csz = ceil(max(width, height) / PARAMS.cells);
	const ox = (width - PARAMS.cells * csz) / 2;
	const oy = (height - PARAMS.cells * csz) / 2;

	if (CHAR_G) {
		CHAR_G.remove();
	}
	CHAR_G = createGraphics(csz, csz);
	CHAR_G.noStroke();
	CHAR_G.textFont('Roboto Mono');
	CHAR_G.textAlign(CENTER, CENTER);
	CHAR_G.textSize(csz);

	const bm = PARAMS.theme === 'dark' ? ADD : BLEND;
	TEXT_G.clear();
	TEXT_G.blendMode(bm);
	TEXT_G.textSize(csz);

	const bg = ICEBERG[theme].bg;
	for (let iy = 0; iy < PARAMS.cells; iy++) {
		for (let ix = 0; ix < PARAMS.cells; ix++) {
			const i = iy * PARAMS.cells + ix;
			const x = ox + ix * csz;
			const y = oy + iy * csz;
			const cell = CELLS[i];
			if (!cell) {
				return;
			}

			const ch = cell.alpha <= 0.2 * PARAMS.bg.threshold ?
				' ' :
				cell.alpha <= 0.2 ?
				'·' :
				cell.char;
			const al = map(ch === '·' ? PARAMS.grid : cell.alpha, 0, 1, 0, 255);
			const col = ch === '·' ? ICEBERG[theme].fg.normal : cell.color;
			const by = BLOCK_CHARS.includes(ch) ? 0 : PARAMS.baseline * csz;

			if (cell.reverse && ch !== ' ' && ch !== '·') {
				CHAR_G.clear();
				CHAR_G.fill(red(col), green(col), blue(col), al);
				CHAR_G.rect(0, 0, csz, csz);
				CHAR_G.fill(
					PARAMS.theme === 'dark' ? 0 : color(red(bg), green(bg), blue(bg), 220)
				);
				CHAR_G.text(ch, csz * 0.5, by + csz * 0.5);
				TEXT_G.image(CHAR_G, x, y);
			} else {
				TEXT_G.fill(red(col), green(col), blue(col), al);
				TEXT_G.text(ch, x + csz * 0.5, y + by + csz * 0.5);
			}
		}
	}

	blendMode(bm);
	image(TEXT_G, 0, 0);
}

function prepareArtwork() {
	PARAMS = {...PARAMS_ORG};

	noiseSeed(PARAMS.seed);
	randomSeed(PARAMS.seed);

	const dark = matchMedia('(prefers-color-scheme: dark)').matches;
	PARAMS.theme = dark ? 'dark' : 'light';
	PARAMS.postEffect.blur = dark ? 2 : 0.2;
	PARAMS.postEffect.depth = dark ? 1 : 0.4;

	const loudness = floor(map(random() * random(), 0, 1, 1, 3));
	PARAMS.lines.x = loudness * 10;
	PARAMS.lines.y = loudness * 10;
	PARAMS.chunks = loudness * 20;

	TEXT_G = createGraphics(width, height);
	TEXT_G.noStroke();
	TEXT_G.textFont('Roboto Mono');
	TEXT_G.textAlign(CENTER, CENTER);

	setUpCells(PARAMS.theme);

	loop();
}

let CAN_FILTER;

function blurContent(drawContent) {
	if (!CAN_FILTER) {
		return false;
	}

	const csz = ceil(max(width, height) / PARAMS.cells);
	const b = csz * PARAMS.postEffect.blur;
	drawingContext.filter = `blur(${b}px)`;
	drawContent();
	drawingContext.filter = 'none';
	return true;
}

function drawArtwork(theme) {
	blendMode(BLEND);
	background(ICEBERG[theme].bg);

	if (blurContent(() => {
		drawTexts(theme);
	})) {
		blendMode(BLEND);
		fill(
			red(ICEBERG[theme].bg),
			green(ICEBERG[theme].bg),
			blue(ICEBERG[theme].bg),
			map(PARAMS.postEffect.depth, 0, 1, 255, 0)
		);
		rect(0, 0, width, height);
	}

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

const FONT_TESTERS = [];

function isFontLoaded() {
	const b0 = FONT_TESTERS[0].getBoundingClientRect();
	const b1 = FONT_TESTERS[1].getBoundingClientRect();
	return b0.width !== b1.width;
}

function preload() {
	const src = document.querySelector('script[src*="sketch.js"]').src;
	SKETCH_JS = loadStrings(src);

	[0, 1].forEach((i) => {
		const elem = document.createElement('div');
		elem.style.fontFamily = i === 0 ? '"Roboto Mono", sans-serif' : 'sans-serif';
		elem.style.opacity = '0';
		elem.style.pointerEvents = 'none';
		elem.style.position = 'absolute';
		elem.textContent = 'a.0';
		document.body.appendChild(elem);
		FONT_TESTERS.push(elem);
	});
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke();
	frameRate(10);

	// filter doesn't work in some environments
	// https://bugs.webkit.org/show_bug.cgi?id=198416
	CAN_FILTER = drawingContext.filter !== undefined;

	SKETCH_JS = formatText(SKETCH_JS);

	// TODO: Replace it with generated seed
	PARAMS_ORG.seed = floor(random(1000));

	prepareArtwork();
	drawArtwork(PARAMS.theme);

	const mm = matchMedia('(prefers-color-scheme: dark)');
	mm.addEventListener('change', () => {
		prepareArtwork();
	});
}

function draw() {
	drawArtwork(PARAMS.theme);

	if (isFontLoaded()) {
		noLoop();
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	prepareArtwork();
}

// --

const PARAMS_ORG = {
	baseline: 0.08,
	bg: {
		aspect: 0.6,
		scale: 0.4,
		threshold: 0.52,
	},
	cells: 80,
	chunks: 16,
	error: 0.1,
	grid: 0.3,
	lines: {
		x: 10,
		y: 10,
		len: {min: 16, max: 64},
		alpha: 0.8,
		aspect: 0.6,
	},
	postEffect: {
		blur: 2,
		depth: 0.8,
		scanline: true,
	},
	seed: 0,
	theme: 'dark',
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
