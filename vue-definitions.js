"use strict";
// custom graph component

var point = {
'Acre':605,'Alagoas':605,'Amapa':605,'Amazonas':605,'Amazonas Department':625,'Andhra Pradesh':605,'Antioquia':625,'Antofagasta':636,'Arauca':625,'Araucania':636,'Arica Y Parinacota':636,'Arunachal Pradesh':605,'Assam':605,'Atacama':636,'Atlantico':625,'Auvergne Rhone Alpes':569,'Aysen':636,'Bahia':605,'Bihar':605,'Biobio':636,'Bolivar':625,'Bourgogne Franche Comte':569,'Boyaca':625,'Brazil':605,'Bretagne':569,'Caldas':625,'Caqueta':625,'Casanare':625,'Cauca':625,'Ceara':605,'Centre Val De Loire':569,'Cesar':625,'Chhattisgarh':605,'Chile':636,'Choco':625,'Colombia':625,'Coquimbo':636,'Cordoba':625,'Corse':569,'Cundinamarca':625,'Dadraand N H D D':605,'Espirito Santo':605,'France':569,'Goias':605,'Grand Est':569,'Guainia':625,'Guajira':625,'Guaviare':625,'Gujarat':605,'Haryana':605,'Hauts De France':569,'Himachal Pradesh':605,'Huila':625,'Ile De France':569,'India':605,'Jammu And Kashmir':605,'Jharkhand':605,'Karnataka':605,'Kerala':605,'Ladakh':605,'Locations':605,'Los Lagos':636,'Los Rios':636,'Madhya Pradesh':605,'Magallanes':636,'Magdalena':625,'Maharashtra':605,'Maranhao':605,'Mato Grosso':605,'Mato Grosso Sul':605,'Maule':636,'Meghalaya':605,'Meta':625,'Minas Gerais':605,'Mizoram':605,'Montreal':605,'Nagaland':605,'Narino':625,'New Zealand':1,'Normandie':569,'Norte Santander':625,'Nouvelle Aquitaine':569,'Nuble':636,'O Higgins':636,'Occitanie':569,'Odisha':605,'Para':605,'Paraiba':605,'Parana':605,'Pays De La Loire':569,'Pernambuco':605,'Piaui':605,'Portugal':638,'Provence Alpes Cote Dazur':569,'Puducherry':605,'Punjab':605,'Putumayo':625,'Quindio':625,'Rajasthan':605,'Rio De Janeiro State':605,'Rio Grande Norte':605,'Rio Grande Sul':605,'Risaralda':625,'Rondonia':605,'Roraima':605,'San Andres':625,'Santa Catarina':605,'Santander':625,'Santiago':636,'Sao Paulo State':605,'Sergipe':605,'Sucre':625,'Tamil Nadu':605,'Tarapaca':636,'Telangana':605,'Tocantins':605,'Tolima':625,'Tripura':605,'Uttar Pradesh':605,'Uttarakhand':605,'Valle':625,'Valparaiso':636,'Vaupes':625,'Vichada':625,'West Bengal':605,
'default':639
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
		'USA (45,300,970)','India (34,143,236)','Brazil (21,697,341)','UK (8,641,221)','Russia (8,005,376)','France (6,932,261)','Spain (4,995,176)','Colombia (4,986,249)','Italy (4,729,678)','Germany (4,447,231)','Mexico (3,772,556)','South Africa (2,918,366)','Malaysia (2,413,592)','Peru (2,192,205)','Netherlands (2,064,729)','Thailand (1,821,579)','Czechia (1,718,808)','Japan (1,716,858)','Canada (1,701,341)','Chile (1,676,019)','Romania (1,519,532)','Sweden (1,165,194)','Portugal (1,082,721)','Switzerland (861,123)','Saudi Arabia (548,111)','Slovakia (446,305)','Denmark (372,533)','South Korea (348,969)','Australia (154,489)','China (109,099)','New Zealand (5,449)',
		'------USA------','Sunbelt (19,198,829)','South (19,056,849)','West (9,776,192)','Midwest (9,521,533)','Northeast (6,933,862)','California (4,842,636)','Texas (4,202,915)','Florida (3,744,521)','New York (2,523,865)','Illinois (1,684,299)','Georgia (1,624,087)','Pennsylvania (1,525,813)','Ohio (1,513,061)','North Carolina (1,467,861)','Tennessee (1,275,278)','Michigan (1,238,766)','New Jersey (1,190,160)','Arizona (1,142,157)','Indiana (1,005,990)','Missouri (920,210)','Virginia (913,109)','South Carolina (890,008)','Wisconsin (865,161)','Massachusetts (841,198)','Alabama (817,061)','Minnesota (768,342)','Louisiana (762,287)','Kentucky (732,907)','Colorado (717,952)','Washington (709,180)','Oklahoma (656,795)','Maryland (553,600)','Utah (537,450)','Arkansas (510,161)','Mississippi (500,800)','Iowa (485,762)','Nevada (434,432)','Kansas (427,849)','Connecticut (399,774)','Oregon (356,062)','Nebraska (316,599)','Idaho (283,850)','New Mexico (267,909)','West Virginia (264,039)','Rhode Island (181,849)','Montana (169,495)','South Dakota (151,972)','North Dakota (143,522)','Delaware (141,420)','New Hampshire (133,200)','Alaska (132,424)','Maine (99,832)','Wyoming (99,735)','Hawaii (82,910)','Vermont (38,171)',
		'-----INDIA-----','Maharashtra (6,515,111)','Kerala (4,469,488)','Karnataka (2,966,194)','Tamil Nadu (2,642,030)','Andhra Pradesh (2,036,179)','Uttar Pradesh (1,709,643)','West Bengal (1,560,286)','Odisha (1,018,926)','Chhattisgarh (1,005,014)','Rajasthan (954,238)','Gujarat (825,701)','Madhya Pradesh (792,380)','Haryana (770,705)','Bihar (725,871)','Punjab (601,206)','Jharkhand (348,085)','Uttarakhand (343,355)','Jammu and Kashmir (327,621)','Himachal Pradesh (216,639)','Puducherry (125,258)','Tripura (83,784)','Meghalaya (79,158)','Mizoram (76,591)','Arunachal Pradesh (54,029)','Nagaland (30,743)','Ladakh (20,698)','Ladakh (20,698)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,325,189)','Minas Gerais (2,108,362)','Parana (1,486,523)','Para (1,486,523)','Rio Grande Sul (1,422,778)','Bahia (1,228,507)','Santa Catarina (1,168,503)','Rio de Janeiro State (1,161,182)','Ceara (935,513)','Goias (842,772)','Pernambuco (615,196)','Espirito Santo (575,516)','Mato Grosso (527,194)','Paraiba (436,755)','Amazonas (425,907)','Mato Grosso Sul (371,452)','Rio Grande Norte (366,884)','Maranhao (353,554)','Piaui (318,337)','Sergipe (277,819)','Rondonia (264,785)','Alagoas (237,479)','Tocantins (222,002)','Roraima (126,855)','Amapa (122,643)','Acre (87,925)',
		'-------UK------','England (7,388,884)','Scotland (620,433)','Wales (415,829)',
		'-----RUSSIA----','Central (2,592,323)','Ural (2,068,027)','Eastern (1,105,477)','Northwestern (988,339)','Volga (877,312)','Siberian (678,650)','Southern (571,508)','Caucasian (394,732)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (748,824)','Atlantico (323,241)','Cundinamarca (263,834)','Santander (225,475)','Bolivar (156,678)','Tolima (107,423)','Boyaca (105,399)','Cordoba (103,961)','Caldas (100,423)','Magdalena (94,678)','Norte Santander (90,858)','Narino (89,600)','Cesar (89,202)','Meta (88,697)','Huila (88,266)','Risaralda (87,694)','Valle (61,033)','Sucre (59,100)','Quindio (56,325)','Cauca (55,880)','Guajira (42,569)','Casanare (35,561)','Caqueta (22,864)','Choco (16,397)','Putumayo (16,305)','Arauca (13,329)','Amazonas Department (6,833)','Guaviare (5,135)','Vaupes (1,750)',
		'-----MEXICO----','Mexico State (371,762)','Nuevo Leon (202,425)','Guanajuato (185,164)','Jalisco (159,491)','Tabasco (140,896)','Puebla (123,102)','Veracruz (121,390)','Sonora (110,705)','Tamaulipas (100,637)','Queretaro (96,234)','Coahuila (92,070)','Oaxaca (80,595)','Guerrero (75,897)','Sinaloa (73,020)','Yucatan (72,740)','Michoacan (72,547)','Chihuahua (67,346)','Baja California (65,939)','Hidalgo (61,581)','Baja California Sur (55,807)','Morelos (48,892)','Durango (48,353)','Zacatecas (41,332)','Aguascalientes (35,346)','Nayarit (33,709)','Colima (32,856)','Tlaxcala (29,062)','Campeche (23,701)','Chiapas (23,067)',
		'------PERU-----','Lima Province (815,859)','Lima Region (141,437)','Arequipa Region (115,235)','Callao (101,185)','La Libertad (88,727)','Piura Region (88,246)','Junin (86,558)','Ancash (77,660)','Cusco (73,891)','Cajamarca (65,944)','Lambayeque (61,770)','Ica (59,123)','San Martin (48,747)','Loreto (45,092)','Puno (40,500)','Huanuco (35,635)','Ayacucho (34,008)','Ucayali (32,115)','Amazonas Region (31,751)','Tacna (29,913)','Moquegua (29,662)','Apurimac (26,241)','Tumbes (18,871)','Huancavelica (16,221)','Pasco (15,842)','Madre de Dios (13,899)',
		'--NETHERLANDS--','Zuid-Holland (495,270)','Noord-Holland (353,666)','Noord-Brabant (321,711)','Gelderland (230,087)','Limburg (137,984)','Overijssel (135,007)','Groningen (51,098)','Flevoland (46,191)','Utrecht (44,039)','Drenthe (40,949)','Zeeland (35,817)','Friesland (16,252)',
		'-----CANADA----','Ontario (604,453)','Quebec (421,356)','Alberta (318,520)','British Columbia (200,249)','Saskatchewan (75,540)','Manitoba (62,469)','Nova Scotia (7,185)','New Brunswick (6,032)','Newfoundland (1,898)',
		'-----CHILE-----','Biobio (152,320)','Valparaiso (124,776)','Maule (102,812)','Araucania (98,666)','Los Lagos (89,400)','O’Higgins (69,356)','Antofagasta (62,179)','Los Rios (49,598)','Coquimbo (49,283)','Tarapaca (42,025)','Nuble (36,364)','Magallanes (29,260)','Arica y Parinacota (27,660)','Atacama (27,603)','Aysen (8,413)',
		'----SLOVAKIA---','Bratislava (98,645)','Nitra (96,643)','Trnava (94,922)','Banska Bystrica (91,204)','Kosice (22,167)','Zilina (18,053)','Presov (17,532)','Trencin (13,864)',
		'----DENMARK----','Hovedstaden (175,471)','Midtjylland (66,438)','Syddanmark (52,441)','Sjaelland (47,767)','Nordjylland (27,876)',
		'--SAUDI ARABIA-','Ar Riyad (131,022)','Makkah Al Mukarramah (130,196)','Eastern Region (117,669)','Aseer (40,949)','Al Madinah Al Munawwarah (39,451)','Al Qaseem (21,643)','Jazan Province (21,124)','Hail Province (11,721)','Najran Province (10,699)','Tabuk Province (8,566)','Al Bahah (7,163)','Northern Borders (5,250)','Al Jawf (2,709)',
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
