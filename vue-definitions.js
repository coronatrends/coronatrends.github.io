"use strict";
// custom graph component

var point = {
'Aguascalientes':519,'Amazonas Region':555,'Ancash':555,'Antofagasta':552,'Apurimac':555,'Araucania':552,'Arequipa Region':555,'Arica Y Parinacota':552,'Atacama':552,'Ayacucho':555,'Aysen':552,'Baja California':519,'Baja California Sur':519,'Biobio':552,'Cajamarca':555,'Callao':555,'Campeche':519,'Chiapas':519,'Chihuahua':519,'Chile':552,'Coahuila':519,'Colima':519,'Coquimbo':552,'Cusco':555,'Durango':519,'Guanajuato':519,'Guerrero':519,'Hidalgo':519,'Huancavelica':555,'Huanuco':555,'ICA':555,'Jalisco':519,'Junin':555,'La Libertad':555,'Lambayeque':555,'Lima':555,'Lima Province':555,'Lima Region':555,'Loreto':555,'Los Lagos':552,'Los Rios':552,'Madrede Dios':555,'Magallanes':552,'Maule':552,'Mexico':519,'Mexico City':519,'Mexico State':519,'Michoacan':519,'Montreal':551,'Moquegua':555,'Morelos':519,'Nayarit':519,'Nuble':552,'Nuevo Leon':519,'O Higgins':552,'Oaxaca':519,'Pasco':555,'Peru':555,'Piura Region':555,'Puebla':519,'Puno':555,'Queretaro':519,'San Martin':555,'Santiago':552,'Sinaloa':519,'Sonora':519,'Tabasco':519,'Tacna':555,'Tamaulipas':519,'Tarapaca':552,'Tlaxcala':519,'Tumbes':555,'Ucayali':555,'UK':555,'Valparaiso':552,'Veracruz':519,'Wales':555,'Yucatan':519,'Zacatecas':519,
'default':556
};

function camelCase(str){return str.replace(/\s(.)/g,function(a){return a.toUpperCase();}).replace(/\s/g, '').replace(/^(.)/,function(b){return b.toLowerCase();});}
function pausePoint(view){return view in point?point[view]:point["default"];}

Vue.component('graph', {
	props: ['graphData', 'day', 'resize'],
	template: '<div ref="graph" id="graph" style="height: 100%;"></div>',

	methods: {
		mountGraph() {
			Plotly.newPlot(this.$refs.graph, [], {}, {responsive: true});
			this.$refs.graph.on('plotly_hover', this.onHoverOn)
				.on('plotly_unhover', this.onHoverOff)
				.on('plotly_relayout', this.onLayoutChange);
		},

		fixAttributes() {
			var aTags = document.getElementsByTagName("a");
			aTags[0].setAttribute('data-src', 'https://www.youtube.com/embed/54XLXg4fYsc?start=78&end=107');
			aTags[0].setAttribute('data-fancybox', '');
			var divTags = document.getElementsByTagName("div");
			divTags[4].setAttribute('style', 'position: relative; width: 100%; height: 85%;');
		},

		onHoverOn(data) {
			let curveNumber = data.points[0].curveNumber;
			let name = this.graphData.traces[curveNumber].name;
			if (name) {
				this.traceIndices = this.graphData.traces.map((e, i) => e.name == name ? i : -1).filter(e => e >= 0);
				let update = {'line': {color: 'rgba(254, 52, 110, 1)'}};
				for (let i of this.traceIndices)
					{Plotly.restyle(this.$refs.graph, update, [i]).then(this.fixAttributes());}
			}
		},

		onHoverOff() {
			let update = {'line': {color: 'rgba(0,0,0,0.15)'}};
			for (let i of this.traceIndices)
				{Plotly.restyle(this.$refs.graph, update, [i]).then(this.fixAttributes());}
		},

		onLayoutChange(data) {
			this.emitGraphAttributes();
			// if the user selects autorange, go back to the default range
			if (data['xaxis.autorange'] == true || data['yaxis.autorange'] == true) {
				this.userSetRange = false;
				this.updateGraph();
			}
			// if the user selects a custom range, use this
			else if (data['xaxis.range[0]']) {
				this.xrange = [data['xaxis.range[0]'], data['xaxis.range[1]']].map(e => parseFloat(e));
				this.yrange = [data['yaxis.range[0]'], data['yaxis.range[1]']].map(e => parseFloat(e));
				this.userSetRange = true;
			}
		},

		updateGraph() {
			// we're deep copying the layout object to avoid side effects
			// because plotly mutates layout on user input
			// note: this may cause issues if we pass in date objects through the layout
			let layout = JSON.parse(JSON.stringify(this.graphData.layout));
			// if the user selects a custom range, use it
			if (this.userSetRange) {
				layout.xaxis.range = this.xrange;
				layout.yaxis.range = this.yrange;
			}
			Plotly.react(this.$refs.graph, this.graphData.traces, layout, this.graphData.config).then(this.fixAttributes());
		},

		calculateAngle() {
			if (this.graphData.uistate.showTrendLine && this.graphData.uistate.doublingTime > 0) {
				let element = this.$refs.graph.querySelector('.cartesianlayer').querySelector('.plot').querySelector('.scatterlayer').lastChild.querySelector('.lines').firstChild.getAttribute('d');
				let pts = element.split('M').join(',').split('L').join(',').split(',').filter(e => e != '');
				let angle = Math.atan2(pts[3] - pts[1], pts[2] - pts[0]);
				return angle;
			} else {return NaN;}
		},

		emitGraphAttributes() {
			let graphOuterDiv = this.$refs.graph.querySelector('.main-svg').attributes;
			this.$emit('update:width', graphOuterDiv.width.nodeValue);
			this.$emit('update:height', graphOuterDiv.height.nodeValue);
			let graphInnerDiv = this.$refs.graph.querySelector('.xy').firstChild.attributes;
			this.$emit('update:innerWidth', graphInnerDiv.width.nodeValue);
			this.$emit('update:innerHeight', graphInnerDiv.height.nodeValue);
			this.$emit('update:referenceLineAngle', this.calculateAngle());
		}
	},

	mounted() {
		this.mountGraph();
		if (this.graphData)
			{this.updateGraph();}
		this.emitGraphAttributes();
		this.$emit('update:mounted', true);
	},

	watch: {
		graphData: {
			deep: true,
			handler(data, oldData) {
				// if UI state changes, revert to auto range
				if (JSON.stringify(data.uistate) != JSON.stringify(oldData.uistate))
					{this.userSetRange = false;}
				this.updateGraph();
				this.$emit('update:referenceLineAngle', this.calculateAngle());
			}
		},
		resize() {Plotly.Plots.resize(this.$refs.graph);},
	},

	data() {
		return {
			xrange: [], // stores user selected xrange
			yrange: [], // stores user selected yrange
			userSetRange: false, // determines whether to use user selected range
			traceIndices: [],
		};
	}
});

// global data
window.app = new Vue({
	el: '#root',
	mounted() {this.pullData(this.selectedData, this.selectedRegion);},

	created: function() {
		let url = window.location.href.split('?');
		if (url.length > 1) {
			let urlParameters = new URLSearchParams(url[1]);
			if (urlParameters.has('scale')) {
				let myScale = urlParameters.get('scale').toLowerCase();
				if (myScale == 'log')
					{this.selectedScale = 'Logarithmic Scale';}
				else if (myScale == 'linear')
					{this.selectedScale = 'Linear Scale';}
			}
			if (urlParameters.has('data')) {
				let myData = urlParameters.get('data').toLowerCase();
				if (myData == 'cases')
					{this.selectedData = 'Confirmed Cases';}
				else if (myData == 'deaths')
					{this.selectedData = 'Reported Deaths';}
			}
			if (urlParameters.has('region')) {
				let myRegion = urlParameters.get('region');
				if (this.regions.includes(myRegion))
					{this.selectedRegion = myRegion;}
			}
			let renames = {};
		}

		window.addEventListener('keydown', e => {
			if ((e.key == ' ') && this.dates.length > 0)
				{this.play();}
			else if ((e.key == '-' || e.key == '_' || e.keyCode == '37') && this.dates.length > 0) {
				this.paused = true;
				this.day = Math.max(this.day - 1, this.minDay);
			}
			else if ((e.key == '+' || e.key == '=' || e.keyCode == '39') && this.dates.length > 0) {
				this.paused = true;
				this.day = Math.min(this.day + 1, this.dates.length);
			}
		});
	},

	watch: {
		selectedData() {
			if (!this.firstLoad)
				{this.pullData(this.selectedData, this.selectedRegion, /*updateSelectedCountries*/ false);}
			this.searchField = '';
		},

		selectedRegion() {
			if (!this.firstLoad)
				{this.pullData(this.selectedData, this.selectedRegion, /*updateSelectedCountries*/ true);}
			this.searchField = '';
		},

		minDay() {
			if (this.day < this.minDay)
				{this.day = this.minDay;}
		},

		'graphAttributes.mounted': function() {
			if (this.graphAttributes.mounted && this.autoplay && this.minDay > 0) {
				this.day = this.minDay;
			}
		},

		searchField() {
			let debouncedSearch = this.debounce(this.search, 250, false);
			debouncedSearch();
		}
	},

	methods: {
		debounce(func, wait, immediate) { // https://davidwalsh.name/javascript-debounce-function
			var timeout;
			return function() {
				var context = this,
					args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		},

		myMax() { // https://stackoverflow.com/a/12957522
			var par = [];
			for (var i = 0; i < arguments.length; i++) {
				if (!isNaN(arguments[i]))
					{par.push(arguments[i]);}
			}
			return Math.max.apply(Math, par);
		},

		myMin() {
			var par = [];
			for (var i = 0; i < arguments.length; i++) {
				if (!isNaN(arguments[i]))
					{par.push(arguments[i]);}
			}
			return Math.min.apply(Math, par);
		},

		pullData(selectedData, selectedRegion, updateSelectedCountries = true) {
				let url = 'data/' + camelCase(selectedRegion.toLowerCase().replace(/[-’]/g," ").replace(/ \([0-9,]*\)/g,"")) + '.csv';
			Plotly.d3.csv(url, (data) => this.processData(data, selectedRegion, updateSelectedCountries));
		},

		removeRepeats(array) {return [...new Set(array)];},

		groupByCountry(data, dates, regionsToPullToCountryLevel /* pulls out Hong Kong & Macau from region to country level */ ) {
			let countries = data.map(e => e['Country/Region']);
			countries = this.removeRepeats(countries);
			let grouped = [];
			for (let country of countries) {
				// filter data for this country (& exclude regions we're pulling to country level)
				// e.g. Mainland China numbers should not include Hong Kong & Macau, to avoid double counting
				let countryData = data.filter(e => e['Country/Region'] == country).filter(e => !regionsToPullToCountryLevel.includes(e['Province/State']));
				const row = {region: country};
				for (let date of dates) {
					let sum = countryData.map(e => parseInt(e[date]) || 0).reduce((a, b) => a + b);
					row[date] = sum;
				}
				grouped.push(row);
			}
			return grouped;
		},

		filterByCountry(data, dates, selectedRegion) {return data.filter(e => e['Country/Region'] == selectedRegion).map(e => Object.assign({}, e, {region: e['Province/State']}));},
		convertStateToCountry(data, dates, selectedRegion) {return data.filter(e => e['Province/State'] == selectedRegion).map(e => Object.assign({}, e, {region: e['Province/State']}));},

		processData(data, selectedRegion, updateSelectedCountries) {
			let dates = Object.keys(data[0]).slice(4);
			this.dates = dates;
			this.day = this.dates.length;
			let regionsToPullToCountryLevel = ['Hong Kong', 'Macau'];
			let grouped;

			if (selectedRegion == 'Countries') {
				grouped = this.groupByCountry(data, dates, regionsToPullToCountryLevel);
				for (let region of regionsToPullToCountryLevel) { // pull Hong Kong and Macau to Country level
					let country = this.convertStateToCountry(data, dates, region);
					if (country.length === 1)
						{grouped = grouped.concat(country);}
				}
			}
			else{grouped = this.groupByCountry(data, dates, regionsToPullToCountryLevel);} 
	
			let exclusions = ['Cruise Ship', 'Diamond Princess'];
			let renames = {
				'Taiwan*': 'Taiwan',
				'US': 'USA',
				'Korea; South': 'South Korea',
				'Sao Tome and Principe': 'Sao Tome & Principe',
				'Bosnia and Herzegovina': 'Bosnia',
				'Central African Republic': 'CAR',
				'Australian Capital Territory': 'Capital Territory',
				'Newfoundland and Labrador': 'Newfoundland',
				'West Bank and Gaza': 'Palestine',
				'Burma': 'Myanmar',
				'Northern Mariana Islands': 'Mariana Islands',
				'Dadra and Nagar Haveli': 'Dadra & Nagar Haveli',
				'Trinidad and Tobago': 'Trinidad & Tobago',
				'Antigua and Barbuda': 'Antigua & Barbuda',
				'Jammu and Kashmir': 'Jammu & Kashmir',
				'Dadra and NHDD': 'Dadra & NHDD',
				'Andaman and Nicobar': 'Andaman & Nicobar',
				'District of Columbia': 'D. of Columbia'
			};

			let covidData = [];
			for (let row of grouped) {
				if (!exclusions.includes(row.region)) {
					const arr = [];
					for (let date of dates)
						{arr.push(row[date]);}
					let slope = arr.map((e, i, a) => e - a[i - this.lookbackTime]);
					let region = row.region;
					if (Object.keys(renames).includes(region))
						{region = renames[region];}
					const cases = arr.map(e => e >= this.minCasesInCountry ? e : NaN);
					covidData.push({
						country: region,
						cases,
						slope: slope.map((e, i) => arr[i] >= this.minCasesInCountry ? e : NaN),
						maxCases: this.myMax(...cases)
					});
				}
			}

			this.covidData = covidData.filter(e => e.maxCases > this.minCasesInCountry);
			this.countries = this.covidData.map(e => e.country).sort();
			this.visibleCountries = this.countries;
			const topCountries = this.covidData.sort((a, b) => b.maxCases - a.maxCases).slice(0,35).map(e => e.country);
			const notableLocations = [
			'Sao Paulo','New York','London','Tokyo','Dubai','Johannesburg','Sydney','Buenos Aires','Los Angeles','Paris','Shanghai','Istanbul','Lagos','Auckland','Bogota','Chicago','Berlin','Singapore','Riyadh','Casablanca','Santiago','Toronto','Milan','Hong Kong','Tel Aviv','Tunis','Melbourne','Caracas','Mexico City','Madrid','Mumbai','Cairo','Kampala','Wellington',
			'Brazil','USA','United Kingdom','Japan','United Arab Emirates','SouthAfrica','Australia','Argentina','France','China','Turkey','New Zealand','Colombia','Mexico','Germany','Singapore','Saudi Arabia','Morocco','Chile','Canada','Italy','Israel','Tunisia','Taiwan','Venezuela', 'Spain','India','Egypt','Uganda'
			]
			const selectAll = ['Europe','Lima','Flawed Democracies','Hybrid Regimes','Less Authoritarian','Colombia','Mexico','London','Maharashtra','Bihar','Tamil Nadu','Rajasthan','Madhya Pradesh','Lima Province','Piura Region','Lambayeque','Lima Region','La Libertad','Cajamarca','Arequipa Region','Ica','Gelderland','Zuid-Holland','Ontario']
			if (this.selectedRegion == 'Locations')
				{this.selectedCountries = ['Barnet','London','England','United Kingdom','Western Europe','European Union','Europe','World'];}
			else if (this.selectedRegion == 'ONS')
				{this.selectedCountries = ['England','England(ONS)','London','London(ONS)','United Kingdom','United Kingdom(ONS)'];}
			else if (selectAll.indexOf(this.selectedRegion.replace(/ \([0-9,]*\)/g,"")) > -1)
				{this.selectedCountries = this.countries;}
			else{this.selectedCountries = this.countries.filter(e => topCountries.includes(e) || notableLocations.includes(e));}
			this.firstLoad = false;
			this.play();
		},

		formatDate(date) {
			if (!date)
				{return '';}
			let [m, d, y] = date.split('/');
			return new Date(Date.UTC(2000 + (+y), m - 1, d)).toISOString().slice(0, 10);
		},

		dateToText(date) {
			if (!date)
				{return '';}
			const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			let [m, d] = date.split('/');
			return monthNames[m - 1] + ' ' + d;
		},

		// TODO: clean up play/pause logic
		play() {
			if (this.paused) {
				if (this.day == this.dates.length)
					{this.day = this.minDay;}
				this.paused = false;
				setTimeout(this.increment, 100);
			} else {this.paused = true;}
		},

		pause() {
			if (!this.paused)
				{this.paused = true;}
		},

		increment() {
			if (this.day <= pausePoint(this.selectedRegion.replace(/ \([0-9,]*\)/g,"")))
				{this.selectedTitle = "Confirmed Cases";}
				else{this.selectedTitle = "Extrapolated Cases";}
			if (this.day == pausePoint(this.selectedRegion.replace(/ \([0-9,]*\)/g,"")) && this.futurePause) {
				this.paused = true;
				this.futurePause = false;
			}else if (this.day == this.dates.length || this.minDay < 0) {
				this.day = this.dates.length;
				this.paused = true;
				this.futurePause = true;
			} else if (this.day < this.dates.length) {
				this.futurePause = true;
				if (!this.paused) {
					this.day++;
					setTimeout(this.increment, 100);
				}
			}
		},

		search() {this.visibleCountries = this.countries.filter(e => e.toLowerCase().includes(this.searchField.toLowerCase()));},
		selectAll() {this.selectedCountries = this.countries;},
		deselectAll() {this.selectedCountries = [];},
		toggleHide() {},
		createURL() {},
		// reference line for exponential growth with a given doubling time
		referenceLine(x) {return x * (1 - Math.pow(2, -this.lookbackTime / this.doublingTime));}
	},

	computed: {

		filteredCovidData() {return this.covidData.filter(e => this.selectedCountries.includes(e.country));},

		minDay() {
			let minDay = this.myMin(...(this.filteredCovidData.map(e => e.slope.findIndex(f => f > 0)).filter(x => x != -1)));
			if (isFinite(minDay) && !isNaN(minDay))
				{return minDay + 1;} 
				else {return -1;}
		},

		annotations() {
			return [{
				visible: this.showTrendLine && this.doublingTime > 0,
				x: this.xAnnotation,
				y: this.yAnnotation,
				xref: 'x',
				yref: 'y',
				xshift: -70 * Math.cos(this.graphAttributes.referenceLineAngle),
				yshift: 35 * Math.sin(this.graphAttributes.referenceLineAngle),
				text: "exponential growth",
				showarrow: false,
				textangle: this.graphAttributes.referenceLineAngle * 180 / Math.PI,
				font: {family: 'SF Compact Display',color: "black",size: 14},
			}];
		},

		layout() {
			return {
				title: "Coronavirus Trends<br><a style='color:#53abc8;font-size:medium;font-weight:bold' href='https://www.youtube.com/watch?v=54XLXg4fYsc'>explainer</a><span style='>&nbsp;<span style='color:#53abc8;font-size:medium'>|</span>&nbsp;<a style='color:#53abc8;font-size:medium' href='https://github.com/coronatrends/coronatrends.github.io/blob/master/README.md'>details</a>",
				showlegend: false,
				autorange: false,
				xaxis: {
					title: 'Total ' + this.selectedTitle,
					type: this.selectedScale == 'Logarithmic Scale' ? 'log' : 'linear',
					range: this.selectedScale == 'Logarithmic Scale' ? this.logxrange : this.linearxrange,
					titlefont: {size: 24,color: 'rgba(67, 171, 201,1)'},
				},
				yaxis: {
					title: 'New ' + this.selectedTitle + '(past week)',
					type: this.selectedScale == 'Logarithmic Scale' ? 'log' : 'linear',
					range: this.selectedScale == 'Logarithmic Scale' ? this.logyrange : this.linearyrange,
					titlefont: {size: 24,color: 'rgba(67, 171, 201,1)'},
				},
				hovermode: 'closest',
				font: {family: 'SF Compact Display',color: "black",size: 14},
				annotations: this.annotations
			};
		},

		traces() {
			let showDailyMarkers = this.filteredCovidData.length <= 2;
			// draws grey lines (line plot for each location)
			let trace1 = this.filteredCovidData.map((e, i) => ({
				x: e.cases.slice(0, this.day),
				y: e.slope.slice(0, this.day),
				name: e.country,
				text: this.dates.map(date => e.country + '<br>' + this.formatDate(date)),
				mode: showDailyMarkers ? 'lines+markers' : 'lines',
				type: 'scatter',
				legendgroup: i,
				marker: {size: 4,color: 'rgba(0,0,0,0.15)'},
				line: {color: 'rgba(0,0,0,0.15)'},
				hoverinfo: 'x+y+text',
				hovertemplate: '%{text}<br>Total Cases: %{x:,}<br>Weekly Cases: %{y:,}<extra></extra>',
			}));

			// draws red dots (most recent data for each location)
			let trace2 = this.filteredCovidData.map((e, i) => ({
				x: [e.cases[this.day - 1]],
				y: [e.slope[this.day - 1]],
				text: e.country,
				name: e.country,
				mode: this.showLabels ? 'markers+text' : 'markers',
				legendgroup: i,
				textposition: 'center right',
				marker: {size: 6,color: 'rgba(254, 52, 110, 1)'},
				hovertemplate: '%{data.text}<br>Total Cases: %{x:,}<br>Weekly Cases: %{y:,}<extra></extra>',
			}));

			if (this.showTrendLine && this.doublingTime > 0) {
				let cases = [1, 10000000];
				let trace3 = [{
					x: cases,
					y: cases.map(this.referenceLine),
					mode: 'lines',
					line: {dash: 'dot',},
					marker: {color: 'rgba(67, 171, 201, 1)'},
					hoverinfo: 'skip',
				}];
				// reference line must be last trace for annotation angle to work out
				return [...trace1, ...trace2, ...trace3];
			} else {return [...trace1, ...trace2];}
		},

		config() {
			return {
				responsive: true,
				toImageButtonOptions: {
					format: 'png', // one of png, svg, jpeg, webp
					filename: 'Covid Trends',
					height: 600,
					width: 600 * this.graphAttributes.width / this.graphAttributes.height,
					scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
				}
			};
		},

		graphData() {
			return {
				uistate: { // graph is updated when uistate changes
					selectedData: this.selectedData,
					selectedRegion: this.selectedRegion,
					selectedScale: this.selectedScale,
					showLabels: this.showLabels,
					showTrendLine: this.showTrendLine,
					doublingTime: this.doublingTime,
				},
				traces: this.traces,
				layout: this.layout,
				config: this.config
			};
		},

		xmax() {return Math.max(...this.filteredCases, 50);},
		xmin() {return Math.min(...this.filteredCases, 50);},
		ymax() {return Math.max(...this.filteredSlope, 50);},
		ymin() {return Math.min(...this.filteredSlope);},
		filteredCases() {return Array.prototype.concat(...this.filteredCovidData.map(e => e.cases)).filter(e => !isNaN(e));},
		filteredSlope() {return Array.prototype.concat(...this.filteredCovidData.map(e => e.slope)).filter(e => !isNaN(e));},
		logxrange() {return [1, Math.ceil(Math.log10(1.5 * this.xmax))];},
		linearxrange() {return [-0.49 * Math.pow(10, Math.floor(Math.log10(this.xmax))), Math.round(1.2 * this.xmax)];},

		logyrange() {
			if (this.ymin < 10)
				{return [0, Math.ceil(Math.log10(1.5 * this.ymax))];} // shift ymin on log scale if fewer than 10 cases
				else {return [1, Math.ceil(Math.log10(1.5 * this.ymax))];}
		},

		linearyrange() {
			let ymax = Math.max(...this.filteredSlope, 50);
			return [-Math.pow(10, Math.floor(Math.log10(ymax)) - 2), Math.round(1.05 * ymax)];
		},

		xAnnotation() {
			if (this.selectedScale == 'Logarithmic Scale') {
				let x = this.logyrange[1] - Math.log10(this.referenceLine(1));
				if (x < this.logxrange[1])
					{return x;}
					else {return this.logxrange[1];}
			} else {
					let x = this.linearyrange[1] / this.referenceLine(1);
					if (x < this.linearxrange[1])
						{return x;}
						else {return this.linearxrange[1];}
					}
		},

		yAnnotation() {
			if (this.selectedScale == 'Logarithmic Scale') {
				let x = this.logyrange[1] - Math.log10(this.referenceLine(1));
				if (x < this.logxrange[1])
					{return this.logyrange[1];}
					else {return this.logxrange[1] + Math.log10(this.referenceLine(1));}
			} else {
					let x = this.linearyrange[1] / this.referenceLine(1);
					if (x < this.linearxrange[1])
						{return this.linearyrange[1];}   
						else {return this.linearxrange[1] * this.referenceLine(1);}
					}
		}
	},

	data: {
		paused: true,
		dataTypes: ['Confirmed Cases','Reported Deaths'],
		selectedData: 'Confirmed Cases',
		selectedTitle: 'Confirmed Cases',
		regions: [
		'Cities','Countries','Regions','ONS','GOV',
		'---------------',
		'London','Sydney','Johannesburg','Chicago','Mexico City','Montreal','Santiago','Lima',
		'---------------',
		'North America','South America','Latin America','Europe','EU','Balkans','Middle East','Africa','Asia','Oceania',
		'---------------',
		'Governance','Full Democracies','Flawed Democracies','Hybrid Regimes','Less Authoritarian','More Authoritarian',
		'---------------',
		'USA (34,945,468)','India (31,613,993)','Brazil (19,880,273)','Russia (6,161,985)','France (6,020,331)','UK (5,830,774)','Colombia (4,776,291)','Italy (4,343,519)','Germany (3,777,236)','Mexico (2,829,443)','Peru (2,108,595)','Netherlands (1,862,586)','Czechia (1,673,429)','Chile (1,614,629)','Canada (1,438,009)','Saudi Arabia (522,108)','Denmark (316,068)','South Korea (198,345)','China (105,010)','Australia (34,130)','New Zealand (2,870)',
		'------USA------','Sunbelt (14,452,111)','South (13,793,553)','West (7,652,985)','Midwest (7,572,414)','Northeast (5,850,243)','California (3,958,037)','Texas (3,135,238)','Florida (2,634,882)','New York (2,147,679)','Illinois (1,426,092)','Pennsylvania (1,229,013)','Georgia (1,180,791)','Ohio (1,129,109)','North Carolina (1,055,135)','New Jersey (1,042,223)','Michigan (1,012,838)','Arizona (925,204)','Tennessee (905,981)','Indiana (771,493)','Missouri (753,323)','Massachusetts (719,780)','Virginia (694,944)','Wisconsin (687,263)','South Carolina (617,153)','Minnesota (612,970)','Alabama (577,463)','Colorado (575,284)','Louisiana (549,191)','Kentucky (483,809)','Oklahoma (483,643)','Washington (474,425)','Maryland (467,969)','Utah (432,641)','Arkansas (385,166)','Iowa (380,174)','Nevada (356,670)','Connecticut (354,335)','Mississippi (343,594)','Kansas (333,871)','Nebraska (228,470)','Oregon (219,757)','New Mexico (210,416)','Idaho (201,539)','West Virginia (167,055)','Rhode Island (158,705)','South Dakota (125,232)','Montana (116,376)','North Dakota (111,579)','Delaware (111,539)','New Hampshire (103,187)','Alaska (75,487)','Maine (70,392)','Wyoming (65,200)','Hawaii (41,949)','Vermont (24,929)',
		'-----INDIA-----','Maharashtra (6,296,756)','Kerala (3,370,137)','Karnataka (2,903,137)','Tamil Nadu (2,557,611)','Andhra Pradesh (1,964,117)','Uttar Pradesh (1,708,410)','West Bengal (1,527,250)','Chhattisgarh (1,001,906)','Odisha (975,690)','Rajasthan (953,650)','Gujarat (824,849)','Madhya Pradesh (791,806)','Haryana (769,884)','Bihar (724,791)','Punjab (599,053)','Jharkhand (347,111)','Uttarakhand (342,023)','Jammu and Kashmir (321,344)','Himachal Pradesh (205,874)','Puducherry (120,817)','Tripura (78,056)','Meghalaya (64,266)','Arunachal Pradesh (47,857)','Mizoram (37,171)','Nagaland (27,676)','Ladakh (20,328)','Ladakh (20,328)','Dadra and NHDD (10,507)',
		'-----BRAZIL----','Sao Paulo State (4,048,478)','Minas Gerais (1,960,215)','Parana (1,376,644)','Para (1,376,644)','Rio Grande Sul (1,363,467)','Bahia (1,192,293)','Santa Catarina (1,112,332)','Rio de Janeiro State (1,029,016)','Ceara (918,377)','Goias (740,765)','Pernambuco (589,843)','Espirito Santo (542,600)','Mato Grosso (486,683)','Paraiba (421,585)','Amazonas (416,375)','Rio Grande Norte (359,378)','Mato Grosso Sul (355,303)','Maranhao (336,777)','Piaui (309,345)','Sergipe (274,024)','Rondonia (257,769)','Alagoas (229,647)','Tocantins (209,773)','Amapa (121,156)','Roraima (119,828)','Acre (87,128)',
		'-----RUSSIA----','Central (2,630,411)','Northwestern (1,007,367)','Volga (769,388)','Siberian (504,125)','Southern (403,031)','Ural (360,627)','Eastern (359,975)','Caucasian (207,142)',
		'-----FRANCE----','Ile-de-France (121,905)','Auvergne-Rhone-Alpes (63,745)','Provence-Alpes-Cote d’Azur (49,466)','Grand Est (48,832)','Hauts-de-France (48,109)','Occitanie (26,963)','Bourgogne-Franche-Comte (24,935)','Nouvelle-Aquitaine (21,391)','Normandie (18,135)','Pays de la Loire (16,181)','Centre-Val de Loire (15,356)','Bretagne (9,818)','Corse (1,194)',
		'-------UK------','England (5,109,035)','Scotland (342,704)','Wales (240,843)',
		'----COLOMBIA---','Antioquia (712,565)','Atlantico (307,378)','Cundinamarca (256,119)','Santander (218,499)','Bolivar (150,514)','Tolima (104,540)','Boyaca (102,478)','Cordoba (98,895)','Caldas (97,989)','Magdalena (88,313)','Narino (86,415)','Cesar (86,403)','Norte Santander (86,136)','Risaralda (85,231)','Meta (85,227)','Huila (85,150)','Valle (59,387)','Sucre (57,357)','Quindio (54,218)','Cauca (51,700)','Guajira (41,342)','Casanare (33,999)','Caqueta (22,066)','Choco (15,938)','Putumayo (15,356)','Arauca (12,707)','Amazonas Department (6,601)','Guaviare (5,008)','Vaupes (1,723)',
		'-----MEXICO----','Mexico State (290,172)','Nuevo Leon (141,774)','Guanajuato (138,447)','Jalisco (104,946)','Puebla (90,747)','Sonora (88,205)','Tabasco (86,776)','Veracruz (79,456)','Queretaro (73,939)','Coahuila (72,745)','Tamaulipas (72,609)','Chihuahua (60,164)','Sinaloa (56,867)','Oaxaca (54,881)','Yucatan (54,150)','Michoacan (53,394)','Baja California (52,600)','Guerrero (50,980)','Baja California Sur (48,958)','Hidalgo (44,090)','Durango (37,252)','Morelos (36,903)','Zacatecas (33,069)','Aguascalientes (27,828)','Tlaxcala (21,122)','Nayarit (18,495)','Colima (15,650)','Campeche (14,482)','Chiapas (14,193)',
		'------PERU-----','Lima Province (784,672)','Lima Region (138,899)','Arequipa Region (109,125)','Callao (98,353)','La Libertad (85,560)','Piura Region (84,528)','Junin (81,596)','Ancash (74,698)','Cusco (70,266)','Cajamarca (63,886)','Lambayeque (58,758)','Ica (56,267)','San Martin (47,421)','Loreto (43,948)','Puno (37,125)','Huanuco (34,680)','Ucayali (31,860)','Ayacucho (31,857)','Amazonas Region (30,709)','Tacna (29,014)','Moquegua (28,251)','Apurimac (25,459)','Tumbes (17,903)','Huancavelica (15,633)','Pasco (15,170)','Madre de Dios (13,656)',
		'--NETHERLANDS--','Zuid-Holland (444,683)','Noord-Holland (319,918)','Noord-Brabant (298,849)','Gelderland (207,105)','Limburg (124,130)','Overijssel (120,814)','Groningen (45,961)','Flevoland (39,935)','Utrecht (39,658)','Drenthe (36,773)','Zeeland (31,995)','Friesland (16,252)',
		'-----CHILE-----','Biobio (148,012)','Valparaiso (119,958)','Maule (99,320)','Araucania (96,379)','Los Lagos (87,212)','O’Higgins (67,273)','Antofagasta (59,519)','Los Rios (48,203)','Coquimbo (47,423)','Tarapaca (40,184)','Nuble (35,172)','Magallanes (29,114)','Atacama (26,613)','Arica y Parinacota (26,256)','Aysen (8,049)',
		'-----CANADA----','Ontario (557,703)','Quebec (377,297)','Alberta (234,295)','British Columbia (149,889)','Manitoba (57,593)','Saskatchewan (49,940)','Nova Scotia (5,887)','New Brunswick (2,365)','Newfoundland (1,437)',
		'----DENMARK----','Hovedstaden (148,457)','Midtjylland (56,382)','Syddanmark (43,725)','Sjaelland (41,191)','Nordjylland (23,240)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (125,948)','Ar Riyad (125,821)','Eastern Region (114,732)','Aseer (39,078)','Al Madinah Al Munawwarah (38,089)','Al Qaseem (20,092)','Jazan Province (19,189)','Hail Province (10,964)','Najran Province (9,771)','Tabuk Province (8,013)','Al Bahah (6,821)','Northern Borders (4,832)','Al Jawf (2,380)',
		'---------------',
		'Locations'],
		selectedRegion: 'Cities',
		sliderSelected: false,
		day: 7,
		lookbackTime: 7,
		scale: ['Logarithmic Scale','Linear Scale'],
		selectedScale: 'Logarithmic Scale',
		minCasesInCountry: 50,
		dates: [],
		covidData: [],
		countries: [],
		visibleCountries: [], // used for search
		selectedCountries: [], // used to manually select countries 
		defaultCountries: [], // used for createURL default check
		isHidden: true,
		showLabels: true,
		showTrendLine: true,
		doublingTime: 2,
		mySelect: '',
		searchField: '',
		autoplay: true,
		futurePause: true,
		firstLoad: true,
		graphAttributes: {
			mounted: false,
			innerWidth: NaN,
			innerHeight: NaN,
			width: NaN,
			height: NaN,
			referenceLineAngle: NaN
		},
	}
});
