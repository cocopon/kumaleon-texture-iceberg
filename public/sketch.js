const PARAMS = {
	text: '',
	cell: {
		x: 12,
		y: 16,
	},
	noiseScale: .01,
	fontSize: 12,
	seed: 0,
};

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

function trimBody() {
	PARAMS.text = PARAMS.text.join('')
		.replace(/[\n\s\t]+/g, '')
		.toUpperCase();
}

function step(v) {
	return v - v % 0.2;
}

function hoge() {
	background(ICEBERG.bg);
	textSize(PARAMS.fontSize);
	noiseSeed(PARAMS.seed);

	const h = ceil(height / PARAMS.cell.y);
	const w = ceil(width / PARAMS.cell.x);
	for (let iy = 0; iy < h; iy++) {
		for (let ix = 0; ix < w; ix++) {
			const i = iy * w + ix;
			const x = ix * PARAMS.cell.x;
			const y = iy * PARAMS.cell.y;
			const r = noise(x * PARAMS.noiseScale, y * PARAMS.noiseScale, 0);
			const rr = step(r * r * r);
			const al = map(rr, 0, 1, 0, 255);
			fill(
				red(ICEBERG.fg.normal),
				green(ICEBERG.fg.normal),
				blue(ICEBERG.fg.normal),
				al,
			);

			if (random(1) < .05) {
				const cols = ['red', 'orange', 'green', 'lblue', 'blue', 'purple'];
				fill(ICEBERG.fg[cols[floor(random(cols.length))]]);
			}

			if (rr < 1e-3) {
					fill(
						red(ICEBERG.fg.normal),
						green(ICEBERG.fg.normal),
						blue(ICEBERG.fg.normal),
						40,
					);
					text('·', x + PARAMS.cell.x * 0.5, y + PARAMS.cell.y * 0.5);
			} else {
				if (random(1) < 0.1) {
					const ch = GRADI[floor(random(GRADI.length))];
					text(ch, x + PARAMS.cell.x * 0.5, y + PARAMS.cell.y * 0.5);
				} else {
					// const ch = random(1) < 0.5 ? '·' : String.fromCharCode(['A'.charCodeAt(0) + random(30)]);
					const ch = PARAMS.text[i % PARAMS.text.length];
					text(ch, x + PARAMS.cell.x * 0.5, y + PARAMS.cell.y * 0.5);
				}
			}
		}
	}
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

	trimBody();
	console.log(PARAMS.text);

	setTimeout(() => {
		hoge();
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
	pane.on('change', hoge);
}

function draw() {
}

function mousePressed() {
}