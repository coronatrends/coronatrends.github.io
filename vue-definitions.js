"use strict";
// custom graph component

var point = {
'Acre':605,'Aguascalientes':652,'Alagoas':605,'Amapa':605,'Amazonas':605,'Amazonas Department':652,'Andhra Pradesh':605,'Antioquia':652,'Antofagasta':657,'Arauca':652,'Araucania':657,'Arica Y Parinacota':657,'Arunachal Pradesh':605,'Assam':605,'Atacama':657,'Atlantico':652,'Auvergne Rhone Alpes':569,'Aysen':657,'Bahia':605,'Baja California':652,'Baja California Sur':652,'Bihar':605,'Biobio':657,'Bolivar':652,'Bourgogne Franche Comte':569,'Boyaca':652,'Brazil':605,'Bretagne':569,'Caldas':652,'Campeche':652,'Caqueta':652,'Casanare':652,'Cauca':652,'Ceara':605,'Centre Val De Loire':569,'Cesar':652,'Chhattisgarh':605,'Chiapas':652,'Chihuahua':652,'Chile':657,'Choco':652,'Coahuila':652,'Colima':652,'Colombia':652,'Coquimbo':657,'Cordoba':652,'Corse':569,'Cundinamarca':652,'Dadraand N H D D':605,'Durango':652,'Espirito Santo':605,'France':569,'Goias':605,'Grand Est':569,'Guainia':652,'Guajira':652,'Guanajuato':652,'Guaviare':652,'Guerrero':652,'Gujarat':605,'Haryana':605,'Hauts De France':569,'Hidalgo':652,'Himachal Pradesh':605,'Huila':652,'Ile De France':569,'India':605,'Jalisco':652,'Jammu And Kashmir':605,'Jharkhand':605,'Johannesburg':658,'Karnataka':605,'Kerala':605,'Ladakh':605,'Locations':605,'Los Lagos':657,'Los Rios':657,'Madhya Pradesh':605,'Magallanes':657,'Magdalena':652,'Maharashtra':605,'Maranhao':605,'Mato Grosso':605,'Mato Grosso Sul':605,'Maule':657,'Meghalaya':605,'Meta':652,'Mexico':652,'Mexico City':652,'Mexico State':652,'Michoacan':652,'Minas Gerais':605,'Mizoram':605,'Montreal':605,'Morelos':652,'Nagaland':605,'Narino':652,'Nayarit':652,'Normandie':569,'Norte Santander':652,'Nouvelle Aquitaine':569,'Nuble':657,'Nuevo Leon':652,'O Higgins':657,'Oaxaca':652,'Occitanie':569,'Odisha':605,'Para':605,'Paraiba':605,'Parana':605,'Pays De La Loire':569,'Pernambuco':605,'Piaui':605,'Provence Alpes Cote Dazur':569,'Puducherry':605,'Puebla':652,'Punjab':605,'Putumayo':652,'Queretaro':652,'Quindio':652,'Rajasthan':605,'Rio De Janeiro State':605,'Rio Grande Norte':605,'Rio Grande Sul':605,'Risaralda':652,'Rondonia':605,'Roraima':605,'San Andres':652,'Santa Catarina':605,'Santander':652,'Santiago':657,'Sao Paulo State':605,'Sergipe':605,'Sinaloa':652,'Sonora':652,'South Africa':659,'Sucre':652,'Tabasco':652,'Tamaulipas':652,'Tamil Nadu':605,'Tarapaca':657,'Telangana':605,'Tlaxcala':652,'Tocantins':605,'Tolima':652,'Tripura':605,'Uttar Pradesh':605,'Uttarakhand':605,'Valle':652,'Valparaiso':657,'Vaupes':652,'Veracruz':652,'Vichada':652,'West Bengal':605,'Yucatan':652,'Zacatecas':652,
'default':660
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
		'USA (46,851,529)','India (34,414,186)','Brazil (21,924,598)','UK (9,448,402)','Russia (8,804,297)','France (7,075,244)','Spain (5,042,803)','Colombia (5,024,263)','Germany (4,957,374)','Italy (4,835,435)','Mexico (3,838,308)','South Africa (2,924,978)','Malaysia (2,528,821)','Netherlands (2,253,031)','Peru (2,211,366)','Thailand (1,996,969)','Czechia (1,856,555)','Canada (1,749,787)','Romania (1,730,433)','Japan (1,724,379)','Chile (1,718,085)','Sweden (1,181,532)','Portugal (1,102,438)','Switzerland (905,112)','Saudi Arabia (549,103)','Slovakia (540,209)','Denmark (412,566)','South Korea (390,719)','Australia (187,041)','China (110,590)','New Zealand (8,306)',
		'------USA------','Sunbelt (19,617,605)','South (19,412,314)','West (10,219,765)','Midwest (9,997,981)','Northeast (7,205,146)','California (4,991,721)','Texas (4,278,542)','Florida (3,781,739)','New York (2,610,806)','Illinois (1,734,077)','Georgia (1,646,532)','Pennsylvania (1,612,997)','Ohio (1,592,093)','North Carolina (1,504,746)','Michigan (1,329,857)','Tennessee (1,295,951)','New Jersey (1,217,512)','Arizona (1,202,485)','Indiana (1,046,985)','Virginia (941,700)','Missouri (941,250)','Wisconsin (917,530)','South Carolina (905,190)','Massachusetts (869,293)','Alabama (838,269)','Minnesota (836,985)','Colorado (779,083)','Louisiana (770,960)','Kentucky (757,431)','Washington (747,478)','Oklahoma (666,814)','Maryland (568,921)','Utah (567,842)','Arkansas (519,533)','Iowa (508,617)','Mississippi (507,867)','Nevada (446,730)','Kansas (445,902)','Connecticut (407,292)','Oregon (376,378)','Nebraska (331,811)','Idaho (299,686)','New Mexico (288,557)','West Virginia (281,291)','Rhode Island (186,598)','Montana (183,220)','South Dakota (158,823)','North Dakota (154,051)','Delaware (146,828)','New Hampshire (146,619)','Alaska (144,300)','Maine (110,372)','Wyoming (106,771)','Hawaii (85,514)','Vermont (43,657)',
		'-----INDIA-----','Maharashtra (6,515,111)','Kerala (4,469,488)','Karnataka (2,966,194)','Tamil Nadu (2,642,030)','Andhra Pradesh (2,036,179)','Uttar Pradesh (1,709,643)','West Bengal (1,560,286)','Odisha (1,018,926)','Chhattisgarh (1,005,014)','Rajasthan (954,238)','Gujarat (825,701)','Madhya Pradesh (792,380)','Haryana (770,705)','Bihar (725,871)','Punjab (601,206)','Jharkhand (348,085)','Uttarakhand (343,355)','Jammu and Kashmir (327,621)','Himachal Pradesh (216,639)','Puducherry (125,258)','Tripura (83,784)','Meghalaya (79,158)','Mizoram (76,591)','Arunachal Pradesh (54,029)','Nagaland (30,743)','Ladakh (20,698)','Ladakh (20,698)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,325,189)','Minas Gerais (2,108,362)','Parana (1,486,523)','Para (1,486,523)','Rio Grande Sul (1,422,778)','Bahia (1,228,507)','Santa Catarina (1,168,503)','Rio de Janeiro State (1,161,182)','Ceara (935,513)','Goias (842,772)','Pernambuco (615,196)','Espirito Santo (575,516)','Mato Grosso (527,194)','Paraiba (436,755)','Amazonas (425,907)','Mato Grosso Sul (371,452)','Rio Grande Norte (366,884)','Maranhao (353,554)','Piaui (318,337)','Sergipe (277,819)','Rondonia (264,785)','Alagoas (237,479)','Tocantins (222,002)','Roraima (126,855)','Amapa (122,643)','Acre (87,925)',
		'-------UK------','England (8,051,924)','Scotland (677,408)','Wales (468,197)',
		'-----RUSSIA----','Volga (0)','Ural (0)','Southern (0)','Siberian (0)','Northwestern (0)','Eastern (0)','Central (0)','Caucasian (0)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (757,496)','Atlantico (330,744)','Cundinamarca (264,501)','Santander (226,645)','Bolivar (158,322)','Tolima (107,620)','Boyaca (105,767)','Cordoba (104,205)','Caldas (100,806)','Magdalena (96,894)','Norte Santander (93,452)','Cesar (89,995)','Narino (89,899)','Meta (89,715)','Huila (88,453)','Risaralda (87,929)','Valle (61,664)','Sucre (59,260)','Quindio (56,954)','Cauca (56,202)','Guajira (43,370)','Casanare (35,671)','Caqueta (22,935)','Putumayo (16,530)','Choco (16,427)','Arauca (13,661)','Amazonas Department (6,845)','Guaviare (5,145)','Vaupes (1,787)',
		'-----MEXICO----','Mexico State (376,227)','Nuevo Leon (205,184)','Guanajuato (191,910)','Jalisco (162,036)','Tabasco (142,982)','Puebla (124,476)','Veracruz (123,079)','Sonora (113,811)','Tamaulipas (102,128)','Queretaro (98,047)','Coahuila (94,841)','Oaxaca (82,205)','Guerrero (76,649)','Yucatan (74,409)','Sinaloa (73,853)','Baja California (73,769)','Michoacan (73,189)','Chihuahua (70,149)','Hidalgo (62,349)','Baja California Sur (56,211)','Morelos (49,776)','Durango (49,058)','Zacatecas (41,740)','Aguascalientes (36,280)','Nayarit (34,009)','Colima (33,224)','Tlaxcala (29,322)','Campeche (24,054)','Chiapas (23,342)',
		'--NETHERLANDS--','Zuid-Holland (535,882)','Noord-Holland (379,306)','Noord-Brabant (347,286)','Gelderland (256,499)','Limburg (156,452)','Overijssel (147,951)','Groningen (54,653)','Flevoland (51,047)','Utrecht (46,982)','Drenthe (44,738)','Zeeland (40,532)','Friesland (16,252)',
		'------PERU-----','Lima Province (823,550)','Lima Region (142,250)','Arequipa Region (115,781)','Callao (101,813)','La Libertad (89,922)','Piura Region (89,673)','Junin (87,280)','Ancash (78,257)','Cusco (74,536)','Cajamarca (66,229)','Lambayeque (62,373)','Ica (59,669)','San Martin (48,894)','Loreto (45,182)','Puno (40,982)','Huanuco (35,838)','Ayacucho (34,346)','Ucayali (32,155)','Amazonas Region (31,965)','Tacna (30,342)','Moquegua (29,763)','Apurimac (26,408)','Tumbes (19,113)','Huancavelica (16,307)','Pasco (15,933)','Madre de Dios (13,953)',
		'-----CANADA----','Ontario (613,453)','Quebec (432,274)','Alberta (328,189)','British Columbia (210,758)','Saskatchewan (79,212)','Manitoba (65,017)','Nova Scotia (7,746)','New Brunswick (7,004)','Newfoundland (2,019)',
		'-----CHILE-----','Biobio (154,845)','Valparaiso (128,276)','Maule (104,936)','Araucania (99,546)','Los Lagos (90,516)','O’Higgins (70,752)','Antofagasta (63,559)','Coquimbo (50,713)','Los Rios (50,232)','Tarapaca (42,820)','Nuble (36,951)','Magallanes (29,405)','Atacama (28,125)','Arica y Parinacota (28,084)','Aysen (8,738)',
		'----SLOVAKIA---','Bratislava (41,568)','Kosice (26,241)','Presov (23,495)','Zilina (23,013)','Nitra (16,315)','Trencin (16,122)','Banska Bystrica (14,789)','Trnava (14,568)',
		'----DENMARK----','Hovedstaden (197,062)','Midtjylland (72,506)','Syddanmark (58,546)','Sjaelland (54,376)','Nordjylland (30,736)',
		'--SAUDI ARABIA-','Ar Riyad (131,375)','Makkah Al Mukarramah (130,487)','Eastern Region (117,789)','Aseer (40,974)','Al Madinah Al Munawwarah (39,524)','Al Qaseem (21,686)','Jazan Province (21,152)','Hail Province (11,733)','Najran Province (10,718)','Tabuk Province (8,585)','Al Bahah (7,166)','Northern Borders (5,250)','Al Jawf (2,709)',
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
