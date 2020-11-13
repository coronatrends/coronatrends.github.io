"use strict";
// custom graph component

var point = {
'Acre':286,'Aguascalientes':290,'Alagoas':286,'Amapa':286,'Amazonas':286,'Amazonas Region':293,'Ancash':293,'Antofagasta':293,'Apurimac':293,'Araucania':293,'Arequipa Region':293,'Arica Y Parinacota':293,'Atacama':293,'Australia':295,'Austria':288,'Ayacucho':293,'Aysen':293,'Bahia':286,'Baja California':290,'Baja California Sur':290,'Belgium':288,'Biobio':293,'Brazil':286,'Cajamarca':293,'Callao Province':293,'Campeche':290,'Ceara':286,'Chiapas':290,'Chihuahua':290,'Chile':293,'Coahuila':290,'Colima':290,'Coquimbo':293,'Cusco':293,'Czechia':288,'Durango':290,'England':294,'Espirito Santo':286,'Goias':286,'Guanajuato':290,'Guerrero':290,'Hidalgo':290,'Huancavelica':293,'Huanuco':293,'ICA':293,'Ireland':288,'Jalisco':290,'Japan':203,'Junin':293,'La Libertad':293,'Lambayeque':293,'Latvia':222,'Lima':293,'Lima Province':293,'Lima Region':293,'Lithuania':263,'Locations':286,'London':294,'Loreto':293,'Los Lagos':293,'Los Rios':293,'Madrede Dios':293,'Magallanes':293,'Maranhao':286,'Mato Grosso':286,'Mato Grosso Sul':286,'Maule':293,'Mexico':290,'Mexico City':290,'Mexico State':290,'Michoacan':290,'Minas Gerais':286,'Moquegua':293,'Morelos':290,'Nayarit':290,'New Zealand':294,'Nigeria':291,'Nuble':293,'Nuevo Leon':290,'O Higgins':293,'Oaxaca':290,'Para':286,'Paraiba':286,'Parana':286,'Pasco':293,'Pernambuco':286,'Peru':293,'Piaui':286,'Piura Region':293,'Poland':288,'Puebla':290,'Puno':293,'Queretaro':290,'Quintana Roo':290,'Rio De Janeiro State':286,'Rio Grande Norte':286,'Rio Grande Sul':286,'Rondonia':286,'Roraima':286,'San Luis Potosi':290,'San Martin':293,'Santa Catarina':286,'Santiago':293,'Sao Paulo State':286,'Sergipe':286,'Sinaloa':290,'Slovenia':288,'Sonora':290,'South Africa':288,'South Korea':288,'Spain':127,'Sweden':288,'Switzerland':288,'Sydney':295,'Tabasco':290,'Tacna':293,'Tamaulipas':290,'Tarapaca':293,'Tlaxcala':290,'Tocantins':286,'Tumbes':293,'Ucayali':293,'UK':294,'Valparaiso':293,'Veracruz':290,'Wales':292,'Yucatan':290,'Zacatecas':290,
'default':296
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
		'USA (10,552,821)','India (8,728,795)','Brazil (5,781,582)','France (1,867,721)','Russia (1,843,678)','UK (1,290,195)','Argentina (1,284,519)','Colombia (1,174,012)','Italy (1,066,401)','Mexico (991,835)','Peru (928,006)','Germany (762,832)','South Africa (744,732)','Poland (641,496)','Chile (526,438)','Belgium (520,393)','Czechia (446,675)','Netherlands (430,453)','Canada (285,923)','Switzerland (250,396)','Austria (181,642)','Sweden (171,365)','China (91,785)','Ireland (66,632)','Nigeria (64,728)','Slovenia (50,870)','Australia (27,678)','New Zealand (1,995)',
		'------USA------','Sunbelt (4,517,478)','South (4,475,213)','Midwest (2,548,211)','West (2,097,461)','Northeast (1,404,712)','Texas (1,024,475)','California (1,004,283)','Florida (863,630)','New York (546,211)','Illinois (542,880)','Georgia (421,583)','Wisconsin (309,785)','North Carolina (304,166)','Tennessee (297,646)','Ohio (275,758)','New Jersey (271,210)','Arizona (266,570)','Michigan (259,594)','Pennsylvania (254,155)','Indiana (231,158)','Missouri (229,719)','Alabama (223,985)','Minnesota (202,227)','Louisiana (198,538)','Virginia (198,046)','South Carolina (190,507)','Massachusetts (180,189)','Iowa (173,404)','Maryland (159,907)','Colorado (147,853)','Oklahoma (144,825)','Utah (143,817)','Mississippi (130,754)','Kentucky (130,073)','Arkansas (128,198)','Washington (123,803)','Nevada (115,149)','Kansas (111,240)','Nebraska (92,554)','Connecticut (86,130)','Idaho (79,331)','New Mexico (60,776)','South Dakota (60,717)','North Dakota (59,175)','Oregon (53,881)','Montana (43,071)','Rhode Island (42,221)','West Virginia (30,934)','Delaware (27,946)','Alaska (21,815)','Wyoming (20,554)','Hawaii (16,558)','New Hampshire (13,475)','Maine (8,420)','Vermont (2,701)',
		'-----INDIA-----','Maharashtra (1,736,329)','Karnataka (855,912)','Andhra Pradesh (849,705)','Tamil Nadu (752,521)','Kerala (508,257)','Uttar Pradesh (505,424)','West Bengal (420,840)','Odisha (305,986)','Bihar (225,500)','Rajasthan (219,327)','Chhattisgarh (207,740)','Haryana (193,111)','Gujarat (184,963)','Madhya Pradesh (180,997)','Punjab (139,869)','Jharkhand (105,468)','Jammu and Kashmir (100,968)','Uttarakhand (67,239)','Puducherry (36,181)','Tripura (31,762)','Himachal Pradesh (28,183)','Arunachal Pradesh (15,701)','Meghalaya (10,464)','Nagaland (9,578)','Ladakh (7,211)','Dadra and NHDD (3,270)','Mizoram (3,242)',
		'-----BRAZIL----','Sao Paulo State (1,117,795)','Minas Gerais (360,830)','Bahia (354,576)','Rio de Janeiro State (311,308)','Ceara (274,615)','Santa Catarina (261,543)','Goias (256,161)','Rio Grande Sul (249,437)','Parana (214,450)','Para (214,450)','Maranhao (185,986)','Pernambuco (163,039)','Amazonas (162,139)','Espirito Santo (156,681)','Mato Grosso (143,241)','Paraiba (133,286)','Piaui (113,774)','Alagoas (90,918)','Sergipe (84,491)','Mato Grosso Sul (82,884)','Rio Grande Norte (81,491)','Tocantins (75,648)','Rondonia (71,953)','Roraima (57,488)','Amapa (52,653)','Acre (30,954)',
		'----FRANCE-----','Ile-de-France (53,715)','Auvergne-Rhone-Alpes (20,388)','Grand Est (19,879)','Hauts-de-France (14,615)','Occitanie (7,789)','Bourgogne-Franche-Comte (7,349)','Nouvelle-Aquitaine (5,388)','Pays de la Loire (4,647)','Normandie (4,385)','Centre-Val de Loire (4,340)','Bretagne (2,706)','Corse (494)','Provence-Alpes-Cote d’Azur ()',
		'-----RUSSIA----','Central (796,190)','Volga (235,940)','Northwestern (197,403)','Siberian (178,264)','Ural (136,458)','Southern (119,179)','Eastern (113,391)','Caucasian (81,743)',
		'-------UK------','England (1,111,975)','Scotland (75,187)','Wales (63,849)',
		'----COLOMBIA---','Antioquia (189,432)','Atlantico (74,049)','Santander (46,810)','Cundinamarca (46,227)','Bolivar (34,490)','Cesar (27,665)','Cordoba (27,275)','Huila (26,518)','Meta (25,175)','Norte Santander (24,056)','Tolima (23,660)','Narino (23,528)','Risaralda (19,868)','Caldas (18,689)','Valle (18,220)','Magdalena (18,110)','Boyaca (17,735)','Sucre (15,999)','Cauca (14,421)','Quindio (13,021)','Caqueta (12,250)','Guajira (10,845)','Casanare (5,807)','Putumayo (4,629)','Choco (4,281)','Arauca (3,712)','Amazonas Department (2,981)','Guaviare (1,651)','Vaupes (1,095)',
		'-----MEXICO----','Mexico State (102,183)','Nuevo Leon (57,927)','Guanajuato (52,574)','Sonora (39,796)','Veracruz (38,102)','Puebla (36,951)','Jalisco (36,677)','Coahuila (36,530)','Tabasco (35,088)','Tamaulipas (33,276)','San Luis Potosi (30,859)','Michoacan (26,355)','Baja California (24,108)','Chihuahua (24,012)','Sinaloa (22,744)','Guerrero (22,711)','Oaxaca (22,492)','Yucatan (22,203)','Hidalgo (16,709)','Durango (16,582)','Queretaro (16,035)','Quintana Roo (13,758)','Baja California Sur (13,186)','Zacatecas (12,605)','Aguascalientes (11,047)','Tlaxcala (8,704)','Chiapas (7,599)','Morelos (7,196)','Nayarit (6,878)','Colima (6,863)','Campeche (6,584)',
		'------PERU-----','Lima Province (385,766)','Arequipa Region (45,233)','Piura Region (39,248)','Callao Province (38,757)','La Libertad (33,775)','Lima Region (30,914)','Ica (30,367)','Lambayeque (29,382)','Ancash (27,361)','Junin (24,114)','Loreto (23,099)','Cusco (23,075)','Cajamarca (22,824)','San Martin (22,474)','Ucayali (18,586)','Huanuco (18,136)','Puno (17,676)','Amazonas Region (17,309)','Moquegua (14,697)','Ayacucho (13,732)','Tacna (13,463)','Madre de Dios (8,982)','Tumbes (8,758)','Huancavelica (7,430)','Apurimac (6,048)','Pasco (5,928)',
		'-----CHILE-----','Biobio (31,414)','Valparaiso (30,972)','Antofagasta (21,654)','Maule (19,568)','O’Higgins (19,049)','Los Lagos (16,736)','Araucania (14,096)','Tarapaca (13,249)','Magallanes (12,977)','Coquimbo (12,777)','Arica y Parinacota (9,873)','Atacama (7,925)','Nuble (7,793)','Los Rios (4,251)','Aysen (1,114)',
		'--NETHERLANDS--','Zuid-Holland (124,597)','Noord-Holland (79,614)','Noord-Brabant (67,140)','Gelderland (41,945)','Utrecht (36,693)','Overijssel (25,034)','Limburg (19,740)','Flevoland (8,238)','Groningen (6,885)','Friesland (6,883)','Drenthe (6,270)','Zeeland (4,771)',
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
