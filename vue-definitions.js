"use strict";
// custom graph component

var point = {
'Acre':603,'Alagoas':603,'Amapa':603,'Amazonas':603,'Amazonas Department':603,'Amazonas Region':603,'Ancash':603,'Antioquia':603,'Antofagasta':601,'Apurimac':603,'Arauca':603,'Araucania':601,'Arequipa Region':603,'Arica Y Parinacota':601,'Atacama':601,'Atlantico':603,'Auvergne Rhone Alpes':569,'Ayacucho':603,'Aysen':601,'Bahia':603,'Biobio':601,'Bolivar':603,'Bourgogne Franche Comte':569,'Boyaca':603,'Brazil':603,'Bretagne':569,'Cajamarca':603,'Caldas':603,'Callao':603,'Caqueta':603,'Casanare':603,'Cauca':603,'Ceara':603,'Centre Val De Loire':569,'Cesar':603,'Chile':601,'Choco':603,'Colombia':603,'Coquimbo':601,'Cordoba':603,'Corse':569,'Cundinamarca':603,'Cusco':603,'England':603,'Espirito Santo':603,'France':569,'Goias':603,'Grand Est':569,'Guainia':603,'Guajira':603,'Guaviare':603,'Hauts De France':569,'Huancavelica':603,'Huanuco':603,'Huila':603,'ICA':603,'Ile De France':569,'Junin':603,'La Libertad':603,'Lambayeque':603,'Lima':603,'Lima Province':603,'Lima Region':603,'Locations':603,'London':603,'Loreto':603,'Los Lagos':601,'Los Rios':601,'Madrede Dios':603,'Magallanes':601,'Magdalena':603,'Maranhao':603,'Mato Grosso':603,'Mato Grosso Sul':603,'Maule':601,'Meta':603,'Minas Gerais':603,'Moquegua':603,'Narino':603,'Normandie':569,'Norte Santander':603,'Nouvelle Aquitaine':569,'Nuble':601,'O Higgins':601,'Occitanie':569,'Para':603,'Paraiba':603,'Parana':603,'Pasco':603,'Pays De La Loire':569,'Pernambuco':603,'Peru':603,'Piaui':603,'Piura Region':603,'Provence Alpes Cote Dazur':569,'Puno':603,'Putumayo':603,'Quindio':603,'Rio De Janeiro State':603,'Rio Grande Norte':603,'Rio Grande Sul':603,'Risaralda':603,'Rondonia':603,'Roraima':603,'San Andres':603,'San Martin':603,'Santa Catarina':603,'Santander':603,'Santiago':601,'Sao Paulo State':603,'Sergipe':603,'South Korea':603,'Sucre':603,'Tacna':603,'Tarapaca':601,'Tocantins':603,'Tolima':603,'Tumbes':603,'Ucayali':603,'UK':603,'Valle':603,'Valparaiso':601,'Vaupes':603,'Vichada':603,'Wales':603,
'default':604
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
		'USA (41,785,903)','India (33,381,728)','Brazil (21,069,017)','UK (7,339,009)','Russia (7,110,656)','France (6,771,911)','Colombia (4,936,052)','Italy (4,623,155)','Germany (4,127,158)','Mexico (3,549,229)','South Africa (2,873,415)','Peru (2,164,380)','Malaysia (2,049,750)','Netherlands (1,979,114)','Czechia (1,684,881)','Japan (1,663,818)','Chile (1,645,820)','Canada (1,572,215)','Thailand (1,434,237)','Sweden (1,143,973)','Romania (1,135,027)','Switzerland (820,982)','Saudi Arabia (546,336)','Slovakia (400,348)','Denmark (353,744)','South Korea (281,938)','China (107,826)','Australia (82,200)','New Zealand (4,014)',
		'------USA------','Sunbelt (18,019,355)','South (17,658,382)','West (9,020,875)','Midwest (8,618,646)','Northeast (6,424,259)','California (4,611,103)','Texas (3,908,748)','Florida (3,533,123)','New York (2,356,995)','Illinois (1,593,144)','Georgia (1,519,526)','Pennsylvania (1,365,049)','Ohio (1,328,915)','North Carolina (1,328,342)','Tennessee (1,176,364)','New Jersey (1,130,447)','Michigan (1,104,214)','Arizona (1,058,810)','Indiana (922,513)','Missouri (870,104)','Virginia (823,012)','South Carolina (814,259)','Massachusetts (788,775)','Wisconsin (768,379)','Alabama (761,865)','Louisiana (730,847)','Minnesota (679,218)','Colorado (646,791)','Kentucky (644,939)','Washington (617,871)','Oklahoma (605,942)','Maryland (515,266)','Utah (489,410)','Arkansas (480,971)','Mississippi (471,181)','Iowa (436,563)','Nevada (409,002)','Kansas (394,633)','Connecticut (382,798)','Oregon (307,769)','Nebraska (256,926)','New Mexico (243,962)','Idaho (240,580)','West Virginia (217,156)','Rhode Island (170,604)','South Dakota (139,415)','Montana (138,503)','Delaware (126,841)','North Dakota (124,622)','New Hampshire (116,013)','Alaska (99,478)','Wyoming (83,716)','Maine (82,618)','Hawaii (73,880)','Vermont (30,960)',
		'-----INDIA-----','Maharashtra (6,511,525)','Kerala (4,446,228)','Karnataka (2,965,191)','Tamil Nadu (2,640,361)','Andhra Pradesh (2,034,786)','Uttar Pradesh (1,709,628)','West Bengal (1,559,567)','Odisha (1,018,298)','Chhattisgarh (1,004,988)','Rajasthan (954,230)','Gujarat (825,676)','Madhya Pradesh (792,374)','Haryana (770,697)','Bihar (725,864)','Punjab (601,180)','Jharkhand (348,076)','Uttarakhand (343,330)','Jammu and Kashmir (327,466)','Himachal Pradesh (216,430)','Puducherry (125,172)','Tripura (83,712)','Meghalaya (78,910)','Mizoram (75,470)','Arunachal Pradesh (53,991)','Nagaland (30,726)','Ladakh (20,627)','Ladakh (20,627)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,302,511)','Minas Gerais (2,103,798)','Parana (1,482,927)','Para (1,482,927)','Rio Grande Sul (1,421,433)','Bahia (1,227,412)','Santa Catarina (1,167,725)','Rio de Janeiro State (1,160,185)','Ceara (935,273)','Goias (840,489)','Pernambuco (614,430)','Espirito Santo (573,893)','Mato Grosso (526,001)','Paraiba (436,645)','Amazonas (425,781)','Mato Grosso Sul (371,282)','Rio Grande Norte (366,532)','Maranhao (353,095)','Piaui (318,125)','Sergipe (277,747)','Rondonia (264,504)','Alagoas (237,350)','Tocantins (221,540)','Roraima (126,855)','Amapa (122,616)','Acre (87,916)',
		'-------UK------','England (6,281,236)','Scotland (517,216)','Wales (317,481)',
		'-----RUSSIA----','Central (2,901,681)','Northwestern (1,159,350)','Volga (931,380)','Siberian (610,609)','Southern (499,045)','Ural (434,873)','Eastern (426,425)','Caucasian (251,157)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (741,132)','Atlantico (316,720)','Cundinamarca (263,043)','Santander (224,819)','Bolivar (155,580)','Tolima (107,174)','Boyaca (105,025)','Cordoba (103,526)','Caldas (100,086)','Magdalena (93,013)','Norte Santander (89,771)','Narino (89,167)','Cesar (88,546)','Huila (88,028)','Meta (87,670)','Risaralda (87,417)','Valle (60,625)','Sucre (58,894)','Quindio (55,954)','Cauca (55,490)','Guajira (42,204)','Casanare (35,436)','Caqueta (22,774)','Choco (16,317)','Putumayo (16,170)','Arauca (13,197)','Amazonas Department (6,814)','Guaviare (5,127)','Vaupes (1,749)',
		'-----MEXICO----','Mexico State (351,710)','Nuevo Leon (190,911)','Guanajuato (165,343)','Jalisco (147,020)','Tabasco (126,705)','Puebla (114,565)','Veracruz (113,146)','Sonora (105,435)','Tamaulipas (93,048)','Queretaro (90,421)','Coahuila (86,413)','Oaxaca (73,227)','Guerrero (73,063)','Sinaloa (70,361)','Michoacan (68,678)','Yucatan (66,428)','Chihuahua (64,215)','Baja California (58,699)','Hidalgo (58,413)','Baja California Sur (54,622)','Durango (46,193)','Morelos (45,837)','Zacatecas (39,808)','Aguascalientes (32,644)','Nayarit (31,619)','Colima (29,667)','Tlaxcala (27,331)','Campeche (21,781)','Chiapas (21,265)',
		'------PERU-----','Lima Province (802,817)','Lima Region (140,384)','Arequipa Region (114,170)','Callao (100,070)','La Libertad (87,418)','Piura Region (86,687)','Junin (84,943)','Ancash (76,405)','Cusco (72,809)','Cajamarca (65,327)','Lambayeque (60,979)','Ica (58,218)','San Martin (48,346)','Loreto (44,893)','Puno (39,425)','Huanuco (35,415)','Ayacucho (33,427)','Ucayali (32,046)','Amazonas Region (31,360)','Tacna (29,641)','Moquegua (29,452)','Apurimac (25,968)','Tumbes (18,620)','Huancavelica (16,045)','Pasco (15,698)','Madre de Dios (13,817)',
		'--NETHERLANDS--','Zuid-Holland (473,863)','Noord-Holland (342,904)','Noord-Brabant (312,055)','Gelderland (218,835)','Limburg (130,747)','Overijssel (128,814)','Groningen (49,092)','Flevoland (43,976)','Utrecht (42,348)','Drenthe (39,192)','Zeeland (33,970)','Friesland (16,252)',
		'-----CHILE-----','Biobio (150,752)','Valparaiso (122,825)','Maule (101,363)','Araucania (98,068)','Los Lagos (88,680)','O’Higgins (68,466)','Antofagasta (60,831)','Los Rios (49,260)','Coquimbo (48,490)','Tarapaca (41,182)','Nuble (35,874)','Magallanes (29,249)','Atacama (27,211)','Arica y Parinacota (26,817)','Aysen (8,191)',
		'-----CANADA----','Ontario (585,365)','Quebec (400,625)','Alberta (275,538)','British Columbia (177,186)','Saskatchewan (60,589)','Manitoba (59,526)','Nova Scotia (6,294)','New Brunswick (3,180)','Newfoundland (1,551)',
		'----SLOVAKIA---','Kosice (99,757)','Nitra (93,035)','Bratislava (92,429)','Trnava (90,577)','Banska Bystrica (84,971)','Zilina (14,946)','Presov (14,610)','Trencin (12,855)',
		'----DENMARK----','Hovedstaden (165,526)','Midtjylland (64,012)','Syddanmark (49,639)','Sjaelland (44,997)','Nordjylland (26,485)',
		'--SAUDI ARABIA-','Ar Riyad (130,475)','Makkah Al Mukarramah (129,741)','Eastern Region (117,459)','Aseer (40,891)','Al Madinah Al Munawwarah (39,342)','Al Qaseem (21,550)','Jazan Province (21,038)','Hail Province (11,695)','Najran Province (10,645)','Tabuk Province (8,514)','Al Bahah (7,151)','Northern Borders (5,232)','Al Jawf (2,678)',
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
