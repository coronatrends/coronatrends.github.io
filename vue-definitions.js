"use strict";
// custom graph component

var point = {
'Aguascalientes':531,'Amazonas Department':547,'Amazonas Region':547,'Ancash':547,'Antioquia':547,'Antofagasta':545,'Apurimac':547,'Arauca':547,'Araucania':545,'Arequipa Region':547,'Arica Y Parinacota':545,'Atacama':545,'Atlantico':547,'Ayacucho':547,'Aysen':545,'Baja California':531,'Baja California Sur':531,'Biobio':545,'Bolivar':547,'Boyaca':547,'Cajamarca':547,'Caldas':547,'Callao':547,'Campeche':531,'Caqueta':547,'Casanare':547,'Cauca':547,'Cesar':547,'Chiapas':531,'Chihuahua':531,'Chile':545,'Choco':547,'Coahuila':531,'Colima':531,'Colombia':547,'Coquimbo':545,'Cordoba':547,'Cundinamarca':547,'Cusco':547,'Durango':531,'England':547,'Guainia':547,'Guajira':547,'Guanajuato':531,'Guaviare':547,'Guerrero':531,'Hidalgo':531,'Huancavelica':547,'Huanuco':547,'Huila':547,'ICA':547,'Jalisco':531,'Junin':547,'La Libertad':547,'Lambayeque':547,'Lima':547,'Lima Province':547,'London':547,'Loreto':547,'Los Lagos':545,'Los Rios':545,'Madrede Dios':547,'Magallanes':545,'Magdalena':547,'Maule':545,'Meta':547,'Mexico':531,'Mexico City':531,'Mexico State':531,'Michoacan':531,'Moquegua':547,'Morelos':531,'Narino':547,'Nayarit':531,'Norte Santander':547,'Nuble':545,'Nuevo Leon':531,'O Higgins':545,'Oaxaca':531,'Pasco':547,'Peru':547,'Piura Region':547,'Puebla':531,'Puno':547,'Putumayo':547,'Queretaro':531,'Quindio':547,'Risaralda':547,'San Andres':547,'San Martin':547,'Santander':547,'Santiago':545,'Saudi Arabia':547,'Sinaloa':531,'Sonora':531,'Sucre':547,'Tabasco':531,'Tacna':547,'Tamaulipas':531,'Tarapaca':545,'Tlaxcala':531,'Tolima':547,'Tumbes':547,'Ucayali':547,'UK':546,'Valle':547,'Valparaiso':545,'Vaupes':547,'Veracruz':531,'Vichada':547,'Wales':546,'Yucatan':531,'Zacatecas':531,
'default':548
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
			else if ((e.key == '-' || e.key == '_') && this.dates.length > 0) {
				this.paused = true;
				this.day = Math.max(this.day - 1, this.minDay);
			}
			else if ((e.key == '+' || e.key == '=') && this.dates.length > 0) {
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
		'USA (34,281,864)','India (31,293,062)','Brazil (19,523,711)','Russia (5,979,027)','France (5,863,138)','UK (5,602,321)','Colombia (4,692,570)','Italy (4,302,393)','Germany (3,758,425)','Mexico (2,709,739)','Peru (2,094,445)','Netherlands (1,827,273)','Czechia (1,671,933)','Chile (1,604,713)','Canada (1,432,684)','Saudi Arabia (513,284)','Denmark (309,420)','South Korea (185,733)','China (104,491)','Australia (32,588)','New Zealand (2,855)',
		'------USA------','Sunbelt (14,024,132)','South (13,371,551)','West (7,531,616)','Midwest (7,495,439)','Northeast (5,811,981)','California (3,893,740)','Texas (3,067,166)','Florida (2,450,991)','New York (2,131,898)','Illinois (1,412,935)','Pennsylvania (1,223,040)','Georgia (1,156,657)','Ohio (1,121,422)','North Carolina (1,036,999)','New Jersey (1,035,403)','Michigan (1,006,422)','Arizona (912,724)','Tennessee (892,136)','Indiana (763,886)','Missouri (732,224)','Massachusetts (714,556)','Virginia (688,267)','Wisconsin (681,686)','Minnesota (609,298)','South Carolina (605,608)','Colorado (568,803)','Alabama (565,510)','Louisiana (517,238)','Kentucky (474,951)','Oklahoma (472,043)','Washington (467,208)','Maryland (465,045)','Utah (426,592)','Iowa (378,085)','Arkansas (370,584)','Connecticut (351,828)','Nevada (348,309)','Mississippi (331,953)','Kansas (326,750)','Nebraska (226,626)','Oregon (214,265)','New Mexico (208,243)','Idaho (199,068)','West Virginia (165,565)','Rhode Island (158,123)','South Dakota (124,968)','Montana (115,155)','North Dakota (111,137)','Delaware (110,838)','New Hampshire (102,640)','Alaska (73,379)','Maine (69,806)','Wyoming (64,214)','Hawaii (39,916)','Vermont (24,687)',
		'-----INDIA-----','Maharashtra (6,245,057)','Kerala (3,218,015)','Karnataka (2,889,994)','Tamil Nadu (2,543,040)','Andhra Pradesh (1,948,592)','Uttar Pradesh (1,708,057)','West Bengal (1,521,261)','Chhattisgarh (1,000,763)','Odisha (961,934)','Rajasthan (953,462)','Gujarat (824,607)','Madhya Pradesh (791,721)','Haryana (769,665)','Bihar (724,230)','Punjab (598,590)','Jharkhand (346,820)','Uttarakhand (341,629)','Jammu and Kashmir (320,340)','Himachal Pradesh (204,800)','Puducherry (120,005)','Tripura (75,096)','Meghalaya (59,298)','Arunachal Pradesh (44,709)','Mizoram (29,645)','Nagaland (26,987)','Ladakh (20,284)','Ladakh (20,284)','Dadra and NHDD (10,487)',
		'-----BRAZIL----','Sao Paulo State (3,979,102)','Minas Gerais (1,921,230)','Parana (1,355,387)','Para (1,355,387)','Rio Grande Sul (1,279,550)','Bahia (1,180,732)','Santa Catarina (1,098,579)','Rio de Janeiro State (1,008,623)','Ceara (911,021)','Goias (719,410)','Pernambuco (582,849)','Espirito Santo (537,509)','Mato Grosso (476,808)','Paraiba (416,261)','Amazonas (413,146)','Rio Grande Norte (355,349)','Mato Grosso Sul (350,611)','Maranhao (332,315)','Piaui (306,574)','Sergipe (272,220)','Rondonia (255,454)','Alagoas (227,121)','Tocantins (206,619)','Amapa (120,403)','Roraima (118,036)','Acre (86,844)',
		'-----RUSSIA----','Central (2,566,583)','Northwestern (976,748)','Volga (744,074)','Siberian (484,366)','Southern (387,245)','Ural (348,325)','Eastern (347,327)','Caucasian (200,043)',
		'-----FRANCE----','Ile-de-France (121,402)','Auvergne-Rhone-Alpes (63,559)','Provence-Alpes-Cote d’Azur (49,077)','Grand Est (48,689)','Hauts-de-France (47,872)','Occitanie (26,616)','Bourgogne-Franche-Comte (24,775)','Nouvelle-Aquitaine (21,213)','Normandie (18,027)','Pays de la Loire (16,113)','Centre-Val de Loire (15,321)','Bretagne (9,758)','Corse (1,172)',
		'-------UK------','England (4,879,677)','Wales (456,428)','Scotland (332,455)',
		'----COLOMBIA---','Antioquia (698,366)','Atlantico (303,669)','Cundinamarca (250,785)','Santander (214,108)','Bolivar (147,371)','Tolima (102,615)','Boyaca (100,468)','Caldas (96,767)','Cordoba (95,865)','Magdalena (86,650)','Cesar (85,256)','Narino (84,849)','Norte Santander (83,773)','Risaralda (83,573)','Meta (83,345)','Huila (82,897)','Valle (58,735)','Sucre (56,180)','Quindio (53,211)','Cauca (49,297)','Guajira (40,977)','Casanare (33,221)','Caqueta (21,705)','Choco (15,678)','Putumayo (14,908)','Arauca (12,241)','Amazonas Department (6,538)','Guaviare (4,943)','Vaupes (1,713)',
		'-----MEXICO----','Mexico State (277,338)','Guanajuato (135,987)','Nuevo Leon (135,096)','Jalisco (97,405)','Puebla (88,688)','Sonora (85,172)','Tabasco (83,489)','Veracruz (74,079)','Queretaro (72,258)','Coahuila (71,364)','Tamaulipas (70,680)','Chihuahua (59,223)','Yucatan (52,364)','Sinaloa (52,327)','Oaxaca (52,217)','Baja California (51,884)','Michoacan (51,248)','Guerrero (46,704)','Baja California Sur (46,693)','Hidalgo (42,005)','Morelos (36,022)','Durango (35,965)','Zacatecas (32,088)','Aguascalientes (27,303)','Tlaxcala (20,603)','Nayarit (15,422)','Colima (13,756)','Campeche (13,651)','Chiapas (13,352)',
		'------PERU-----','Lima Province (920,791)','Arequipa Region (107,906)','Callao (98,117)','La Libertad (85,225)','Piura Region (84,238)','Junin (81,112)','Ancash (74,416)','Cusco (69,752)','Cajamarca (63,535)','Lambayeque (58,493)','Ica (56,031)','San Martin (47,143)','Loreto (43,496)','Puno (36,739)','Huanuco (34,439)','Ucayali (31,819)','Ayacucho (31,641)','Amazonas Region (30,579)','Tacna (28,810)','Moquegua (27,868)','Apurimac (25,340)','Tumbes (17,789)','Huancavelica (15,538)','Pasco (15,078)','Madre de Dios (13,627)','Lima Region ()',
		'--NETHERLANDS--','Zuid-Holland (436,703)','Noord-Holland (313,034)','Noord-Brabant (292,978)','Gelderland (203,202)','Limburg (121,606)','Overijssel (118,826)','Groningen (44,948)','Flevoland (39,087)','Utrecht (38,972)','Drenthe (36,278)','Zeeland (31,509)','Friesland (16,252)',
		'-----CHILE-----','Biobio (147,117)','Valparaiso (119,097)','Maule (98,767)','Araucania (95,815)','Los Lagos (86,713)','O’Higgins (66,926)','Antofagasta (58,996)','Los Rios (47,614)','Coquimbo (46,993)','Tarapaca (39,835)','Nuble (34,960)','Magallanes (29,081)','Atacama (26,289)','Arica y Parinacota (26,126)','Aysen (8,024)',
		'-----CANADA----','Ontario (556,282)','Quebec (376,519)','Alberta (233,062)','British Columbia (148,730)','Manitoba (57,322)','Saskatchewan (49,556)','Nova Scotia (5,880)','New Brunswick (2,347)','Newfoundland (1,437)',
		'----DENMARK----','Hovedstaden (146,053)','Midtjylland (54,858)','Syddanmark (42,868)','Sjaelland (40,736)','Nordjylland (22,591)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (123,847)','Ar Riyad (123,435)','Eastern Region (112,858)','Aseer (38,004)','Al Madinah Al Munawwarah (37,526)','Al Qaseem (19,338)','Jazan Province (18,335)','Hail Province (10,453)','Najran Province (9,353)','Tabuk Province (7,794)','Al Bahah (6,588)','Northern Borders (4,597)','Al Jawf (2,318)',
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
