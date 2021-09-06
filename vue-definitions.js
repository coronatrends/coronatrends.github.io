"use strict";
// custom graph component

var point = {
'Acre':580,'Alagoas':580,'Amapa':580,'Amazonas':580,'Amazonas Department':589,'Amazonas Region':590,'Ancash':590,'Antioquia':589,'Antofagasta':591,'Apurimac':590,'Arauca':589,'Araucania':591,'Arequipa Region':590,'Arica Y Parinacota':591,'Atacama':591,'Atlantico':589,'Auvergne Rhone Alpes':569,'Ayacucho':590,'Aysen':591,'Bahia':580,'Biobio':591,'Bolivar':589,'Bourgogne Franche Comte':569,'Boyaca':589,'Brazil':580,'Bretagne':569,'Cajamarca':590,'Caldas':589,'Callao':590,'Caqueta':589,'Casanare':589,'Cauca':589,'Ceara':580,'Centre Val De Loire':569,'Cesar':589,'Chile':591,'Choco':589,'Colombia':589,'Coquimbo':591,'Cordoba':589,'Corse':569,'Cundinamarca':589,'Cusco':590,'Denmark':590,'Espirito Santo':580,'France':569,'Goias':580,'Grand Est':569,'Guainia':589,'Guajira':589,'Guaviare':589,'Hauts De France':569,'Hovedstaden':590,'Huancavelica':590,'Huanuco':590,'Huila':589,'ICA':590,'Ile De France':569,'Junin':590,'La Libertad':590,'Lambayeque':590,'Lima':590,'Lima Province':590,'Lima Region':590,'Locations':580,'Loreto':590,'Los Lagos':591,'Los Rios':591,'Madrede Dios':590,'Magallanes':591,'Magdalena':589,'Maranhao':580,'Mato Grosso':580,'Mato Grosso Sul':580,'Maule':591,'Meta':589,'Midtjylland':590,'Minas Gerais':580,'Moquegua':590,'Narino':589,'Nordjylland':590,'Normandie':569,'Norte Santander':589,'Nouvelle Aquitaine':569,'Nuble':591,'O Higgins':591,'Occitanie':569,'Para':580,'Paraiba':580,'Parana':580,'Pasco':590,'Pays De La Loire':569,'Pernambuco':580,'Peru':590,'Piaui':580,'Piura Region':590,'Provence Alpes Cote Dazur':569,'Puno':590,'Putumayo':589,'Quindio':589,'Rio De Janeiro State':580,'Rio Grande Norte':580,'Rio Grande Sul':580,'Risaralda':589,'Rondonia':580,'Roraima':580,'San Andres':589,'San Martin':590,'Santa Catarina':580,'Santander':589,'Santiago':591,'Sao Paulo State':580,'Scotland':591,'Sergipe':580,'Sjaelland':590,'Slovakia':587,'Sucre':589,'Sweden':590,'Syddanmark':590,'Tacna':590,'Tarapaca':591,'Tocantins':580,'Tolima':589,'Tumbes':590,'Ucayali':590,'UK':590,'Valle':589,'Valparaiso':591,'Vaupes':589,'Vichada':589,'Wales':591,
'default':592
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
		'USA (39,906,426)','India (32,988,673)','Brazil (20,877,864)','UK (6,941,611)','Russia (6,894,113)','France (6,676,210)','Colombia (4,916,980)','Italy (4,566,126)','Germany (4,014,858)','Mexico (3,420,880)','South Africa (2,814,014)','Peru (2,154,132)','Netherlands (1,951,886)','Malaysia (1,824,439)','Czechia (1,680,354)','Chile (1,640,666)','Japan (1,562,476)','Canada (1,520,879)','Thailand (1,265,082)','Sweden (1,130,525)','Romania (1,104,766)','Switzerland (785,696)','Saudi Arabia (543,318)','Slovakia (395,861)','Denmark (348,347)','South Korea (258,913)','China (107,223)','Australia (61,619)','New Zealand (3,768)',
		'------USA------','Sunbelt (17,142,895)','South (16,661,166)','West (8,613,338)','Midwest (8,269,872)','Northeast (6,243,806)','California (4,412,363)','Texas (3,701,612)','Florida (3,353,100)','New York (2,297,973)','Illinois (1,544,747)','Georgia (1,433,714)','Pennsylvania (1,315,748)','Ohio (1,248,938)','North Carolina (1,244,420)','New Jersey (1,104,813)','Tennessee (1,079,202)','Michigan (1,072,370)','Arizona (1,027,394)','Indiana (873,673)','Missouri (844,777)','Virginia (778,302)','Massachusetts (765,584)','South Carolina (752,383)','Wisconsin (741,296)','Alabama (719,280)','Louisiana (704,331)','Minnesota (655,682)','Colorado (622,531)','Kentucky (592,865)','Washington (576,479)','Oklahoma (571,529)','Maryland (502,236)','Utah (469,603)','Arkansas (462,723)','Mississippi (446,952)','Iowa (409,709)','Nevada (394,864)','Kansas (378,082)','Connecticut (375,139)','Oregon (283,874)','Nebraska (247,340)','New Mexico (235,390)','Idaho (226,588)','West Virginia (196,521)','Rhode Island (166,454)','South Dakota (133,861)','Montana (129,498)','Delaware (121,996)','North Dakota (119,397)','New Hampshire (111,082)','Alaska (90,673)','Maine (78,090)','Wyoming (77,279)','Hawaii (66,802)','Vermont (28,923)',
		'-----INDIA-----','Maharashtra (6,482,117)','Kerala (4,181,137)','Karnataka (2,954,047)','Tamil Nadu (2,621,086)','Andhra Pradesh (2,019,702)','Uttar Pradesh (1,709,427)','West Bengal (1,551,364)','Odisha (1,010,753)','Chhattisgarh (1,004,611)','Rajasthan (954,126)','Gujarat (825,475)','Madhya Pradesh (792,237)','Haryana (770,543)','Bihar (725,745)','Punjab (600,780)','Jharkhand (347,916)','Uttarakhand (343,084)','Jammu and Kashmir (325,830)','Himachal Pradesh (214,408)','Puducherry (124,051)','Tripura (83,194)','Meghalaya (76,719)','Mizoram (62,817)','Arunachal Pradesh (53,303)','Nagaland (30,265)','Ladakh (20,574)','Ladakh (20,574)','Dadra and NHDD (10,528)',
		'-----BRAZIL----','Sao Paulo State (4,214,553)','Minas Gerais (2,044,357)','Parana (1,444,035)','Para (1,444,035)','Rio Grande Sul (1,400,644)','Bahia (1,215,040)','Santa Catarina (1,145,063)','Rio de Janeiro State (1,107,794)','Ceara (929,060)','Goias (798,488)','Pernambuco (603,827)','Espirito Santo (556,977)','Mato Grosso (509,839)','Paraiba (430,730)','Amazonas (423,146)','Mato Grosso Sul (366,340)','Rio Grande Norte (364,070)','Maranhao (346,125)','Piaui (314,921)','Sergipe (277,194)','Rondonia (262,081)','Alagoas (234,201)','Tocantins (216,824)','Roraima (122,975)','Amapa (122,288)','Acre (87,682)',
		'-------UK------','England (5,992,390)','Scotland (443,080)','Wales (288,640)',
		'-----RUSSIA----','Central (2,842,647)','Northwestern (1,125,314)','Volga (891,599)','Siberian (586,809)','Southern (477,420)','Ural (417,375)','Eastern (411,466)','Caucasian (241,324)',
		'-----FRANCE----','Ile-de-France (123,011)','Auvergne-Rhone-Alpes (64,308)','Provence-Alpes-Cote d’Azur (50,603)','Grand Est (49,118)','Hauts-de-France (48,533)','Occitanie (27,829)','Bourgogne-Franche-Comte (25,161)','Nouvelle-Aquitaine (21,892)','Normandie (18,387)','Pays de la Loire (16,348)','Centre-Val de Loire (15,463)','Bretagne (9,954)','Corse (1,268)',
		'----COLOMBIA---','Antioquia (736,391)','Atlantico (314,042)','Cundinamarca (262,403)','Santander (224,044)','Bolivar (154,832)','Tolima (106,882)','Boyaca (104,776)','Cordoba (103,186)','Caldas (99,867)','Magdalena (92,123)','Norte Santander (89,042)','Narino (88,783)','Cesar (88,159)','Huila (87,817)','Meta (87,432)','Risaralda (87,139)','Valle (60,382)','Sucre (58,735)','Quindio (55,683)','Cauca (55,116)','Guajira (42,061)','Casanare (35,331)','Caqueta (22,695)','Choco (16,267)','Putumayo (16,087)','Arauca (13,129)','Amazonas Department (6,795)','Guaviare (5,112)','Vaupes (1,744)',
		'-----MEXICO----','Mexico State (341,759)','Nuevo Leon (182,884)','Guanajuato (158,131)','Jalisco (137,912)','Tabasco (117,681)','Puebla (109,436)','Veracruz (107,319)','Sonora (102,494)','Tamaulipas (88,608)','Queretaro (86,907)','Coahuila (83,355)','Guerrero (70,032)','Oaxaca (69,531)','Sinaloa (68,665)','Michoacan (66,121)','Yucatan (63,266)','Chihuahua (63,249)','Baja California (57,434)','Hidalgo (55,962)','Baja California Sur (53,999)','Durango (44,908)','Morelos (43,134)','Zacatecas (38,891)','Aguascalientes (31,675)','Nayarit (30,277)','Colima (27,384)','Tlaxcala (25,926)','Campeche (20,597)','Chiapas (20,176)',
		'------PERU-----','Lima Province (798,672)','Lima Region (140,109)','Arequipa Region (113,586)','Callao (99,622)','La Libertad (86,926)','Piura Region (86,087)','Junin (84,199)','Ancash (76,005)','Cusco (72,247)','Cajamarca (65,040)','Lambayeque (60,729)','Ica (57,869)','San Martin (48,213)','Loreto (44,827)','Puno (38,790)','Huanuco (35,267)','Ayacucho (33,109)','Ucayali (31,998)','Amazonas Region (31,244)','Tacna (29,565)','Moquegua (29,354)','Apurimac (25,845)','Tumbes (18,401)','Huancavelica (15,979)','Pasco (15,611)','Madre de Dios (13,798)',
		'--NETHERLANDS--','Zuid-Holland (0)','Zeeland (0)','Utrecht (0)','Overijssel (0)','Noord-Holland (0)','Noord-Brabant (0)','Limburg (0)','Groningen (0)','Gelderland (0)','Friesland (0)','Flevoland (0)','Drenthe (0)',
		'-----CHILE-----','Biobio (150,394)','Valparaiso (122,574)','Maule (101,150)','Araucania (97,919)','Los Lagos (88,494)','O’Higgins (68,290)','Antofagasta (60,593)','Los Rios (49,196)','Coquimbo (48,378)','Tarapaca (41,060)','Nuble (35,782)','Magallanes (29,243)','Atacama (27,099)','Arica y Parinacota (26,652)','Aysen (8,177)',
		'-----CANADA----','Ontario (576,512)','Quebec (392,029)','Alberta (256,985)','British Columbia (168,325)','Manitoba (58,845)','Saskatchewan (55,750)','Nova Scotia (6,047)','New Brunswick (2,798)','Newfoundland (1,491)',
		'----SLOVAKIA---','Kosice (98,342)','Nitra (92,802)','Bratislava (92,093)','Trnava (90,440)','Banska Bystrica (84,173)','Zilina (14,617)','Presov (14,289)','Trencin (12,609)',
		'----DENMARK----','Hovedstaden (162,371)','Midtjylland (63,037)','Syddanmark (48,852)','Sjaelland (44,140)','Nordjylland (26,161)',
		'--SAUDI ARABIA-','Ar Riyad (130,099)','Makkah Al Mukarramah (129,531)','Eastern Region (117,358)','Aseer (40,836)','Al Madinah Al Munawwarah (39,249)','Al Qaseem (21,480)','Jazan Province (20,962)','Hail Province (11,665)','Najran Province (10,595)','Tabuk Province (8,482)','Al Bahah (7,134)','Northern Borders (5,204)','Al Jawf (2,648)',
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
