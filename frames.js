const reset = () => {
	window.clearInterval(window.interval);
	d3.select("#canvas").classed("is-inactive", false);
	d3.select("#about").classed("is-active", false);
	d3.select("#guts").classed("is-blurred", false);
	d3.select("#canvas")
		.selectAll("div")
		.classed("is-active", false);
	d3.select("#circle")
		.style("height", 0)
		.style("width", 0);
	d3.select("#year").text("");
};

window.frames = [
	() => {
		window.location.hash = "";
		reset();
	},
	() => {
		window.location.hash = "#explanation";
		reset();
		d3.select("#canvas")
			.select("#text-1")
			.classed("is-active", true);
	},
	(scales, synths) => {
		window.location.hash = "#explanation";
		reset();
		d3.select("#canvas")
			.select("#text-2")
			.classed("is-active", true);

		const music = [0, 0.25, 0.5, 0.75, 1]
			.map(
				(v) =>
					scales.tenor.domain()[0] +
					(scales.tenor.domain()[1] - scales.tenor.domain()[0]) * v
			)
			.map((datum) => ({
				tenor: scales.tenor(datum),
			}));
		let index = 0;
		const beat = 1;
		window.interval = window.setInterval(() => {
			if (index < music.length) {
				const now = Tone.now();
				synths.tenor.triggerAttack(music[index].tenor, now);
				synths.tenor.triggerRelease(now + beat);
				index++;
			} else {
				window.clearInterval(window.interval);
				window.interval = false;
			}
		}, beat * 1000);
	},
	(scales, synths) => {
		window.location.hash = "#explanation";
		reset();
		d3.select("#canvas")
			.select("#text-3")
			.classed("is-active", true);

		const music = [0, 0.25, 0.5, 0.75, 1]
			.map(
				(v) =>
					scales.tenor.domain()[0] +
					(scales.tenor.domain()[1] - scales.tenor.domain()[0]) * v
			)
			.map((datum) => ({
				bass: scales.bass(datum),
				continuo: scales.continuo(datum),
			}));
		let index = 0;
		const beat = 1;
		window.interval = window.setInterval(() => {
			if (index < music.length) {
				const now = Tone.now();
				synths.bass.triggerAttack(music[index].bass, now);
				synths.bass.triggerRelease(now + beat);
				synths.continuo.triggerAttack(music[index].continuo, now);
				synths.continuo.triggerRelease(
					music[index].continuo,
					now + beat
				);
				index++;
			} else {
				window.clearInterval(window.interval);
				window.interval = false;
			}
		}, beat * 1000);
	},
	() => {
		window.location.hash = "#explanation";
		reset();
		d3.select("#canvas")
			.select("#text-4")
			.classed("is-active", true);
	},
	(scales, synths) => {
		window.location.hash = "#song";
		reset();
		d3.select("#canvas").classed("is-inactive", true);

		const beat = 0.2;
		const music = data.map((datum) => ({
			soprano: datum.ice_area ? scales.soprano(datum.ice_area) : false,
			alto: datum.ice_extent ? scales.alto(datum.ice_extent) : false,
			tenor: datum.temp ? scales.tenor(datum.temp) : false,
			bass: datum.temp ? scales.bass(datum.temp) : false,
			continuo: datum.temp ? scales.continuo(datum.temp) : false,
		}));
		let index = 0;
		window.interval = window.setInterval(() => {
			if (index < music.length) {
				const now = Tone.now();
				if (music[index].soprano) {
					synths.soprano.triggerAttack(music[index].soprano, now);
					synths.soprano.triggerRelease(
						index % 3 === 0 ? now + beat * 0.95 : now + beat * 0.5
					);
				}
				if (music[index].alto) {
					synths.alto.triggerAttack(music[index].alto, now);
					synths.alto.triggerRelease(
						index % 3 === 0 ? now + beat * 0.95 : now + beat * 0.5
					);
				}
				synths.tenor.triggerAttack(music[index].tenor, now);
				synths.tenor.triggerRelease(
					index % 3 === 0 ? now + beat * 0.99 : now + beat * 0.95
				);
				if (index % 3 === 0) {
					synths.bass.triggerAttack(music[index].bass, now);
					synths.bass.triggerRelease(now + beat * 3);
					synths.continuo.triggerAttack(music[index].continuo, now);
					synths.continuo.triggerRelease(
						music[index].continuo,
						now + beat * 3
					);
				}
				d3.select("#year").text(data[index].year);
				d3.select("#background")
					.transition()
					.duration(beat * 1000)
					.style(
						"background-color",
						scales.backgroundcolor(data[index].temp)
					)
					.style(
						"height",
						`${scales.backgroundheight(data[index].temp)}vh`
					);
				if (data[index].ice_area) {
					d3.select("#circle")
						.transition()
						.duration(beat * 1000)
						.style(
							"height",
							`${scales.diameter(data[index].ice_area)}px`
						)
						.style(
							"width",
							`${scales.diameter(data[index].ice_area)}px`
						);
				} else {
					d3.select("#circle")
						.style("height", 0)
						.style("width", 0);
				}
				index++;
			} else {
				window.clearInterval(window.interval);
				window.interval = false;
			}
		}, beat * 1000);
	},
];
