"use strict";
// custom graph component

var point = {
'Acre':286,'Aguascalientes':288,'Alagoas':286,'Amapa':286,'Amazonas':286,'Amazonas Region':291,'Ancash':291,'Antofagasta':290,'Apurimac':291,'Araucania':290,'Arequipa Region':291,'Arica Y Parinacota':290,'Atacama':290,'Austria':288,'Ayacucho':291,'Aysen':290,'Bahia':286,'Baja California':288,'Baja California Sur':288,'Belgium':288,'Biobio':290,'Brazil':286,'Cajamarca':291,'Callao Province':291,'Campeche':288,'Canada':256,'Ceara':286,'Chiapas':288,'Chihuahua':288,'Chile':290,'Coahuila':288,'Colima':288,'Coquimbo':290,'Cusco':291,'Czechia':288,'Durango':288,'England':290,'Espirito Santo':286,'Germany':288,'Goias':286,'Guanajuato':288,'Guerrero':288,'Hidalgo':288,'Huancavelica':291,'Huanuco':291,'ICA':291,'Ireland':288,'Jalisco':288,'Japan':203,'Johannesburg':290,'Junin':291,'La Libertad':291,'Lambayeque':291,'Latvia':222,'Lima':291,'Lima Province':291,'Lima Region':291,'Lithuania':263,'Locations':286,'London':290,'Loreto':291,'Los Lagos':290,'Los Rios':290,'Madrede Dios':291,'Magallanes':290,'Maranhao':286,'Mato Grosso':286,'Mato Grosso Sul':286,'Maule':290,'Mexico':288,'Mexico City':288,'Mexico State':288,'Michoacan':288,'Minas Gerais':286,'Moquegua':291,'Morelos':288,'Nayarit':288,'Nigeria':284,'Nuble':290,'Nuevo Leon':288,'O Higgins':290,'Oaxaca':288,'Para':286,'Paraiba':286,'Parana':286,'Pasco':291,'Pernambuco':286,'Peru':291,'Piaui':286,'Piura Region':291,'Poland':288,'Puebla':288,'Puno':291,'Queretaro':288,'Quintana Roo':288,'Rio De Janeiro State':286,'Rio Grande Norte':286,'Rio Grande Sul':286,'Rondonia':286,'Roraima':286,'San Luis Potosi':288,'San Martin':291,'Santa Catarina':286,'Santiago':290,'Sao Paulo State':286,'Sergipe':286,'Sinaloa':288,'Slovenia':288,'Sonora':288,'South Africa':288,'South Korea':288,'Spain':127,'Sweden':288,'Switzerland':288,'Tabasco':288,'Tacna':291,'Tamaulipas':288,'Tarapaca':290,'Tlaxcala':288,'Tocantins':286,'Tumbes':291,'Ucayali':291,'UK':290,'Valparaiso':290,'Veracruz':288,'Wales':290,'Yucatan':288,'Zacatecas':288,
'default':293
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
			'Brazil','USA','United Kingdom','Japan','United Arab Emirates','SouthAfrica','Australia','Argentina','France','China','Turkey','Nigeria','New Zealand','Colombia','Mexico','Germany','Singapore','Saudi Arabia','Morocco','Chile','Canada','Italy','Israel','Tunisia','Taiwan','Venezuela', 'Spain','India','Egypt','Uganda'
			]
			const selectAll = ['Europe','Lima','Flawed Democracies','Hybrid Regimes','Less Authoritarian','Colombia','Mexico','Nigeria','London','Maharashtra','Bihar','Tamil Nadu','Rajasthan','Madhya Pradesh','Lima Province','Piura Region','Lambayeque','Lima Region','La Libertad','Cajamarca','Arequipa Region','Ica','Gelderland','Zuid-Holland']
			if (this.selectedRegion == 'Locations')
				{this.selectedCountries = ['Barnet','London','England','United Kingdom','Western Europe','European Union','Europe','World'];}
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
		'Cities','Countries','Regions','ONS',
		'---------------',
		'London','Sydney','Johannesburg','Chicago','Mexico City','Seoul','Santiago','Lima',
		'---------------',
		'North America','South America','Latin America','Europe','EU','Balkans','Middle East','Africa','Asia','Oceania',
		'---------------',
		'Governance','Full Democracies','Flawed Democracies','Hybrid Regimes','Less Authoritarian','More Authoritarian',
		'---------------',
		'USA (10,111,077)','India (8,591,730)','Brazil (5,675,032)','France (1,810,653)','Russia (1,781,997)','Argentina (1,250,499)','UK (1,213,363)','Colombia (1,149,064)','Mexico (967,825)','Italy (960,373)','Peru (922,333)','South Africa (738,525)','Germany (689,146)','Poland (568,138)','Chile (522,879)','Belgium (503,182)','Czechia (417,181)','Netherlands (414,745)','Switzerland (229,222)','Canada (166,347)','Austria (158,746)','Sweden (146,461)','China (91,695)','Ireland (65,659)','Nigeria (64,184)','Slovenia (45,625)','Australia (27,672)','New Zealand (1,987)',
		'------USA------','Sunbelt (4,419,738)','South (4,368,016)','Midwest (2,365,148)','West (2,018,689)','Northeast (1,348,799)','Texas (998,267)','California (981,465)','Florida (847,839)','New York (532,629)','Illinois (505,006)','Georgia (427,745)','North Carolina (295,566)','Tennessee (288,431)','Wisconsin (286,654)','New Jersey (260,923)','Arizona (259,707)','Ohio (256,275)','Pennsylvania (239,724)','Michigan (238,692)','Alabama (218,204)','Missouri (216,152)','Indiana (214,702)','Virginia (193,502)','Louisiana (188,519)','South Carolina (186,396)','Minnesota (185,264)','Massachusetts (172,727)','Iowa (159,910)','Maryland (155,378)','Oklahoma (138,527)','Utah (135,046)','Colorado (134,790)','Mississippi (127,294)','Kentucky (123,111)','Arkansas (123,084)','Washington (119,097)','Nevada (111,256)','Kansas (105,167)','Nebraska (85,552)','Connecticut (81,705)','Idaho (75,280)','South Dakota (56,316)','New Mexico (56,291)','North Dakota (55,458)','Oregon (51,157)','Montana (40,181)','Rhode Island (38,009)','West Virginia (28,845)','Delaware (27,308)','Alaska (20,301)','Wyoming (18,087)','Hawaii (16,031)','New Hampshire (12,705)','Maine (7,912)','Vermont (2,465)',
		'-----INDIA-----','Maharashtra (1,723,135)','Karnataka (848,850)','Andhra Pradesh (844,359)','Tamil Nadu (746,079)','Uttar Pradesh (499,190)','Kerala (489,703)','West Bengal (409,221)','Odisha (302,793)','Bihar (223,477)','Rajasthan (213,169)','Chhattisgarh (202,523)','Haryana (185,231)','Gujarat (181,669)','Madhya Pradesh (178,168)','Punjab (137,999)','Jharkhand (104,663)','Jammu and Kashmir (99,352)','Uttarakhand (65,677)','Puducherry (35,902)','Tripura (31,540)','Himachal Pradesh (26,197)','Arunachal Pradesh (15,484)','Meghalaya (10,182)','Nagaland (9,466)','Ladakh (6,934)','Dadra and NHDD (3,266)','Mizoram (3,096)',
		'-----BRAZIL----','Sao Paulo State (1,117,795)','Minas Gerais (360,830)','Bahia (354,576)','Rio de Janeiro State (311,308)','Ceara (274,615)','Santa Catarina (261,543)','Goias (256,161)','Rio Grande Sul (249,437)','Parana (214,450)','Para (214,450)','Maranhao (185,986)','Pernambuco (163,039)','Amazonas (162,139)','Espirito Santo (156,681)','Mato Grosso (143,241)','Paraiba (133,286)','Piaui (113,774)','Alagoas (90,918)','Sergipe (84,491)','Mato Grosso Sul (82,884)','Rio Grande Norte (81,491)','Tocantins (75,648)','Rondonia (71,953)','Roraima (57,488)','Amapa (52,653)','Acre (30,954)',
		'----FRANCE-----','Ile-de-France (52,440)','Grand Est (19,468)','Auvergne-Rhone-Alpes (18,982)','Hauts-de-France (13,968)','Occitanie (7,367)','Bourgogne-Franche-Comte (6,976)','Nouvelle-Aquitaine (5,082)','Pays de la Loire (4,419)','Centre-Val de Loire (4,157)','Normandie (4,125)','Bretagne (2,582)','Corse (473)','Provence-Alpes-Cote d’Azur ()',
		'-----RUSSIA----','Central (770,695)','Volga (229,074)','Northwestern (187,131)','Siberian (172,252)','Ural (133,037)','Southern (115,491)','Eastern (108,672)','Caucasian (79,780)',
		'-------UK------','England (1,023,824)','Scotland (70,732)','Wales (61,019)',
		'----COLOMBIA---','Antioquia (184,553)','Atlantico (73,590)','Santander (45,763)','Cundinamarca (45,288)','Bolivar (34,142)','Cesar (27,371)','Cordoba (27,077)','Huila (26,007)','Meta (24,675)','Norte Santander (23,416)','Narino (23,191)','Tolima (23,000)','Risaralda (19,317)','Valle (18,047)','Magdalena (17,890)','Caldas (17,349)','Boyaca (16,853)','Sucre (15,925)','Cauca (14,055)','Quindio (12,413)','Caqueta (12,102)','Guajira (10,711)','Casanare (5,640)','Putumayo (4,572)','Choco (4,262)','Arauca (3,610)','Amazonas Department (2,957)','Guaviare (1,600)','Vaupes (1,077)',
		'-----MEXICO----','Mexico State (101,140)','Nuevo Leon (56,412)','Guanajuato (51,600)','Sonora (39,311)','Veracruz (37,889)','Puebla (36,592)','Jalisco (36,135)','Coahuila (35,861)','Tabasco (34,889)','Tamaulipas (33,051)','San Luis Potosi (30,344)','Michoacan (26,073)','Baja California (23,944)','Guerrero (22,592)','Sinaloa (22,505)','Oaxaca (22,062)','Yucatan (22,047)','Chihuahua (21,747)','Hidalgo (16,483)','Durango (16,108)','Queretaro (15,413)','Quintana Roo (13,773)','Baja California Sur (13,054)','Zacatecas (12,135)','Aguascalientes (10,638)','Tlaxcala (8,645)','Chiapas (7,586)','Morelos (7,118)','Nayarit (6,851)','Colima (6,798)','Campeche (6,572)',
		'------PERU-----','Lima Province (384,419)','Arequipa Region (45,160)','Piura Region (39,084)','Callao Province (38,597)','La Libertad (33,549)','Lima Region (30,855)','Ica (30,252)','Lambayeque (29,298)','Ancash (27,174)','Junin (24,008)','Loreto (22,966)','Cusco (22,925)','Cajamarca (22,741)','San Martin (22,296)','Ucayali (18,348)','Huanuco (18,033)','Puno (17,624)','Amazonas Region (17,258)','Moquegua (14,651)','Ayacucho (13,638)','Tacna (13,386)','Madre de Dios (8,957)','Tumbes (8,701)','Huancavelica (7,401)','Apurimac (6,008)','Pasco (5,797)',
		'-----CHILE-----','Valparaiso (30,744)','Biobio (30,716)','Antofagasta (21,545)','Maule (19,308)','O’Higgins (18,905)','Los Lagos (16,094)','Araucania (13,503)','Tarapaca (13,101)','Coquimbo (12,744)','Magallanes (12,732)','Arica y Parinacota (9,773)','Atacama (7,910)','Nuble (7,659)','Los Rios (3,993)','Aysen (1,093)',
		'--NETHERLANDS--','Zuid-Holland (120,356)','Noord-Holland (77,007)','Noord-Brabant (64,727)','Gelderland (40,239)','Utrecht (35,380)','Overijssel (23,815)','Limburg (18,878)','Flevoland (7,827)','Groningen (6,724)','Friesland (6,634)','Drenthe (6,044)','Zeeland (4,492)',
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
