"use strict";
// custom graph component

var point = {
'Acre':605,'Alagoas':605,'Amapa':605,'Amazonas':605,'Amazonas Department':625,'Amazonas Region':630,'Ancash':630,'Andhra Pradesh':605,'Antioquia':625,'Antofagasta':629,'Apurimac':630,'Arauca':625,'Araucania':629,'Arequipa Region':630,'Arica Y Parinacota':629,'Arunachal Pradesh':605,'Assam':605,'Atacama':629,'Atlantico':625,'Auvergne Rhone Alpes':569,'Ayacucho':630,'Aysen':629,'Bahia':605,'Bihar':605,'Biobio':629,'Bolivar':625,'Bourgogne Franche Comte':569,'Boyaca':625,'Brazil':605,'Bretagne':569,'Cajamarca':630,'Caldas':625,'Callao':630,'Caqueta':625,'Casanare':625,'Cauca':625,'Ceara':605,'Centre Val De Loire':569,'Cesar':625,'Chhattisgarh':605,'Chile':629,'Choco':625,'Colombia':625,'Coquimbo':629,'Cordoba':625,'Corse':569,'Cundinamarca':625,'Cusco':630,'Dadraand N H D D':605,'Espirito Santo':605,'France':569,'Goias':605,'Grand Est':569,'Guainia':625,'Guajira':625,'Guaviare':625,'Gujarat':605,'Haryana':605,'Hauts De France':569,'Himachal Pradesh':605,'Huancavelica':630,'Huanuco':630,'Huila':625,'ICA':630,'Ile De France':569,'India':605,'Jammu And Kashmir':605,'Jharkhand':605,'Junin':630,'Karnataka':605,'Kerala':605,'La Libertad':630,'Ladakh':605,'Lambayeque':630,'Lima':630,'Lima Province':630,'Lima Region':630,'Locations':605,'Loreto':630,'Los Lagos':629,'Los Rios':629,'Madhya Pradesh':605,'Madrede Dios':630,'Magallanes':629,'Magdalena':625,'Maharashtra':605,'Maranhao':605,'Mato Grosso':605,'Mato Grosso Sul':605,'Maule':629,'Meghalaya':605,'Meta':625,'Minas Gerais':605,'Mizoram':605,'Montreal':605,'Moquegua':630,'Nagaland':605,'Narino':625,'New Zealand':1,'Normandie':569,'Norte Santander':625,'Nouvelle Aquitaine':569,'Nuble':629,'O Higgins':629,'Occitanie':569,'Odisha':605,'Para':605,'Paraiba':605,'Parana':605,'Pasco':630,'Pays De La Loire':569,'Pernambuco':605,'Peru':630,'Piaui':605,'Piura Region':630,'Provence Alpes Cote Dazur':569,'Puducherry':605,'Punjab':605,'Puno':630,'Putumayo':625,'Quindio':625,'Rajasthan':605,'Rio De Janeiro State':605,'Rio Grande Norte':605,'Rio Grande Sul':605,'Risaralda':625,'Rondonia':605,'Roraima':605,'San Andres':625,'San Martin':630,'Santa Catarina':605,'Santander':625,'Santiago':629,'Sao Paulo State':605,'Sergipe':605,'Sucre':625,'Tacna':630,'Tamil Nadu':605,'Tarapaca':629,'Telangana':605,'Tocantins':605,'Tolima':625,'Tripura':605,'Tumbes':630,'Ucayali':630,'Uttar Pradesh':605,'Uttarakhand':605,'Valle':625,'Valparaiso':629,'Vaupes':625,'Vichada':625,'West Bengal':605,
'default':631
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
		'USA (44,684,150)','India (34,020,730)','Brazil (21,597,949)','UK (8,272,883)','Russia (7,742,899)','France (6,890,619)','Spain (4,980,206)','Colombia (4,975,656)','Italy (4,707,087)','Germany (4,343,591)','Mexico (3,738,749)','South Africa (2,913,880)','Malaysia (2,361,529)','Peru (2,186,246)','Netherlands (2,033,005)','Thailand (1,740,428)','Japan (1,713,471)','Czechia (1,705,532)','Canada (1,678,498)','Chile (1,664,725)','Romania (1,398,264)','Sweden (1,160,465)','Portugal (1,077,186)','Switzerland (852,658)','Saudi Arabia (547,761)','Slovakia (429,886)','Denmark (365,840)','South Korea (337,679)','Australia (136,188)','China (108,872)','New Zealand (4,831)',
		'------USA------','Sunbelt (19,031,365)','South (18,870,799)','West (9,615,978)','Midwest (9,361,310)','Northeast (6,826,028)','California (4,797,268)','Texas (4,163,227)','Florida (3,725,714)','New York (2,488,230)','Illinois (1,667,176)','Georgia (1,611,870)','Pennsylvania (1,491,146)','Ohio (1,481,672)','North Carolina (1,446,997)','Tennessee (1,263,042)','Michigan (1,210,700)','New Jersey (1,180,133)','Arizona (1,124,744)','Indiana (991,653)','Missouri (911,724)','Virginia (897,982)','South Carolina (880,989)','Wisconsin (847,067)','Massachusetts (829,873)','Alabama (810,501)','Louisiana (757,815)','Minnesota (749,398)','Kentucky (720,018)','Colorado (698,990)','Washington (690,339)','Oklahoma (648,990)','Maryland (546,559)','Utah (526,575)','Arkansas (505,772)','Mississippi (496,941)','Iowa (478,878)','Nevada (429,824)','Kansas (422,243)','Connecticut (395,723)','Oregon (346,485)','Nebraska (311,895)','Idaho (273,678)','New Mexico (262,078)','West Virginia (255,815)','Rhode Island (180,031)','Montana (162,247)','South Dakota (149,338)','North Dakota (139,566)','Delaware (138,567)','New Hampshire (128,689)','Alaska (125,804)','Wyoming (96,132)','Maine (95,851)','Hawaii (81,814)','Vermont (36,352)',
		'-----INDIA-----','Maharashtra (6,515,111)','Kerala (4,469,488)','Karnataka (2,966,194)','Tamil Nadu (2,642,030)','Andhra Pradesh (2,036,179)','Uttar Pradesh (1,709,643)','West Bengal (1,560,286)','Odisha (1,018,926)','Chhattisgarh (1,005,014)','Rajasthan (954,238)','Gujarat (825,701)','Madhya Pradesh (792,380)','Haryana (770,705)','Bihar (725,871)','Punjab (601,206)','Jharkhand (348,085)','Uttarakhand (343,355)','Jammu and Kashmir (327,621)','Himachal Pradesh (216,639)','Puducherry (125,258)','Tripura (83,784)','Meghalaya (79,158)','Mizoram (76,591)','Arunachal Pradesh (54,029)','Nagaland (30,743)','Ladakh (20,698)','Ladakh (20,698)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,325,189)','Minas Gerais (2,108,362)','Parana (1,486,523)','Para (1,486,523)','Rio Grande Sul (1,422,778)','Bahia (1,228,507)','Santa Catarina (1,168,503)','Rio de Janeiro State (1,161,182)','Ceara (935,513)','Goias (842,772)','Pernambuco (615,196)','Espirito Santo (575,516)','Mato Grosso (527,194)','Paraiba (436,755)','Amazonas (425,907)','Mato Grosso Sul (371,452)','Rio Grande Norte (366,884)','Maranhao (353,554)','Piaui (318,337)','Sergipe (277,819)','Rondonia (264,785)','Alagoas (237,479)','Tocantins (222,002)','Roraima (126,855)','Amapa (122,643)','Acre (87,925)',
		'-------UK------','England (7,073,467)','Scotland (599,837)','Wales (389,152)',
		'-----RUSSIA----','Central (3,124,356)','Northwestern (1,267,970)','Volga (1,040,873)','Siberian (665,658)','Southern (551,266)','Ural (477,211)','Eastern (461,393)','Caucasian (272,954)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (748,824)','Atlantico (323,241)','Cundinamarca (263,834)','Santander (225,475)','Bolivar (156,678)','Tolima (107,423)','Boyaca (105,399)','Cordoba (103,961)','Caldas (100,423)','Magdalena (94,678)','Norte Santander (90,858)','Narino (89,600)','Cesar (89,202)','Meta (88,697)','Huila (88,266)','Risaralda (87,694)','Valle (61,033)','Sucre (59,100)','Quindio (56,325)','Cauca (55,880)','Guajira (42,569)','Casanare (35,561)','Caqueta (22,864)','Choco (16,397)','Putumayo (16,305)','Arauca (13,329)','Amazonas Department (6,833)','Guaviare (5,135)','Vaupes (1,750)',
		'-----MEXICO----','Mexico State (368,845)','Nuevo Leon (200,675)','Guanajuato (181,214)','Jalisco (157,965)','Tabasco (139,066)','Puebla (122,105)','Veracruz (120,440)','Sonora (109,781)','Tamaulipas (99,597)','Queretaro (95,297)','Coahuila (90,992)','Oaxaca (79,603)','Guerrero (75,553)','Sinaloa (72,604)','Michoacan (72,091)','Yucatan (71,852)','Chihuahua (66,596)','Baja California (63,754)','Hidalgo (61,201)','Baja California Sur (55,639)','Morelos (49,250)','Durango (48,017)','Zacatecas (41,087)','Aguascalientes (34,795)','Nayarit (33,449)','Colima (32,656)','Tlaxcala (28,901)','Campeche (23,431)','Chiapas (22,728)',
		'------PERU-----','Lima Province (812,219)','Lima Region (141,118)','Arequipa Region (114,992)','Callao (100,878)','La Libertad (88,335)','Piura Region (87,819)','Junin (86,231)','Ancash (77,395)','Cusco (73,631)','Cajamarca (65,833)','Lambayeque (61,537)','Ica (58,901)','San Martin (48,668)','Loreto (45,062)','Puno (40,224)','Huanuco (35,580)','Ayacucho (33,871)','Ucayali (32,095)','Amazonas Region (31,641)','Tacna (29,804)','Moquegua (29,617)','Apurimac (26,174)','Tumbes (18,783)','Huancavelica (16,175)','Pasco (15,796)','Madre de Dios (13,867)',
		'--NETHERLANDS--','Zuid-Holland (488,040)','Noord-Holland (349,822)','Noord-Brabant (317,838)','Gelderland (225,676)','Limburg (135,050)','Overijssel (132,396)','Groningen (50,408)','Flevoland (45,398)','Utrecht (43,526)','Drenthe (40,267)','Zeeland (35,023)','Friesland (16,252)',
		'-----CANADA----','Ontario (601,232)','Quebec (417,187)','Alberta (312,285)','British Columbia (195,186)','Saskatchewan (73,057)','Manitoba (61,796)','Nova Scotia (7,033)','New Brunswick (5,449)','Newfoundland (1,873)',
		'-----CHILE-----','Biobio (151,923)','Valparaiso (124,100)','Maule (102,316)','Araucania (98,516)','Los Lagos (89,240)','O’Higgins (69,094)','Antofagasta (61,788)','Los Rios (49,492)','Coquimbo (49,100)','Tarapaca (41,810)','Nuble (36,213)','Magallanes (29,256)','Atacama (27,511)','Arica y Parinacota (27,505)','Aysen (8,386)',
		'----SLOVAKIA---','Bratislava (96,744)','Nitra (95,327)','Trnava (93,757)','Banska Bystrica (89,042)','Kosice (21,438)','Zilina (16,871)','Presov (16,292)','Trencin (13,485)',
		'----DENMARK----','Hovedstaden (171,630)','Midtjylland (65,686)','Syddanmark (51,587)','Sjaelland (46,778)','Nordjylland (27,340)',
		'--SAUDI ARABIA-','Ar Riyad (130,885)','Makkah Al Mukarramah (130,101)','Eastern Region (117,615)','Aseer (40,943)','Al Madinah Al Munawwarah (39,433)','Al Qaseem (21,626)','Jazan Province (21,111)','Hail Province (11,715)','Najran Province (10,695)','Tabuk Province (8,555)','Al Bahah (7,162)','Northern Borders (5,249)','Al Jawf (2,707)',
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
