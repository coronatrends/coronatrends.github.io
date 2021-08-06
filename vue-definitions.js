"use strict";
// custom graph component

var point = {
'Aguascalientes':525,'Amazonas Region':561,'Ancash':561,'Antofagasta':559,'Apurimac':561,'Araucania':559,'Arequipa Region':561,'Arica Y Parinacota':559,'Atacama':559,'Ayacucho':561,'Aysen':559,'Baja California':525,'Baja California Sur':525,'Biobio':559,'Cajamarca':561,'Callao':561,'Campeche':525,'Chiapas':525,'Chihuahua':525,'Chile':559,'Coahuila':525,'Colima':525,'Coquimbo':559,'Cusco':561,'Denmark':19,'Durango':525,'England':561,'Guanajuato':525,'Guerrero':525,'Hidalgo':525,'Hovedstaden':19,'Huancavelica':561,'Huanuco':561,'ICA':561,'Jalisco':525,'Junin':561,'La Libertad':561,'Lambayeque':561,'Lima':561,'Lima Province':561,'Lima Region':561,'London':561,'Loreto':561,'Los Lagos':559,'Los Rios':559,'Madrede Dios':561,'Magallanes':559,'Maule':559,'Mexico':525,'Mexico City':525,'Mexico State':525,'Michoacan':525,'Midtjylland':19,'Moquegua':561,'Morelos':525,'Nayarit':525,'Nordjylland':19,'Nuble':559,'Nuevo Leon':525,'O Higgins':559,'Oaxaca':525,'Pasco':561,'Peru':561,'Piura Region':561,'Puebla':525,'Puno':561,'Queretaro':525,'San Martin':561,'Santiago':559,'Saudi Arabia':561,'Sinaloa':525,'Sjaelland':19,'Sonora':525,'Syddanmark':19,'Tabasco':525,'Tacna':561,'Tamaulipas':525,'Tarapaca':559,'Tlaxcala':525,'Tumbes':561,'Ucayali':561,'UK':561,'Valparaiso':559,'Veracruz':525,'Wales':561,'Yucatan':525,'Zacatecas':525,
'default':562
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
		'USA (35,440,488)','India (31,856,757)','Brazil (20,066,587)','Russia (6,296,570)','France (6,137,948)','UK (5,982,581)','Colombia (4,821,603)','Italy (4,377,188)','Germany (3,789,460)','Mexico (2,922,663)','Peru (2,121,061)','Netherlands (1,878,214)','Czechia (1,674,410)','Chile (1,620,389)','Canada (1,443,765)','Saudi Arabia (526,814)','Denmark (321,154)','South Korea (207,406)','China (105,600)','Australia (35,700)','New Zealand (2,880)',
		'------USA------','Sunbelt (14,699,278)','South (14,047,032)','West (7,776,134)','Midwest (7,644,604)','Northeast (5,893,778)','California (4,020,285)','Texas (3,202,735)','Florida (2,634,882)','New York (2,165,204)','Illinois (1,439,783)','Pennsylvania (1,236,889)','Georgia (1,206,523)','Ohio (1,138,235)','North Carolina (1,073,655)','New Jersey (1,049,212)','Michigan (1,015,789)','Arizona (937,971)','Tennessee (922,164)','Indiana (779,510)','Missouri (770,269)','Massachusetts (725,189)','Virginia (703,177)','Wisconsin (693,995)','South Carolina (631,042)','Minnesota (617,055)','Alabama (599,633)','Colorado (580,806)','Louisiana (575,293)','Oklahoma (498,521)','Kentucky (493,579)','Washington (487,351)','Maryland (471,341)','Utah (437,759)','Arkansas (397,238)','Iowa (383,721)','Nevada (362,544)','Connecticut (357,345)','Mississippi (356,144)','Kansas (338,331)','Nebraska (230,256)','Oregon (225,921)','New Mexico (213,247)','Idaho (204,466)','West Virginia (168,771)','Rhode Island (159,681)','South Dakota (125,606)','Montana (117,617)','Delaware (112,334)','North Dakota (112,054)','New Hampshire (103,984)','Alaska (77,253)','Maine (71,015)','Wyoming (66,273)','Hawaii (44,641)','Vermont (25,259)',
		'-----INDIA-----','Maharashtra (6,336,220)','Kerala (3,493,603)','Karnataka (2,913,512)','Tamil Nadu (2,569,398)','Andhra Pradesh (1,976,141)','Uttar Pradesh (1,708,649)','West Bengal (1,531,662)','Chhattisgarh (1,002,849)','Odisha (983,523)','Rajasthan (953,773)','Gujarat (824,977)','Madhya Pradesh (791,919)','Haryana (770,027)','Bihar (725,067)','Punjab (599,304)','Jharkhand (347,278)','Uttarakhand (342,307)','Jammu and Kashmir (322,142)','Himachal Pradesh (207,088)','Puducherry (121,335)','Tripura (79,529)','Meghalaya (67,544)','Arunachal Pradesh (49,442)','Mizoram (42,083)','Nagaland (28,298)','Ladakh (20,369)','Ladakh (20,369)','Dadra and NHDD (10,515)',
		'-----BRAZIL----','Sao Paulo State (4,094,211)','Minas Gerais (1,985,928)','Parana (1,391,877)','Para (1,391,877)','Rio Grande Sul (1,376,188)','Bahia (1,199,008)','Santa Catarina (1,120,003)','Rio de Janeiro State (1,044,535)','Ceara (921,483)','Goias (754,381)','Pernambuco (594,106)','Espirito Santo (545,783)','Mato Grosso (492,972)','Paraiba (424,154)','Amazonas (418,439)','Rio Grande Norte (360,441)','Mato Grosso Sul (358,410)','Maranhao (339,339)','Piaui (310,883)','Sergipe (275,333)','Rondonia (259,013)','Alagoas (231,225)','Tocantins (211,858)','Amapa (121,542)','Roraima (120,590)','Acre (87,291)',
		'-----RUSSIA----','Central (2,674,297)','Northwestern (1,029,839)','Volga (789,659)','Siberian (518,746)','Southern (415,182)','Ural (370,249)','Eastern (369,342)','Caucasian (212,590)',
		'-----FRANCE----','Ile-de-France (122,380)','Auvergne-Rhone-Alpes (63,995)','Provence-Alpes-Cote d’Azur (49,897)','Grand Est (48,960)','Hauts-de-France (48,373)','Occitanie (27,294)','Bourgogne-Franche-Comte (25,011)','Nouvelle-Aquitaine (21,574)','Normandie (18,242)','Pays de la Loire (16,237)','Centre-Val de Loire (15,395)','Bretagne (9,881)','Corse (1,226)',
		'-------UK------','England (5,225,224)','Scotland (349,286)','Wales (244,538)',
		'----COLOMBIA---','Antioquia (719,510)','Atlantico (309,357)','Cundinamarca (258,672)','Santander (220,381)','Bolivar (151,958)','Tolima (105,550)','Boyaca (103,356)','Cordoba (100,691)','Caldas (98,623)','Magdalena (89,132)','Narino (87,245)','Norte Santander (87,155)','Cesar (86,924)','Huila (86,208)','Meta (86,087)','Risaralda (85,934)','Valle (59,649)','Sucre (57,903)','Quindio (54,768)','Cauca (52,846)','Guajira (41,580)','Casanare (34,511)','Caqueta (22,232)','Choco (16,070)','Putumayo (15,607)','Arauca (12,856)','Amazonas Department (6,652)','Guaviare (5,042)','Vaupes (1,730)',
		'-----MEXICO----','Mexico State (299,839)','Nuevo Leon (147,299)','Guanajuato (140,597)','Jalisco (110,504)','Puebla (92,803)','Sonora (90,477)','Tabasco (89,990)','Veracruz (83,523)','Queretaro (74,801)','Tamaulipas (74,529)','Coahuila (74,196)','Chihuahua (60,699)','Sinaloa (59,525)','Oaxaca (56,840)','Yucatan (55,378)','Michoacan (55,253)','Guerrero (54,719)','Baja California (53,166)','Baja California Sur (50,280)','Hidalgo (45,757)','Durango (38,581)','Morelos (37,708)','Zacatecas (33,979)','Aguascalientes (28,361)','Tlaxcala (21,649)','Nayarit (20,990)','Colima (17,413)','Chiapas (15,570)','Campeche (15,221)',
		'------PERU-----','Lima Province (787,696)','Lima Region (139,170)','Arequipa Region (111,276)','Callao (98,597)','La Libertad (85,802)','Piura Region (84,755)','Junin (82,091)','Ancash (74,960)','Cusco (70,893)','Cajamarca (64,101)','Lambayeque (60,013)','Ica (56,791)','San Martin (47,630)','Loreto (44,394)','Puno (37,388)','Huanuco (34,806)','Ayacucho (32,072)','Ucayali (31,902)','Amazonas Region (30,808)','Tacna (29,194)','Moquegua (28,549)','Apurimac (25,543)','Tumbes (17,988)','Huancavelica (15,695)','Pasco (15,255)','Madre de Dios (13,692)',
		'--NETHERLANDS--','Zuid-Holland (448,605)','Noord-Holland (322,928)','Noord-Brabant (301,158)','Gelderland (208,621)','Limburg (125,164)','Overijssel (121,798)','Groningen (46,384)','Flevoland (40,401)','Utrecht (39,906)','Drenthe (37,030)','Zeeland (32,284)','Friesland (16,252)',
		'-----CHILE-----','Biobio (148,659)','Valparaiso (120,603)','Maule (99,822)','Araucania (96,872)','Los Lagos (87,597)','O’Higgins (67,495)','Antofagasta (59,710)','Los Rios (48,580)','Coquimbo (47,709)','Tarapaca (40,352)','Nuble (35,357)','Magallanes (29,138)','Atacama (26,773)','Arica y Parinacota (26,358)','Aysen (8,059)',
		'-----CANADA----','Ontario (558,918)','Quebec (378,462)','Alberta (235,641)','British Columbia (151,375)','Manitoba (57,739)','Saskatchewan (50,251)','Nova Scotia (5,899)','New Brunswick (2,409)','Newfoundland (1,441)',
		'----DENMARK----','Hovedstaden (597)','Midtjylland (295)','Syddanmark (256)','Sjaelland (208)','Nordjylland (103)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (127,011)','Ar Riyad (126,826)','Eastern Region (115,557)','Aseer (39,593)','Al Madinah Al Munawwarah (38,418)','Al Qaseem (20,383)','Jazan Province (19,641)','Hail Province (11,196)','Najran Province (9,942)','Tabuk Province (8,164)','Al Bahah (6,897)','Northern Borders (4,934)','Al Jawf (2,419)',
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
