const synths = {
	soprano: new Tone.Synth({ volume: -20 }).toDestination(),
	alto: new Tone.Synth({ volume: -20 }).toDestination(),
	tenor: new Tone.FMSynth({ volume: -28 }).toDestination(),
	continuo: new Tone.PolySynth(Tone.Synth, {
		volume: -18,
	}).toDestination(),
	bass: new Tone.Synth({ volume: -15 }).toDestination(),
};

const getTriads = (octave) => {
	if (typeof octave !== "number" || octave < 1 || octave > 8) {
		octave = 3;
	}
	const triads = {
		I: [[`C${octave}`, `E${octave}`, `G${octave}`]],
		II: [[`D${octave}`, `F#${octave}`, `A${octave}`]],
		III: [[`E${octave}`, `G#${octave}`, `B${octave}`]],
		IV: [[`F${octave}`, `A${octave}`, `C${octave + 1}`]],
		V: [[`G${octave}`, `B${octave}`, `D${octave + 1}`]],
		VI: [[`A${octave}`, `C#${octave + 1}`, `E${octave + 1}`]],
		VII: [[`B${octave}`, `D#${octave + 1}`, `F#${octave + 1}`]],
		i: [[`C${octave}`, `Eb${octave}`, `G${octave}`]],
		ii: [[`D${octave}`, `F${octave}`, `A${octave}`]],
		iii: [[`E${octave}`, `G${octave}`, `B${octave}`]],
		iv: [[`F${octave}`, `Ab${octave}`, `C${octave + 1}`]],
		v: [[`G${octave}`, `Bb${octave}`, `D${octave + 1}`]],
		vi: [[`A${octave}`, `C${octave + 1}`, `E${octave + 1}`]],
		viidim: [[`B${octave}`, `D${octave + 1}`, `F${octave + 1}`]],
		bII: [[`Db${octave}`, `F${octave}`, `Ab${octave}`]],
	};
	Object.keys(triads).forEach((chord) => {
		const root_ = triads[chord][0];
		triads[chord].push([
			root_[1],
			root_[2],
			`${root_[0].substring(0, root_[0].length - 1)}${octave + 1}`,
		]);
		triads[chord].push([
			root_[2],
			`${root_[0].substring(0, root_[0].length - 1)}${octave + 1}`,
			`${root_[1].substring(0, root_[1].length - 1)}${octave + 1}`,
		]);
	});
	return triads;
};
const getTriad = (chord, octave, inversion) => {
	if (typeof inversion !== "number" || inversion < 0 || inversion > 2) {
		inversion = 0;
	}
	if (typeof octave !== "number" || octave < 1 || octave > 8) {
		octave = 3;
	}
	const triads = getTriads(octave);
	if (Object.keys(triads).indexOf(chord) === -1) {
		chord = "I";
	}
	return triads[chord][inversion];
};

const notes = {
	soprano: ["A3", "B3", "C4", "D4", "Eb4", "F4", "G4"],
	alto: ["C4", "D4", "Eb4", "F4", "G4", "A4", "Bb4", "C4"],
	tenor: ["Eb5", "F5", "G5", "B5", "C6"],
	bass: ["C3", "Db3", "G3", "F3", "C3"],
	continuo: [
		["i", 4, 0],
		["bII", 3, 2],
		["V", 3, 0],
		["viidim", 3, 2],
		["i", 4, 1],
	].map((c) => getTriad(c[0], c[1], c[2])),
};

const datasets = {};
Promise.all(
	[
		{ name: "ice", location: "data/arctic-sea-ice.csv" },
		{ name: "temp", location: "data/temp.csv" },
	].map((d) =>
		d3.csv(d.location).then((dataset) => {
			datasets[d.name] = dataset;
		})
	)
).then(() => {
	data = datasets.temp
		.filter((datum) => +datum.year >= 1918 && +datum.year <= 2018)
		.map((datum) => {
			const iceDatum = datasets.ice.find(
				(iceDatum) => iceDatum.year === datum.year
			);
			datum.year = +datum.year;
			datum.temp = +datum.temp;
			datum.ice_area = iceDatum ? +iceDatum.ice_area : false;
			datum.ice_extent = iceDatum ? +iceDatum.ice_extent : false;
			return datum;
		});
	const tempDomain = d3.extent(data, (datum) => datum.temp);
	const scales = {
		soprano: d3
			.scaleQuantize()
			.domain(d3.extent(data, (datum) => datum.ice_area))
			.range(notes.soprano),
		alto: d3
			.scaleQuantize()
			.domain(d3.extent(data, (datum) => datum.ice_extent))
			.range(notes.alto),
		tenor: d3
			.scaleQuantize()
			.domain(tempDomain)
			.range(notes.tenor),
		bass: d3
			.scaleQuantize()
			.domain(tempDomain)
			.range(notes.bass),
		continuo: d3
			.scaleQuantize()
			.domain(tempDomain)
			.range(notes.continuo),
		backgroundcolor: d3
			.scaleQuantize()
			.domain(tempDomain)
			.range(
				[0, 1, 2, 3, 4].map((v) =>
					d3
						.scaleLinear()
						.domain([0, 4])
						.range(["black", "rgb(255,100,100)"])(v)
				)
			),
		backgroundheight: d3
			.scaleQuantize()
			.domain(tempDomain)
			.range(
				[0, 1, 2, 3, 4].map((v) =>
					d3
						.scaleLinear()
						.domain([0, 4])
						.range([10, 100])(v)
				)
			),
		diameter: d3
			.scaleLinear()
			.domain(d3.extent(data, (datum) => datum.ice_area))
			.range([0, 350]),
	};

	let active = 0;
	d3.selectAll(".here").on("click", () => {
		active++;
		window.clearInterval(window.interval);
		if (active >= frames.length) {
			active = frames.length - 1;
		}
		window.frames[active](scales, synths);
	});

	d3.select("#about-li").on("click", () => {
		window.clearInterval(window.interval);
		d3.select("#about").classed("is-active", true);
		d3.select("#guts").classed("is-blurred", true);
		window.location.hash = "#about";
	});
	d3.select("#about").on("click", () => {
		d3.select("#about").classed("is-active", false);
		d3.select("#guts").classed("is-blurred", false);
		window.location.hash = "";
		active = 0;
		window.frames[active](scales, synths);
	});
	d3.select("#song-li").on("click", () => {
		active = window.frames.length - 1;
		window.frames[active](scales, synths);
	});
	d3.select("#explanation-li").on("click", () => {
		d3.select("#year").text("");
		active = 1;
		window.frames[active](scales, synths);
	});
	d3.select("#persist-title").on("click", () => {
		active = 0;
		window.frames[active]();
	});

	if (window.location.hash && window.location.hash === "#about") {
		d3.select("#about").classed("is-active", true);
		d3.select("#guts").classed("is-blurred", true);
		d3.select("#circle")
			.style("height", 0)
			.style("width", 0);
	} else if (window.location.hash && window.location.hash === "#song") {
		active = window.frames.length - 1;
		window.frames[active](scales, synths);
	} else if (
		window.location.hash &&
		window.location.hash === "#explanation"
	) {
		active = 1;
		window.frames[active](scales, synths);
	} else {
		window.frames[active](scales, synths);
	}
});
