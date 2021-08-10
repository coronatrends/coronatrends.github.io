"use strict";
// custom graph component

var point = {
'Aguascalientes':529,'Amazonas Region':565,'Ancash':565,'Antofagasta':559,'Apurimac':565,'Araucania':559,'Arequipa Region':565,'Arica Y Parinacota':559,'Atacama':559,'Ayacucho':565,'Aysen':559,'Baja California':529,'Baja California Sur':529,'Biobio':559,'Cajamarca':565,'Callao':565,'Campeche':529,'Caucasian':183,'Central':183,'Chiapas':529,'Chihuahua':529,'Chile':559,'Coahuila':529,'Colima':529,'Coquimbo':559,'Cusco':565,'Durango':529,'Eastern':183,'England':565,'Guanajuato':529,'Guerrero':529,'Hidalgo':529,'Huancavelica':565,'Huanuco':565,'ICA':565,'Jalisco':529,'Junin':565,'La Libertad':565,'Lambayeque':565,'Lima':565,'Lima Province':565,'Lima Region':565,'London':565,'Loreto':565,'Los Lagos':559,'Los Rios':559,'Madrede Dios':565,'Magallanes':559,'Maule':559,'Mexico':529,'Mexico City':529,'Mexico State':529,'Michoacan':529,'Moquegua':565,'Morelos':529,'Nayarit':529,'Northwestern':183,'Nuble':559,'Nuevo Leon':529,'O Higgins':559,'Oaxaca':529,'Pasco':565,'Peru':565,'Piura Region':565,'Puebla':529,'Puno':565,'Queretaro':529,'Russia':183,'San Martin':565,'Santiago':559,'Siberian':183,'Sinaloa':529,'Sonora':529,'Southern':183,'Tabasco':529,'Tacna':565,'Tamaulipas':529,'Tarapaca':559,'Tlaxcala':529,'Tumbes':565,'Ucayali':565,'UK':565,'Ural':183,'Valparaiso':559,'Veracruz':529,'Volga':183,'Wales':565,'Yucatan':529,'Zacatecas':529,
'default':566
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
		'USA (35,948,131)','India (31,998,158)','Brazil (20,177,757)','Russia (6,384,195)','France (6,208,172)','UK (6,094,243)','Colombia (4,843,007)','Italy (4,400,617)','Germany (3,800,069)','Mexico (2,978,330)','Peru (2,125,848)','Netherlands (1,887,831)','Czechia (1,675,010)','Chile (1,624,316)','Canada (1,449,693)','Saudi Arabia (531,935)','Denmark (324,721)','South Korea (213,987)','China (106,084)','Australia (37,011)','New Zealand (2,902)',
		'------USA------','Sunbelt (15,021,534)','South (14,369,595)','West (7,863,708)','Midwest (7,697,516)','Northeast (5,925,535)','California (4,065,029)','Texas (3,252,074)','Florida (2,769,633)','New York (2,179,081)','Illinois (1,450,682)','Pennsylvania (1,242,724)','Georgia (1,225,431)','Ohio (1,144,901)','North Carolina (1,093,879)','New Jersey (1,054,121)','Michigan (1,023,333)','Arizona (948,280)','Tennessee (935,365)','Indiana (786,465)','Missouri (779,152)','Massachusetts (729,047)','Virginia (709,610)','Wisconsin (697,844)','South Carolina (643,626)','Minnesota (619,161)','Alabama (612,086)','Louisiana (597,933)','Colorado (584,655)','Kentucky (501,193)','Oklahoma (500,314)','Washington (496,150)','Maryland (474,562)','Utah (440,671)','Arkansas (405,272)','Iowa (383,721)','Nevada (366,853)','Mississippi (365,150)','Connecticut (359,363)','Kansas (343,223)','Nebraska (231,089)','Oregon (230,104)','New Mexico (215,098)','Idaho (206,087)','West Virginia (170,238)','Rhode Island (159,681)','South Dakota (125,606)','Montana (118,276)','Delaware (113,229)','North Dakota (112,339)','New Hampshire (104,579)','Alaska (78,441)','Maine (71,330)','Wyoming (67,100)','Hawaii (46,964)','Vermont (25,609)',
		'-----INDIA-----','Maharashtra (6,357,833)','Kerala (3,565,574)','Karnataka (2,919,711)','Tamil Nadu (2,577,237)','Andhra Pradesh (1,983,721)','Uttar Pradesh (1,708,793)','West Bengal (1,534,360)','Chhattisgarh (1,003,244)','Odisha (987,956)','Rajasthan (953,840)','Gujarat (825,063)','Madhya Pradesh (791,970)','Haryana (770,091)','Bihar (725,235)','Punjab (599,514)','Jharkhand (347,380)','Uttarakhand (342,423)','Jammu and Kashmir (322,658)','Himachal Pradesh (208,197)','Puducherry (121,667)','Tripura (80,208)','Meghalaya (69,310)','Arunachal Pradesh (50,373)','Mizoram (44,520)','Nagaland (28,672)','Ladakh (20,400)','Ladakh (20,400)','Dadra and NHDD (10,516)',
		'-----BRAZIL----','Sao Paulo State (4,119,265)','Minas Gerais (1,998,878)','Parana (1,403,372)','Para (1,403,372)','Rio Grande Sul (1,381,971)','Bahia (1,202,820)','Santa Catarina (1,124,632)','Rio de Janeiro State (1,061,793)','Ceara (923,331)','Goias (761,655)','Pernambuco (595,942)','Espirito Santo (547,282)','Mato Grosso (496,059)','Paraiba (425,425)','Amazonas (419,744)','Rio Grande Norte (361,034)','Mato Grosso Sul (360,499)','Maranhao (340,477)','Piaui (311,784)','Sergipe (275,776)','Rondonia (259,832)','Alagoas (231,783)','Tocantins (212,851)','Amapa (121,725)','Roraima (121,043)','Acre (87,422)',
		'-----RUSSIA----','Central (2,707,230)','Northwestern (1,048,278)','Volga (806,906)','Siberian (530,701)','Southern (425,756)','Ural (378,243)','Eastern (376,909)','Caucasian (217,265)',
		'-----FRANCE----','Ile-de-France (122,683)','Auvergne-Rhone-Alpes (64,111)','Provence-Alpes-Cote d’Azur (50,206)','Grand Est (49,032)','Hauts-de-France (48,444)','Occitanie (27,571)','Bourgogne-Franche-Comte (25,084)','Nouvelle-Aquitaine (21,722)','Normandie (18,334)','Pays de la Loire (16,295)','Centre-Val de Loire (15,426)','Bretagne (9,918)','Corse (1,243)',
		'-------UK------','England (5,324,191)','Scotland (354,538)','Wales (247,569)',
		'----COLOMBIA---','Antioquia (723,128)','Atlantico (310,373)','Cundinamarca (259,698)','Santander (221,419)','Bolivar (152,580)','Tolima (106,020)','Boyaca (103,695)','Cordoba (101,284)','Caldas (98,967)','Magdalena (89,879)','Narino (87,583)','Norte Santander (87,568)','Cesar (87,183)','Huila (86,690)','Meta (86,414)','Risaralda (86,298)','Valle (59,784)','Sucre (58,084)','Quindio (55,001)','Cauca (53,435)','Guajira (41,699)','Casanare (34,705)','Caqueta (22,384)','Choco (16,135)','Putumayo (15,705)','Arauca (12,910)','Amazonas Department (6,676)','Guaviare (5,057)','Vaupes (1,733)',
		'-----MEXICO----','Mexico State (304,869)','Nuevo Leon (151,191)','Guanajuato (141,704)','Jalisco (113,373)','Puebla (94,393)','Tabasco (92,364)','Sonora (91,887)','Veracruz (86,359)','Tamaulipas (75,826)','Queretaro (75,823)','Coahuila (75,048)','Chihuahua (61,004)','Sinaloa (60,984)','Oaxaca (57,849)','Guerrero (56,725)','Michoacan (56,560)','Yucatan (56,028)','Baja California (53,536)','Baja California Sur (50,816)','Hidalgo (46,841)','Durango (39,155)','Morelos (38,200)','Zacatecas (34,525)','Aguascalientes (28,596)','Nayarit (22,314)','Tlaxcala (22,071)','Colima (18,466)','Chiapas (16,496)','Campeche (15,761)',
		'------PERU-----','Lima Province (789,326)','Lima Region (139,298)','Arequipa Region (111,708)','Callao (98,752)','La Libertad (85,920)','Piura Region (84,886)','Junin (82,381)','Ancash (75,118)','Cusco (71,093)','Cajamarca (64,212)','Lambayeque (60,147)','Ica (56,940)','San Martin (47,717)','Loreto (44,503)','Puno (37,616)','Huanuco (34,892)','Ayacucho (32,194)','Ucayali (31,914)','Amazonas Region (30,867)','Tacna (29,278)','Moquegua (28,718)','Apurimac (25,601)','Tumbes (18,014)','Huancavelica (15,739)','Pasco (15,308)','Madre de Dios (13,706)',
		'--NETHERLANDS--','Zuid-Holland (450,792)','Noord-Holland (324,869)','Noord-Brabant (302,368)','Gelderland (209,583)','Limburg (125,922)','Overijssel (122,490)','Groningen (46,608)','Flevoland (40,760)','Utrecht (40,099)','Drenthe (37,157)','Zeeland (32,520)','Friesland (16,252)',
		'-----CHILE-----','Biobio (148,659)','Valparaiso (120,603)','Maule (99,822)','Araucania (96,872)','Los Lagos (87,597)','O’Higgins (67,495)','Antofagasta (59,710)','Los Rios (48,580)','Coquimbo (47,709)','Tarapaca (40,352)','Nuble (35,357)','Magallanes (29,138)','Atacama (26,773)','Arica y Parinacota (26,358)','Aysen (8,059)',
		'-----CANADA----','Ontario (560,401)','Quebec (379,439)','Alberta (237,027)','British Columbia (152,918)','Manitoba (57,860)','Saskatchewan (50,614)','Nova Scotia (5,907)','New Brunswick (2,439)','Newfoundland (1,443)',
		'----DENMARK----','Hovedstaden (152,211)','Midtjylland (58,615)','Syddanmark (45,313)','Sjaelland (42,037)','Nordjylland (24,400)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (127,811)','Ar Riyad (127,517)','Eastern Region (116,226)','Aseer (40,032)','Al Madinah Al Munawwarah (38,664)','Al Qaseem (20,697)','Jazan Province (20,055)','Hail Province (11,360)','Najran Province (10,117)','Tabuk Province (8,256)','Al Bahah (6,971)','Northern Borders (5,001)','Al Jawf (2,469)',
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
