"use strict";
// custom graph component

var point = {
'Acre':217,'Aguascalientes':217,'Alagoas':217,'Amapa':217,'Amazonas':217,'Amazonas Region':226,'Ancash':226,'Antofagasta':223,'Apurimac':226,'Araucania':223,'Arequipa Region':226,'Argentina':114,'Arica Y Parinacota':223,'Atacama':223,'Australia':227,'Austria':226,'Ayacucho':226,'Aysen':223,'Bahia':217,'Baja California':217,'Baja California Sur':217,'Belgium':226,'Biobio':223,'Brazil':217,'Cajamarca':226,'Callao Province':226,'Campeche':217,'Canada':226,'Ceara':217,'Chiapas':217,'Chihuahua':217,'Coahuila':217,'Colima':217,'Coquimbo':223,'Cusco':226,'Czechia':226,'Durango':217,'Espirito Santo':217,'Germany':227,'Goias':217,'Guanajuato':217,'Guerrero':217,'Hidalgo':217,'Huancavelica':226,'Huanuco':226,'ICA':226,'Ireland':226,'Italy':188,'Jalisco':217,'Japan':203,'Johannesburg':226,'Junin':226,'La Libertad':226,'Lambayeque':226,'Latvia':222,'Lima':226,'Lima Province':226,'Lima Region':226,'Lithuania':226,'Locations':217,'Loreto':226,'Los Lagos':223,'Los Rios':223,'Madrede Dios':226,'Magallanes':223,'Maranhao':217,'Mato Grosso':217,'Mato Grosso Sul':217,'Maule':223,'Mexico':211,'Mexico City':217,'Mexico State':217,'Michoacan':217,'Minas Gerais':217,'Moquegua':226,'Morelos':217,'Nayarit':217,'Nuble':223,'Nuevo Leon':217,'O Higgins':223,'Oaxaca':217,'Para':217,'Paraiba':217,'Parana':217,'Pasco':226,'Pernambuco':217,'Peru':226,'Piaui':217,'Piura Region':226,'Poland':226,'Puebla':217,'Puno':226,'Queretaro':217,'Quintana Roo':217,'Rio Grande Norte':217,'Rio Grande Sul':217,'Riode Janeiro State':217,'Rondonia':217,'Roraima':217,'San Luis Potosi':217,'San Martin':226,'Santa Catarina':217,'Santiago':223,'Sao Paulo State':217,'Seoul':41,'Sergipe':217,'Sinaloa':217,'Slovenia':226,'Sonora':217,'South Africa':226,'South Korea':201,'Spain':127,'Sweden':226,'Switzerland':226,'Sydney':227,'Tabasco':217,'Tacna':226,'Tamaulipas':217,'Tarapaca':223,'Tlaxcala':217,'Tocantins':217,'Tumbes':226,'Ucayali':226,'UK':219,'Valparaiso':223,'Veracruz':217,'Wales':219,'Yucatan':217,'Zacatecas':217,
'default':228
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
		'USA (6,244,970)','Brazil (4,123,000)','India (4,113,811)','Russia (1,017,131)','Peru (676,848)','Colombia (650,055)','South Africa (636,884)','Mexico (629,409)','Argentina (471,806)','Chile (420,434)','UK (344,164)','France (329,512)','Italy (276,338)','Germany (251,058)','Canada (132,514)','China (90,027)','Belgium (87,825)','Sweden (84,985)','Netherlands (73,862)','Poland (70,387)','Nigeria (54,905)','Switzerland (43,957)','Ireland (29,534)','Austria (29,087)','Czechia (27,752)','Australia (26,222)','Slovenia (3,122)','New Zealand (1,772)',
		'-----USA-----',
		'Sunbelt (3,110,494)','South (2,865,206)','West (1,318,771)','Midwest (1,031,975)','Northeast (1,004,218)','California (735,505)','Texas (656,490)','Florida (643,867)','New York (439,221)','Georgia (283,417)','Illinois (250,304)','Arizona (205,525)','New Jersey (198,306)','North Carolina (175,862)','Tennessee (163,004)','Louisiana (151,764)','Pennsylvania (143,282)','Massachusetts (132,625)','Alabama (131,905)','Ohio (131,088)','Virginia (125,697)','South Carolina (124,295)','Michigan (117,737)','Maryland (111,614)','Indiana (99,156)','Missouri (93,188)','Mississippi (86,568)','Minnesota (80,477)','Wisconsin (80,364)','Washington (77,459)','Nevada (71,374)','Iowa (69,803)','Arkansas (65,313)','Oklahoma (63,310)','Colorado (59,248)','Utah (54,450)','Connecticut (53,815)','Kentucky (52,862)','Kansas (45,683)','Nebraska (35,945)','Idaho (33,474)','Oregon (27,859)','New Mexico (26,246)','Rhode Island (23,105)','Delaware (17,892)','South Dakota (14,895)','North Dakota (13,335)','West Virginia (11,346)','Hawaii (9,714)','Montana (8,170)','New Hampshire (7,501)','Alaska (5,683)','Maine (4,664)','Wyoming (4,064)','Vermont (1,699)',
		'----BRAZIL---',
		'Sao Paulo State (765,670)','Bahia (240,939)','Rio de Janeiro State (214,003)','Ceara (207,386)','Minas Gerais (198,736)','Maranhao (145,921)','Santa Catarina (135,690)','Goias (122,130)','Parana (120,537)','Para (120,537)','Pernambuco (119,958)','Amazonas (116,579)','Rio Grande Sul (112,763)','Espirito Santo (107,191)','Paraiba (102,208)','Mato Grosso (84,277)','Alagoas (76,894)','Piaui (72,956)','Sergipe (70,926)','Rio Grande Norte (60,161)','Rondonia (52,514)','Tocantins (45,400)','Mato Grosso Sul (44,324)','Roraima (42,044)','Amapa (41,553)','Acre (23,936)',
		'----INDIA----',
		'Maharashtra (883,862)','Andhra Pradesh (487,331)','Tamil Nadu (457,697)','Karnataka (389,232)','Uttar Pradesh (259,765)','West Bengal (177,701)','Bihar (145,861)','Odisha (120,221)','Gujarat (103,006)','Rajasthan (89,363)','Kerala (84,759)','Haryana (74,272)','Madhya Pradesh (71,880)','Punjab (61,527)','Jharkhand (49,772)','Chhattisgarh (43,163)','Jammu and Kashmir (42,241)','Uttarakhand (23,961)','Goa (19,863)','Puducherry (16,568)','Tripura (14,524)','Himachal Pradesh (7,018)','Manipur (6,883)','Arunachal Pradesh (4,858)','Nagaland (4,128)','Ladakh (2,996)','Meghalaya (2,916)','Dadra and NHDD (2,533)','Sikkim (1,914)','Mizoram (1,062)',
		'----RUSSIA---',
		'Central (334,793)','Volga (124,734)','Northwestern (95,475)','Siberian (79,530)','Ural (64,658)','Southern (59,099)','Caucasian (47,933)','Eastern (45,018)',
		'----MEXICO---',
		'Mexico State (64,708)','Guanajuato (28,790)','Veracruz (27,191)','Tabasco (26,814)','Nuevo Leon (26,110)','Puebla (25,469)','Tamaulipas (23,229)','Sonora (20,856)','Coahuila (19,687)','Jalisco (18,215)','San Luis Potosi (16,313)','Baja California (16,076)','Sinaloa (15,375)','Guerrero (14,072)','Michoacan (13,800)','Yucatan (13,426)','Oaxaca (13,007)','Quintana Roo (9,701)','Hidalgo (9,347)','Chihuahua (7,342)','Baja California Sur (6,874)','Chiapas (6,145)','Tlaxcala (5,946)','Durango (5,734)','Queretaro (5,500)','Campeche (5,333)','Aguascalientes (5,195)','Morelos (4,948)','Nayarit (4,620)','Zacatecas (4,536)','Colima (3,160)',
		'-----PERU----',
		'Lima Province (294,220)','Arequipa Region (34,419)','Piura Region (30,079)','Callao Province (28,207)','Lima Region (24,602)','La Libertad (23,335)','Lambayeque (22,698)','Ica (22,006)','Ancash (19,104)','Loreto (16,196)','Cusco (16,146)','Cajamarca (16,081)','Junin (15,692)','San Martin (14,263)','Ucayali (14,204)','Huanuco (12,974)','Amazonas Region (11,320)','Moquegua (9,507)','Puno (9,374)','Tacna (9,217)','Ayacucho (8,749)','Madre de Dios (6,380)','Tumbes (5,908)','Huancavelica (5,016)','Pasco (4,039)','Apurimac (3,112)',
		'----CHILE----',
		'Valparaiso (1,493,880)','Antofagasta (1,196,428)','Biobio (982,865)','O’Higgins (813,368)','Tarapaca (754,053)','Maule (741,395)','Coquimbo (508,764)','Araucania (443,008)','Los Lagos (353,160)','Arica y Parinacota (351,404)','Nuble (349,270)','Atacama (242,061)','Magallanes (222,905)','Los Rios (89,586)','Aysen (6,846)',
		'------UK-----',
		'England','Scotland','Wales',
		'---COLOMBIA--',
		'Atlantico (49,037)','Antioquia (26,117)','Valle del Cauca (22,010)','Bolivar (16,883)','Cundinamarca (7,241)','Narino (7,090)','Sucre (5,440)','Magdalena (5,397)','Cordoba (4,504)','Choco (2,861)','Santander (2,797)','Cesar (2,636)','Amazonas Department (2,506)','Meta (2,313)','Tolima (2,173)','La Guajira (1,888)','Norte de Santander (1,785)','Cauca (1,624)','Risaralda (1,349)','Boyaca (820)','Putumayo (759)','Caldas (723)','Huila (721)','Caqueta (678)','Quindio (267)','Casanare (252)','Arauca (181)','Guaviare (80)','Vaupes (61)',
		'---FRANCE----',
		'Ile-de-France (38,936)','Grand Est (16,856)','Auvergne-Rhone-Alpes (10,198)','Hauts-de-France (9,268)','Bourgogne-Franche-Comte (5,188)','Occitanie (3,681)','Centre-Val de Loire (2,990)','Pays de la Loire (2,950)','Nouvelle-Aquitaine (2,830)','Normandie (2,365)','Bretagne (1,671)','Corse (322)', "Provence-Alpes-Cote d’Azur",
		'-------------',
		'-NETHERLANDS-',
		'Zuid-Holland (20,330)','Noord-Holland (13,290)','Noord-Brabant (12,554)','Gelderland (7,637)','Utrecht (5,765)','Limburg (5,531)','Overijssel (3,565)','Flevoland (1,387)','Zeeland (1,075)','Friesland (840)','Groningen (626)','Drenthe (617)',
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
