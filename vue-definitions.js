"use strict";
// custom graph component

var point = {
'Acre':206,'Aguascalientes':207,'Alagoas':206,'Amapa':206,'Amazonas':206,'Amazonas Region':207,'Ancash':207,'Antofagasta':206,'Apurimac':207,'Araucania':206,'Arequipa Region':207,'Argentina':114,'Arica Y Parinacota':206,'Atacama':206,'Ayacucho':207,'Aysen':206,'Bahia':206,'Baja California':207,'Baja California Sur':207,'Biobio':206,'Brazil':206,'Cajamarca':207,'Callao Province':207,'Campeche':207,'Canada':207,'Ceara':206,'Chiapas':207,'Chihuahua':207,'Coahuila':207,'Colima':207,'Coquimbo':206,'Cusco':207,'Durango':207,'Espirito Santo':206,'Goias':206,'Guanajuato':207,'Guerrero':207,'Hidalgo':207,'Huancavelica':207,'Huanuco':207,'ICA':207,'Ireland':139,'Italy':169,'Jalisco':207,'Japan':202,'Junin':207,'La Libertad':207,'Lambayeque':207,'Lima':207,'Lima Province':207,'Lima Region':207,'Locations':206,'Loreto':207,'Los Lagos':206,'Los Rios':206,'Madrede Dios':207,'Magallanes':206,'Maranhao':206,'Mato Grosso':206,'Mato Grosso Sul':206,'Maule':206,'Mexico':201,'Mexico City':207,'Mexico State':207,'Michoacan':207,'Minas Gerais':65,'Moquegua':207,'Morelos':207,'Nayarit':207,'Nigeria':2,'Nuble':206,'Nuevo Leon':207,'O Higgins':206,'Oaxaca':207,'Para':206,'Paraiba':206,'Parana':206,'Pasco':207,'Pernambuco':206,'Peru':207,'Piaui':206,'Piura Region':207,'Puebla':207,'Puno':207,'Queretaro':207,'Quintana Roo':207,'Rio Grande Norte':206,'Rio Grande Sul':206,'Riode Janeiro State':206,'Rondonia':206,'Roraima':206,'San Luis Potosi':207,'San Martin':207,'Santa Catarina':206,'Santiago':206,'Sao Paulo State':206,'Seoul':27,'Sergipe':206,'Sinaloa':207,'Sonora':207,'South Korea':177,'Spain':126,'Tabasco':207,'Tacna':207,'Tamaulipas':207,'Tarapaca':206,'Tlaxcala':207,'Tocantins':206,'Tumbes':207,'Ucayali':207,'Valparaiso':206,'Veracruz':207,'Yucatan':207,'Zacatecas':207,
'default':208
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
				let url = 'data/' + camelCase(selectedRegion.toLowerCase().replace(/[-’]/g," ").replace(/ \([0-9,]*\)/g,"")).replace(/RioDe/g,"Riode") + '.csv';
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
		'-------------',
		'London','Sydney','Johannesburg','Chicago','Mexico City','Seoul','Santiago','Lima',
		'-------------',
		'North America','South America','Latin America','Europe','EU','Balkans','Middle East','Africa','Asia','Oceania',
		'-------------',
		'Governance','Full Democracies','Flawed Democracies','Hybrid Regimes','Less Authoritarian','More Authoritarian',
		'-------------',
		'USA (5,403,213)','Brazil (3,340,197)','India (2,647,663)','Russia (920,719)','South Africa (587,345)','Peru (525,803)','Mexico (522,162)','Colombia (468,332)','Chile (385,946)','UK (318,484)','Argentina (294,569)','Italy (253,915)','France (239,345)','Germany (225,007)','Canada (123,812)','China (89,380)','Sweden (84,294)','Belgium (78,323)','Netherlands (63,002)','Poland (56,684)','Nigeria (49,068)','Switzerland (38,124)','Ireland (27,257)','Australia (23,582)','Austria (23,370)','Czechia (20,012)','Slovenia (2,416)','New Zealand (1,631)',
		'-----USA-----',
		'Sunbelt (2,693,136)','South (2,444,861)','West (1,140,304)','Northeast (955,911)','Midwest (836,734)','California (624,069)','Florida (573,423)','Texas (555,693)','New York (425,957)','Georgia (237,940)','Illinois (207,648)','Arizona (193,546)','New Jersey (191,879)','North Carolina (145,179)','Louisiana (138,142)','Tennessee (133,762)','Pennsylvania (129,073)','Massachusetts (123,649)','Ohio (109,593)','Alabama (108,435)','Virginia (106,696)','South Carolina (106,502)','Michigan (102,915)','Maryland (100,219)','Indiana (80,608)','Mississippi (72,226)','Missouri (68,209)','Washington (68,126)','Wisconsin (65,804)','Minnesota (65,772)','Nevada (61,575)','Arkansas (53,750)','Colorado (53,441)','Iowa (52,574)','Connecticut (51,231)','Oklahoma (48,497)','Utah (46,832)','Kentucky (39,325)','Kansas (34,235)','Nebraska (30,501)','Idaho (27,666)','New Mexico (23,410)','Oregon (23,263)','Rhode Island (21,291)','Delaware (16,451)','South Dakota (10,283)','West Virginia (8,621)','North Dakota (8,592)','New Hampshire (7,073)','Montana (5,758)','Hawaii (5,063)','Alaska (4,263)','Maine (4,192)','Wyoming (3,292)','Vermont (1,566)',
		'----BRAZIL---',
		'Sao Paulo State (686,122)','Bahia (210,993)','Ceara (196,144)','Rio de Janeiro State (189,891)','Minas Gerais (168,428)','Maranhao (135,324)','Santa Catarina (118,183)','Amazonas (110,777)','Pernambuco (110,409)','Parana (101,844)','Para (101,844)','Goias (99,234)','Espirito Santo (98,106)','Rio Grande Sul (95,142)','Paraiba (94,660)','Mato Grosso (72,269)','Alagoas (71,232)','Sergipe (67,225)','Piaui (64,595)','Rio Grande Norte (57,921)','Rondonia (47,288)','Amapa (39,244)','Roraima (38,897)','Mato Grosso Sul (35,434)','Tocantins (35,403)','Acre (22,435)',
		'----INDIA----',
		'Maharashtra (595,865)','Tamil Nadu (338,055)','Andhra Pradesh (289,829)','Karnataka (226,966)','Uttar Pradesh (154,418)','West Bengal (116,498)','Bihar (104,093)','Gujarat (78,783)','Rajasthan (61,296)','Odisha (60,050)','Haryana (47,153)','Madhya Pradesh (45,455)','Kerala (44,415)','Punjab (31,206)','Jammu and Kashmir (28,470)','Jharkhand (23,224)','Chhattisgarh (15,621)','Uttarakhand (12,175)','Goa (11,639)','Puducherry (7,734)','Tripura (7,076)','Manipur (4,569)','Himachal Pradesh (4,156)','Nagaland (3,394)','Arunachal Pradesh (2,701)','Ladakh (1,948)','Dadra and NHDD (1,883)','Meghalaya (1,374)','Sikkim (1,180)','Mizoram (777)',
		'----RUSSIA---',
		'Central (314,400)','Volga (115,902)','Northwestern (85,254)','Ural (76,767)','Siberian (75,310)','Southern (49,322)','Caucasian (41,869)','Eastern (38,331)',
		'----MEXICO---',
		'Mexico State (60,214)','Guanajuato (25,309)','Veracruz (25,012)','Tabasco (24,819)','Puebla (23,415)','Nuevo Leon (22,670)','Tamaulipas (20,469)','Sonora (19,754)','Coahuila (16,630)','Jalisco (15,765)','Baja California (15,110)','Sinaloa (14,276)','San Luis Potosi (13,663)','Guerrero (12,850)','Oaxaca (12,021)','Yucatan (11,890)','Michoacan (11,853)','Quintana Roo (8,874)','Hidalgo (8,181)','Chihuahua (6,527)','Chiapas (5,994)','Baja California Sur (5,727)','Tlaxcala (5,448)','Campeche (5,056)','Durango (4,912)','Aguascalientes (4,620)','Queretaro (4,545)','Morelos (4,514)','Nayarit (4,089)','Zacatecas (3,613)','Colima (2,460)',
		'-----PERU----',
		'Lima Province (244,631)','Callao Province (24,629)','Piura Region (24,322)','Arequipa Region (23,934)','Lima Region (20,947)','Lambayeque (19,884)','La Libertad (19,178)','Ica (16,734)','Ancash (15,327)','Loreto (13,186)','Ucayali (11,860)','Junin (11,501)','San Martin (11,240)','Cajamarca (10,795)','Huanuco (9,343)','Cusco (8,949)','Amazonas Region (8,216)','Moquegua (6,280)','Ayacucho (5,982)','Puno (5,566)','Tacna (5,546)','Tumbes (5,101)','Madre de Dios (4,755)','Huancavelica (3,171)','Pasco (3,036)','Apurimac (1,777)',
		'----CHILE----',
		'Valparaiso (1,052,715)','Antofagasta (842,081)','Biobio (656,563)','O’Higgins (552,893)','Tarapaca (544,790)','Maule (514,890)','Araucania (342,788)','Coquimbo (320,301)','Nuble (259,734)','Los Lagos (227,715)','Arica y Parinacota (223,510)','Magallanes (160,516)','Atacama (134,775)','Los Rios (67,983)','Aysen (4,612)',
		'------UK-----',
		'England','Scotland','Wales',
		'---COLOMBIA--',
		'Atlantico (49,037)','Antioquia (26,117)','Valle del Cauca (22,010)','Bolivar (16,883)','Cundinamarca (7,241)','Narino (7,090)','Sucre (5,440)','Magdalena (5,397)','Cordoba (4,504)','Choco (2,861)','Santander (2,797)','Cesar (2,636)','Amazonas Department (2,506)','Meta (2,313)','Tolima (2,173)','La Guajira (1,888)','Norte de Santander (1,785)','Cauca (1,624)','Risaralda (1,349)','Boyaca (820)','Putumayo (759)','Caldas (723)','Huila (721)','Caqueta (678)','Quindio (267)','Casanare (252)','Arauca (181)','Guaviare (80)','Vaupes (61)',
		'---FRANCE----',
		'Ile-de-France (37,691)','Grand Est (16,557)','Auvergne-Rhone-Alpes (9,952)','Hauts-de-France (9,030)','Bourgogne-Franche-Comte (5,139)','Occitanie (3,517)','Centre-Val de Loire (2,918)','Pays de la Loire (2,809)','Nouvelle-Aquitaine (2,708)','Normandie (2,305)','Bretagne (1,628)','Corse (315)', "Provence-Alpes-Cote d’Azur",
		'-------------',
		'-NETHERLANDS-',
		'Zuid-Holland (16,674)','Noord-Brabant (11,136)','Noord-Holland (10,355)','Gelderland (6,951)','Limburg (5,122)','Utrecht (4,923)','Overijssel (3,319)','Flevoland (1,156)','Zeeland (967)','Friesland (732)','Drenthe (582)','Groningen (500)',
		'-------------',
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
