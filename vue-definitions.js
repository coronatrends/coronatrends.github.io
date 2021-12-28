"use strict";
// custom graph component

var point = {
'Acre':687,'Alagoas':687,'Amapa':687,'Amazonas':687,'Amazonas Department':699,'Amazonas Region':705,'Ancash':705,'Andhra Pradesh':605,'Antioquia':699,'Antofagasta':703,'Apurimac':705,'Arauca':699,'Araucania':703,'Arequipa Region':705,'Arica Y Parinacota':703,'Arunachal Pradesh':605,'Assam':605,'Atacama':703,'Atlantico':699,'Australia':702,'Auvergne Rhone Alpes':569,'Ayacucho':705,'Aysen':703,'Bahia':687,'Bihar':605,'Biobio':703,'Bolivar':699,'Bourgogne Franche Comte':569,'Boyaca':699,'Brazil':687,'Bretagne':569,'Cajamarca':705,'Caldas':699,'Callao':705,'Caqueta':699,'Casanare':699,'Cauca':699,'Ceara':687,'Centre Val De Loire':569,'Cesar':699,'Chhattisgarh':605,'Chile':703,'Choco':699,'Colombia':699,'Coquimbo':703,'Cordoba':699,'Corse':569,'Cundinamarca':699,'Cusco':705,'Dadraand N H D D':605,'England':705,'Espirito Santo':687,'France':569,'Goias':687,'Grand Est':569,'Guainia':699,'Guajira':699,'Guaviare':699,'Gujarat':605,'Haryana':605,'Hauts De France':569,'Himachal Pradesh':605,'Huancavelica':705,'Huanuco':705,'Huila':699,'ICA':705,'Ile De France':569,'India':605,'Jammu And Kashmir':605,'Japan':700,'Jharkhand':605,'Johannesburg':491,'Junin':705,'Karnataka':605,'Kerala':605,'La Libertad':705,'Ladakh':605,'Lambayeque':705,'Lima':705,'Lima Province':705,'Lima Region':705,'Locations':687,'London':705,'Loreto':705,'Los Lagos':703,'Los Rios':703,'Madhya Pradesh':605,'Madrede Dios':705,'Magallanes':703,'Magdalena':699,'Maharashtra':605,'Maranhao':687,'Mato Grosso':687,'Mato Grosso Sul':687,'Maule':703,'Meghalaya':605,'Meta':699,'Minas Gerais':687,'Mizoram':605,'Montreal':605,'Moquegua':705,'Nagaland':605,'Narino':699,'New Zealand':1,'Normandie':569,'Norte Santander':699,'Nouvelle Aquitaine':569,'Nuble':703,'O Higgins':703,'Occitanie':569,'Odisha':605,'Para':687,'Paraiba':687,'Parana':687,'Pasco':705,'Pays De La Loire':569,'Pernambuco':687,'Peru':705,'Piaui':687,'Piura Region':705,'Portugal':699,'Provence Alpes Cote Dazur':569,'Puducherry':605,'Punjab':605,'Puno':705,'Putumayo':699,'Quindio':699,'Rajasthan':605,'Rio De Janeiro State':687,'Rio Grande Norte':687,'Rio Grande Sul':687,'Risaralda':699,'Rondonia':687,'Roraima':687,'San Andres':699,'San Martin':705,'Santa Catarina':687,'Santander':699,'Santiago':703,'Sao Paulo State':687,'Scotland':702,'Sergipe':687,'South Korea':702,'Sucre':699,'Sweden':701,'Sydney':702,'Tacna':705,'Tamil Nadu':605,'Tarapaca':703,'Telangana':605,'Tocantins':687,'Tolima':699,'Tripura':605,'Tumbes':705,'Ucayali':705,'UK':702,'Uttar Pradesh':605,'Uttarakhand':605,'Valle':699,'Valparaiso':703,'Vaupes':699,'Vichada':699,'Wales':705,'West Bengal':605,
'default':706
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
		'USA (52,793,407)','India (34,799,691)','Brazil (22,250,218)','UK (12,209,991)','Russia (10,236,301)','France (8,941,762)','Germany (7,028,398)','Spain (5,932,626)','Italy (5,678,112)','Colombia (5,127,971)','Mexico (3,951,003)','South Africa (3,417,318)','Netherlands (3,076,442)','Malaysia (2,743,936)','Czechia (2,447,758)','Peru (2,279,299)','Thailand (2,212,407)','Canada (2,014,358)','Romania (1,803,311)','Chile (1,801,033)','Japan (1,730,735)','Slovakia (1,351,450)','Portugal (1,286,119)','Sweden (1,273,313)','Switzerland (1,263,588)','Denmark (673,807)','South Korea (615,532)','Saudi Arabia (553,319)','Australia (281,314)','China (114,206)','New Zealand (13,932)',
		'------USA------','Sunbelt (20,908,836)','South (20,777,599)','Midwest (11,878,677)','West (11,174,952)','Northeast (8,824,602)','California (5,327,222)','Texas (4,530,709)','Florida (3,988,171)','New York (3,221,354)','Illinois (2,083,605)','Pennsylvania (1,965,567)','Ohio (1,941,301)','Georgia (1,760,410)','Michigan (1,681,401)','North Carolina (1,614,424)','New Jersey (1,457,199)','Tennessee (1,384,625)','Arizona (1,362,728)','Indiana (1,221,490)','Wisconsin (1,089,058)','Massachusetts (1,069,310)','Virginia (1,067,868)','Missouri (1,059,399)','Minnesota (1,000,568)','South Carolina (944,582)','Colorado (896,565)','Alabama (870,627)','Kentucky (846,755)','Washington (835,094)','Louisiana (809,858)','Oklahoma (710,134)','Maryland (668,790)','Utah (628,484)','Iowa (572,990)','Arkansas (551,398)','Mississippi (532,649)','Kansas (512,934)','Connecticut (489,211)','Nevada (477,946)','Oregon (414,142)','Nebraska (368,189)','New Mexico (345,663)','West Virginia (322,522)','Idaho (317,770)','Rhode Island (222,047)','New Hampshire (196,103)','Montana (196,051)','South Dakota (176,190)','Delaware (174,077)','North Dakota (171,552)','Alaska (156,177)','Maine (141,803)','Wyoming (114,697)','Hawaii (102,413)','Vermont (62,008)',
		'-----INDIA-----','Maharashtra (6,515,111)','Kerala (4,469,488)','Karnataka (2,966,194)','Tamil Nadu (2,642,030)','Andhra Pradesh (2,036,179)','Uttar Pradesh (1,709,643)','West Bengal (1,560,286)','Odisha (1,018,926)','Chhattisgarh (1,005,014)','Rajasthan (954,238)','Gujarat (825,701)','Madhya Pradesh (792,380)','Haryana (770,705)','Bihar (725,871)','Punjab (601,206)','Jharkhand (348,085)','Uttarakhand (343,355)','Jammu and Kashmir (327,621)','Himachal Pradesh (216,639)','Puducherry (125,258)','Tripura (83,784)','Meghalaya (79,158)','Mizoram (76,591)','Arunachal Pradesh (54,029)','Nagaland (30,743)','Ladakh (20,698)','Ladakh (20,698)','Dadra and NHDD (10,533)',
		'-----BRAZIL----','Sao Paulo State (4,447,229)','Minas Gerais (2,213,035)','Parana (1,585,165)','Para (1,585,165)','Rio Grande Sul (1,497,262)','Rio de Janeiro State (1,348,861)','Bahia (1,264,224)','Santa Catarina (1,236,468)','Ceara (952,669)','Goias (942,205)','Pernambuco (642,496)','Espirito Santo (623,699)','Mato Grosso (550,495)','Paraiba (462,240)','Amazonas (430,992)','Rio Grande Norte (383,729)','Mato Grosso Sul (379,389)','Maranhao (366,751)','Piaui (333,121)','Rondonia (280,199)','Sergipe (278,691)','Alagoas (241,764)','Tocantins (233,814)','Roraima (128,696)','Amapa (125,161)','Acre (88,254)',
		'-------UK------','England (10,277,058)','Scotland (831,158)','Wales (582,372)',
		'-----RUSSIA----','Central (3,984,959)','Ural (1,724,201)','Northwestern (1,664,726)','Volga (1,481,765)','Siberian (920,274)','Eastern (825,356)','Southern (757,451)','Caucasian (353,446)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (779,701)','Atlantico (341,643)','Cundinamarca (267,000)','Santander (234,123)','Bolivar (161,419)','Tolima (108,390)','Boyaca (106,729)','Cordoba (104,743)','Caldas (101,537)','Norte Santander (101,286)','Magdalena (101,028)','Cesar (92,809)','Narino (90,772)','Meta (90,645)','Huila (89,482)','Risaralda (89,112)','Valle (63,667)','Sucre (59,735)','Quindio (58,793)','Cauca (57,368)','Guajira (46,876)','Casanare (36,105)','Caqueta (23,071)','Putumayo (17,688)','Choco (16,565)','Arauca (14,413)','Amazonas Department (7,002)','Guaviare (5,169)','Vaupes (1,796)',
		'-----MEXICO----','Mexico State (382,355)','Nuevo Leon (208,948)','Guanajuato (202,176)','Jalisco (165,490)','Tabasco (144,183)','Puebla (126,410)','Veracruz (124,692)','Sonora (122,529)','Tamaulipas (104,130)','Coahuila (101,139)','Queretaro (100,018)','Baja California (89,802)','Oaxaca (83,902)','Chihuahua (79,252)','Guerrero (77,430)','Yucatan (75,716)','Sinaloa (75,477)','Michoacan (73,845)','Hidalgo (63,084)','Baja California Sur (59,382)','Morelos (51,016)','Durango (50,743)','Zacatecas (42,661)','Aguascalientes (38,661)','Nayarit (34,532)','Colima (33,452)','Tlaxcala (29,628)','Campeche (24,266)','Chiapas (23,614)',
		'--NETHERLANDS--','Zuid-Holland (704,167)','Noord-Holland (509,013)','Noord-Brabant (474,352)','Gelderland (352,654)','Limburg (228,128)','Overijssel (199,338)','Groningen (73,040)','Flevoland (71,362)','Zeeland (63,422)','Utrecht (62,975)','Drenthe (62,383)','Friesland (16,252)',
		'------PERU-----','Lima Province (856,798)','Lima Region (146,038)','Arequipa Region (117,705)','Callao (103,837)','Piura Region (94,529)','La Libertad (93,434)','Junin (89,507)','Ancash (81,153)','Cusco (75,882)','Cajamarca (67,368)','Lambayeque (64,545)','Ica (61,305)','San Martin (49,380)','Loreto (45,409)','Puno (42,178)','Huanuco (36,852)','Ayacucho (35,097)','Amazonas Region (32,792)','Ucayali (32,332)','Tacna (31,506)','Moquegua (30,269)','Apurimac (26,802)','Tumbes (19,566)','Huancavelica (16,610)','Pasco (16,376)','Madre de Dios (14,092)',
		'-----CANADA----','Ontario (697,388)','Quebec (546,436)','Alberta (346,705)','British Columbia (235,658)','Saskatchewan (82,640)','Manitoba (75,717)','New Brunswick (12,226)','Nova Scotia (9,988)','Newfoundland (2,512)',
		'-----CHILE-----','Biobio (166,529)','Valparaiso (137,324)','Maule (109,429)','Araucania (103,536)','Los Lagos (98,725)','O’Higgins (73,025)','Antofagasta (66,603)','Coquimbo (54,528)','Los Rios (53,391)','Tarapaca (44,709)','Nuble (39,309)','Atacama (30,635)','Magallanes (30,052)','Arica y Parinacota (29,062)','Aysen (10,238)',
		'----SLOVAKIA---','Bratislava (65,701)','Kosice (39,718)','Zilina (35,067)','Presov (32,081)','Trnava (23,158)','Nitra (23,099)','Trencin (23,081)','Banska Bystrica (21,918)',
		'----DENMARK----','Hovedstaden (335,918)','Midtjylland (123,558)','Syddanmark (102,837)','Sjaelland (96,113)','Nordjylland (51,156)',
		'--SAUDI ARABIA-','Ar Riyad (133,216)','Makkah Al Mukarramah (132,182)','Eastern Region (118,407)','Aseer (41,055)','Al Madinah Al Munawwarah (39,765)','Al Qaseem (21,758)','Jazan Province (21,213)','Hail Province (11,748)','Najran Province (10,734)','Tabuk Province (8,645)','Al Bahah (7,206)','Northern Borders (5,283)','Al Jawf (2,709)',
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
