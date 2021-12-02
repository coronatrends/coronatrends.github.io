"use strict";
// custom graph component

var point = {
'Acre':605,'Aguascalientes':672,'Alagoas':605,'Amapa':605,'Amazonas':605,'Amazonas Department':679,'Amazonas Region':679,'Ancash':679,'Andhra Pradesh':605,'Antioquia':679,'Antofagasta':678,'Apurimac':679,'Arauca':679,'Araucania':678,'Arequipa Region':679,'Arica Y Parinacota':678,'Arunachal Pradesh':605,'Assam':605,'Atacama':678,'Atlantico':679,'Auvergne Rhone Alpes':569,'Ayacucho':679,'Aysen':678,'Bahia':605,'Baja California':672,'Baja California Sur':672,'Bihar':605,'Biobio':678,'Bolivar':679,'Bourgogne Franche Comte':569,'Boyaca':679,'Brazil':605,'Bretagne':569,'Cajamarca':679,'Caldas':679,'Callao':679,'Campeche':672,'Caqueta':679,'Casanare':679,'Cauca':679,'Ceara':605,'Centre Val De Loire':569,'Cesar':679,'Chhattisgarh':605,'Chiapas':672,'Chihuahua':672,'Chile':678,'Choco':679,'Coahuila':672,'Colima':672,'Colombia':679,'Coquimbo':678,'Cordoba':679,'Corse':569,'Cundinamarca':679,'Cusco':679,'Dadraand N H D D':605,'Durango':672,'England':679,'Espirito Santo':605,'France':569,'Goias':605,'Grand Est':569,'Guainia':679,'Guajira':679,'Guanajuato':672,'Guaviare':679,'Guerrero':672,'Gujarat':605,'Haryana':605,'Hauts De France':569,'Hidalgo':672,'Himachal Pradesh':605,'Huancavelica':679,'Huanuco':679,'Huila':679,'ICA':679,'Ile De France':569,'India':605,'Jalisco':672,'Jammu And Kashmir':605,'Jharkhand':605,'Johannesburg':658,'Junin':679,'Karnataka':605,'Kerala':605,'La Libertad':679,'Ladakh':605,'Lambayeque':679,'Lima':679,'Lima Province':679,'Lima Region':679,'Locations':605,'London':679,'Loreto':679,'Los Lagos':678,'Los Rios':678,'Madhya Pradesh':605,'Madrede Dios':679,'Magallanes':678,'Magdalena':679,'Maharashtra':605,'Maranhao':605,'Mato Grosso':605,'Mato Grosso Sul':605,'Maule':678,'Meghalaya':605,'Meta':679,'Mexico':672,'Mexico City':672,'Mexico State':672,'Michoacan':672,'Minas Gerais':605,'Mizoram':605,'Montreal':605,'Moquegua':679,'Morelos':672,'Nagaland':605,'Narino':679,'Nayarit':672,'Normandie':569,'Norte Santander':679,'Nouvelle Aquitaine':569,'Nuble':678,'Nuevo Leon':672,'O Higgins':678,'Oaxaca':672,'Occitanie':569,'Odisha':605,'Para':605,'Paraiba':605,'Parana':605,'Pasco':679,'Pays De La Loire':569,'Pernambuco':605,'Peru':679,'Piaui':605,'Piura Region':679,'Provence Alpes Cote Dazur':569,'Puducherry':605,'Puebla':672,'Punjab':605,'Puno':679,'Putumayo':679,'Queretaro':672,'Quindio':679,'Rajasthan':605,'Rio De Janeiro State':605,'Rio Grande Norte':605,'Rio Grande Sul':605,'Risaralda':679,'Rondonia':605,'Roraima':605,'San Andres':679,'San Martin':679,'Santa Catarina':605,'Santander':679,'Santiago':678,'Sao Paulo State':605,'Saudi Arabia':679,'Scotland':679,'Sergipe':605,'Sinaloa':672,'Slovakia':679,'Sonora':672,'South Africa':659,'South Korea':679,'Sucre':679,'Sweden':679,'Tabasco':672,'Tacna':679,'Tamaulipas':672,'Tamil Nadu':605,'Tarapaca':678,'Telangana':605,'Tlaxcala':672,'Tocantins':605,'Tolima':679,'Tripura':605,'Tumbes':679,'Ucayali':679,'UK':679,'Uttar Pradesh':605,'Uttarakhand':605,'Valle':679,'Valparaiso':678,'Vaupes':679,'Veracruz':672,'Vichada':679,'Wales':679,'West Bengal':605,'Yucatan':672,'Zacatecas':672,
'default':680
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
		'USA (48,692,492)','India (34,606,541)','Brazil (22,105,872)','UK (10,276,007)','Russia (9,500,836)','France (7,535,587)','Germany (5,999,020)','Spain (5,174,720)','Colombia (5,071,817)','Italy (5,043,620)','Mexico (3,891,218)','South Africa (2,976,613)','Netherlands (2,661,691)','Malaysia (2,638,221)','Peru (2,236,351)','Czechia (2,172,084)','Thailand (2,120,758)','Canada (1,804,081)','Romania (1,780,808)','Chile (1,764,274)','Japan (1,726,751)','Sweden (1,207,498)','Slovakia (1,182,562)','Portugal (1,151,919)','Switzerland (1,025,129)','Saudi Arabia (549,786)','Denmark (492,521)','South Korea (457,612)','Australia (213,360)','China (111,450)','New Zealand (11,895)',
		'------USA------','Sunbelt (19,975,863)','South (19,764,460)','Midwest (10,699,029)','West (10,585,635)','Northeast (7,624,336)','California (5,088,411)','Texas (4,342,052)','Florida (3,810,822)','New York (2,739,277)','Illinois (1,822,431)','Pennsylvania (1,744,526)','Ohio (1,700,462)','Georgia (1,668,481)','North Carolina (1,544,115)','Michigan (1,495,383)','Tennessee (1,322,011)','Arizona (1,272,978)','New Jersey (1,260,226)','Indiana (1,107,382)','Wisconsin (986,290)','Missouri (984,044)','Virginia (971,706)','Massachusetts (924,400)','South Carolina (919,191)','Minnesota (916,156)','Alabama (846,333)','Colorado (832,797)','Kentucky (789,601)','Louisiana (779,164)','Washington (775,572)','Oklahoma (687,521)','Utah (598,272)','Maryland (587,292)','Iowa (537,545)','Arkansas (530,507)','Mississippi (514,728)','Kansas (470,552)','Nevada (458,638)','Connecticut (422,785)','Oregon (392,198)','Nebraska (348,651)','New Mexico (316,089)','Idaho (308,614)','West Virginia (296,087)','Rhode Island (195,799)','Montana (191,599)','South Dakota (167,153)','New Hampshire (166,047)','North Dakota (162,980)','Delaware (154,849)','Alaska (151,323)','Maine (120,629)','Wyoming (111,348)','Hawaii (87,796)','Vermont (50,647)',
		'-----INDIA-----','Maharashtra (6,515,111)','Kerala (4,469,488)','Karnataka (2,966,194)','Tamil Nadu (2,642,030)','Andhra Pradesh (2,036,179)','Uttar Pradesh (1,709,643)','West Bengal (1,560,286)','Odisha (1,018,926)','Chhattisgarh (1,005,014)','Rajasthan (954,238)','Gujarat (825,701)','Madhya Pradesh (792,380)','Haryana (770,705)','Bihar (725,871)','Punjab (601,206)','Jharkhand (348,085)','Uttarakhand (343,355)','Jammu and Kashmir (327,621)','Himachal Pradesh (216,639)','Puducherry (125,258)','Tripura (83,784)','Meghalaya (79,158)','Mizoram (76,591)','Arunachal Pradesh (54,029)','Nagaland (30,743)','Ladakh (20,698)','Ladakh (20,698)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,325,189)','Minas Gerais (2,108,362)','Parana (1,486,523)','Para (1,486,523)','Rio Grande Sul (1,422,778)','Bahia (1,228,507)','Santa Catarina (1,168,503)','Rio de Janeiro State (1,161,182)','Ceara (935,513)','Goias (842,772)','Pernambuco (615,196)','Espirito Santo (575,516)','Mato Grosso (527,194)','Paraiba (436,755)','Amazonas (425,907)','Mato Grosso Sul (371,452)','Rio Grande Norte (366,884)','Maranhao (353,554)','Piaui (318,337)','Sergipe (277,819)','Rondonia (264,785)','Alagoas (237,479)','Tocantins (222,002)','Roraima (126,855)','Amapa (122,643)','Acre (87,925)',
		'-------UK------','England (8,713,738)','Scotland (730,331)','Wales (510,999)',
		'-----RUSSIA----','Central (3,760,358)','Ural (1,724,201)','Northwestern (1,550,852)','Volga (1,361,816)','Siberian (830,960)','Eastern (825,356)','Southern (694,771)','Caucasian (327,548)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (770,045)','Atlantico (339,144)','Cundinamarca (266,236)','Santander (230,864)','Bolivar (160,512)','Tolima (108,127)','Boyaca (106,372)','Cordoba (104,581)','Caldas (101,280)','Magdalena (99,995)','Norte Santander (98,837)','Cesar (91,792)','Narino (90,414)','Meta (90,185)','Huila (88,989)','Risaralda (88,491)','Valle (63,085)','Sucre (59,652)','Quindio (58,036)','Cauca (56,848)','Guajira (45,800)','Casanare (35,921)','Caqueta (22,996)','Putumayo (17,086)','Choco (16,502)','Arauca (14,076)','Amazonas Department (6,909)','Guaviare (5,158)','Vaupes (1,795)',
		'-----MEXICO----','Mexico State (379,161)','Nuevo Leon (207,089)','Guanajuato (196,638)','Jalisco (163,415)','Tabasco (143,696)','Puebla (125,812)','Veracruz (123,954)','Sonora (118,138)','Tamaulipas (103,153)','Queretaro (99,153)','Coahuila (98,018)','Oaxaca (83,263)','Baja California (81,310)','Guerrero (77,049)','Yucatan (75,165)','Sinaloa (74,602)','Michoacan (73,623)','Chihuahua (73,529)','Hidalgo (62,715)','Baja California Sur (57,089)','Morelos (50,410)','Durango (49,871)','Zacatecas (42,078)','Aguascalientes (37,220)','Nayarit (34,216)','Colima (33,324)','Tlaxcala (29,460)','Campeche (24,177)','Chiapas (23,522)',
		'--NETHERLANDS--','Zuid-Holland (616,864)','Noord-Holland (440,627)','Noord-Brabant (411,050)','Gelderland (306,624)','Limburg (195,084)','Overijssel (174,897)','Groningen (62,820)','Flevoland (60,730)','Utrecht (54,255)','Drenthe (52,885)','Zeeland (52,303)','Friesland (16,252)',
		'------PERU-----','Lima Province (836,200)','Lima Region (143,480)','Arequipa Region (116,356)','Callao (102,566)','Piura Region (91,890)','La Libertad (91,234)','Junin (87,949)','Ancash (79,320)','Cusco (75,036)','Cajamarca (66,578)','Lambayeque (63,046)','Ica (60,245)','San Martin (49,069)','Loreto (45,239)','Puno (41,466)','Huanuco (36,071)','Ayacucho (34,671)','Amazonas Region (32,224)','Ucayali (32,208)','Tacna (30,744)','Moquegua (29,857)','Apurimac (26,570)','Tumbes (19,340)','Huancavelica (16,388)','Pasco (16,098)','Madre de Dios (13,997)',
		'-----CANADA----','Ontario (627,723)','Quebec (449,366)','Alberta (335,677)','British Columbia (218,812)','Saskatchewan (81,074)','Manitoba (67,999)','New Brunswick (8,411)','Nova Scotia (8,322)','Newfoundland (2,059)',
		'-----CHILE-----','Biobio (160,869)','Valparaiso (133,636)','Maule (107,669)','Araucania (101,543)','Los Lagos (94,365)','O’Higgins (72,201)','Antofagasta (65,319)','Coquimbo (52,847)','Los Rios (51,754)','Tarapaca (44,079)','Nuble (38,163)','Magallanes (29,639)','Atacama (29,550)','Arica y Parinacota (28,538)','Aysen (9,659)',
		'----SLOVAKIA---','Bratislava (53,680)','Kosice (33,350)','Zilina (29,794)','Presov (28,746)','Trencin (20,005)','Nitra (19,262)','Banska Bystrica (18,744)','Trnava (18,625)',
		'----DENMARK----','Hovedstaden (232,073)','Midtjylland (83,622)','Syddanmark (70,686)','Sjaelland (65,618)','Nordjylland (36,233)',
		'--SAUDI ARABIA-','Ar Riyad (131,607)','Makkah Al Mukarramah (130,687)','Eastern Region (117,869)','Aseer (40,994)','Al Madinah Al Munawwarah (39,561)','Al Qaseem (21,700)','Jazan Province (21,177)','Hail Province (11,735)','Najran Province (10,723)','Tabuk Province (8,600)','Al Bahah (7,174)','Northern Borders (5,250)','Al Jawf (2,709)',
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
