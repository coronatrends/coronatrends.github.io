"use strict";
// custom graph component

var point = {
'Acre':687,'Alagoas':687,'Amapa':687,'Amazonas':687,'Amazonas Department':712,'Amazonas Region':712,'Ancash':712,'Andhra Pradesh':712,'Antioquia':712,'Antofagasta':710,'Apurimac':712,'Arauca':712,'Araucania':710,'Arequipa Region':712,'Arica Y Parinacota':710,'Arunachal Pradesh':712,'Atacama':710,'Atlantico':712,'Ayacucho':712,'Aysen':710,'Bahia':687,'Bihar':712,'Biobio':710,'Bolivar':712,'Boyaca':712,'Brazil':687,'Cajamarca':712,'Caldas':712,'Callao':712,'Caqueta':712,'Casanare':712,'Cauca':712,'Ceara':687,'Cesar':712,'Chhattisgarh':712,'Chile':710,'Choco':712,'Colombia':712,'Coquimbo':710,'Cordoba':712,'Cundinamarca':712,'Cusco':712,'Dadraand N H D D':712,'Drenthe':712,'England':712,'Espirito Santo':687,'Flevoland':712,'Friesland':712,'Gelderland':712,'Germany':712,'Goias':687,'Groningen':712,'Guainia':712,'Guajira':712,'Guaviare':712,'Gujarat':712,'Haryana':712,'Himachal Pradesh':712,'Huancavelica':712,'Huanuco':712,'Huila':712,'ICA':712,'India':712,'Jammu And Kashmir':712,'Jharkhand':712,'Junin':712,'Karnataka':708,'Kerala':712,'La Libertad':712,'Ladakh':712,'Lambayeque':712,'Lima':712,'Lima Province':712,'Lima Region':712,'Limburg':712,'Locations':687,'London':712,'Loreto':712,'Los Lagos':710,'Los Rios':710,'Madhya Pradesh':712,'Madrede Dios':712,'Magallanes':710,'Magdalena':712,'Maharashtra':712,'Maranhao':687,'Mato Grosso':687,'Mato Grosso Sul':687,'Maule':710,'Meghalaya':712,'Meta':712,'Minas Gerais':687,'Mizoram':712,'Moquegua':712,'Nagaland':712,'Narino':712,'Netherlands':712,'New Zealand':712,'Noord Brabant':712,'Noord Holland':712,'Norte Santander':712,'Nuble':710,'O Higgins':710,'Odisha':712,'Overijssel':712,'Para':687,'Paraiba':687,'Parana':687,'Pasco':712,'Pernambuco':687,'Peru':712,'Piaui':687,'Piura Region':712,'Puducherry':712,'Punjab':712,'Puno':712,'Putumayo':712,'Quindio':712,'Rajasthan':712,'Rio De Janeiro State':687,'Rio Grande Norte':687,'Rio Grande Sul':687,'Risaralda':712,'Romania':712,'Rondonia':687,'Roraima':687,'San Andres':712,'San Martin':712,'Santa Catarina':687,'Santander':712,'Santiago':710,'Sao Paulo State':687,'Saudi Arabia':712,'Sergipe':687,'Slovakia':712,'South Africa':709,'Sucre':712,'Tacna':712,'Tamil Nadu':712,'Tarapaca':710,'Tocantins':687,'Tolima':712,'Tripura':712,'Tumbes':712,'Ucayali':712,'UK':712,'Utrecht':712,'Uttar Pradesh':712,'Valle':712,'Valparaiso':710,'Vaupes':712,'Vichada':712,'West Bengal':712,'Zeeland':712,'Zuid Holland':712,
'default':713
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
			'Brazil','USA','United Kingdom','Japan','United Arab Emirates','SouthAfrica','Australia','Argentina','China','Turkey','New Zealand','Colombia','Mexico','Germany','Singapore','Saudi Arabia','Morocco','Chile','Canada','Italy','Israel','Tunisia','Taiwan','Venezuela', 'Spain','India','Egypt','Uganda'
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
		'London','Sydney','Chicago','Mexico City','Montreal','Santiago','Lima',
		'---------------',
		'North America','South America','Latin America','Europe','EU','Balkans','Middle East','Africa','Asia','Oceania',
		'---------------',
		'Governance','Full Democracies','Flawed Democracies','Hybrid Regimes','Less Authoritarian','More Authoritarian',
		'---------------',
		'USA (56,189,547)','India (34,960,261)','Brazil (22,309,081)','UK (13,422,815)','Russia (10,374,292)','France (10,106,833)','Germany (7,258,803)','Spain (6,667,511)','Italy (6,396,110)','Colombia (5,191,021)','Mexico (3,993,464)','South Africa (3,475,512)','Netherlands (3,180,329)','Malaysia (2,767,044)','Czechia (2,483,762)','Peru (2,304,674)','Canada (2,260,875)','Thailand (2,232,485)','Romania (1,813,056)','Chile (1,811,297)','Japan (1,733,901)','Portugal (1,434,570)','Slovakia (1,376,559)','Switzerland (1,371,062)','Sweden (1,314,784)','Denmark (840,037)','South Korea (645,226)','Saudi Arabia (559,852)','Australia (537,308)','China (115,702)','New Zealand (14,365)',
		'------USA------','South (22,193,159)','Sunbelt (22,136,934)','Midwest (12,481,300)','West (11,702,067)','Northeast (9,789,420)','California (5,603,200)','Texas (4,751,252)','Florida (4,392,176)','New York (3,684,347)','Illinois (2,245,053)','Pennsylvania (2,101,019)','Ohio (2,073,964)','Georgia (1,839,879)','Michigan (1,776,237)','North Carolina (1,751,679)','New Jersey (1,646,156)','Tennessee (1,454,896)','Arizona (1,404,635)','Indiana (1,278,478)','Massachusetts (1,173,704)','Virginia (1,159,066)','Wisconsin (1,132,419)','Missouri (1,090,953)','Minnesota (1,029,120)','South Carolina (975,325)','Colorado (954,659)','Alabama (913,603)','Washington (882,812)','Kentucky (879,434)','Louisiana (867,135)','Maryland (827,047)','Oklahoma (718,216)','Utah (651,920)','Iowa (583,552)','Arkansas (574,574)','Mississippi (561,351)','Kansas (535,014)','Connecticut (533,866)','Nevada (497,353)','Oregon (430,932)','Nebraska (381,423)','New Mexico (357,480)','West Virginia (337,363)','Idaho (321,856)','Rhode Island (231,452)','New Hampshire (204,527)','Montana (198,527)','Delaware (190,163)','South Dakota (179,985)','North Dakota (175,102)','Alaska (160,089)','Maine (146,754)','Hawaii (121,888)','Wyoming (116,716)','Vermont (67,595)',
		'-----INDIA-----','Maharashtra (6,699,868)','Kerala (5,252,414)','Karnataka (3,009,557)','Tamil Nadu (2,751,128)','Andhra Pradesh (2,077,486)','Uttar Pradesh (1,712,547)','West Bengal (1,649,150)','Odisha (1,055,556)','Chhattisgarh (1,008,756)','Rajasthan (956,883)','Gujarat (833,768)','Madhya Pradesh (794,240)','Haryana (774,917)','Bihar (727,529)','Punjab (605,526)','Jharkhand (353,777)','Uttarakhand (345,464)','Jammu and Kashmir (341,624)','Himachal Pradesh (229,016)','Mizoram (141,736)','Puducherry (129,529)','Tripura (85,084)','Meghalaya (84,799)','Arunachal Pradesh (55,344)','Nagaland (32,165)','Ladakh (22,220)','Dadra and NHDD (10,559)',
		'-----BRAZIL----','Sao Paulo State (4,447,229)','Minas Gerais (2,213,035)','Parana (1,585,165)','Para (1,585,165)','Rio Grande Sul (1,497,262)','Rio de Janeiro State (1,348,861)','Bahia (1,264,224)','Santa Catarina (1,236,468)','Ceara (952,669)','Goias (942,205)','Pernambuco (642,496)','Espirito Santo (623,699)','Mato Grosso (550,495)','Paraiba (462,240)','Amazonas (430,992)','Rio Grande Norte (383,729)','Mato Grosso Sul (379,389)','Maranhao (366,751)','Piaui (333,121)','Rondonia (280,199)','Sergipe (278,691)','Alagoas (241,764)','Tocantins (233,814)','Roraima (128,696)','Amapa (125,161)','Acre (88,254)',
		'-------UK------','England (11,408,560)','Scotland (966,027)','Wales (668,473)',
		'-----RUSSIA----','Central (4,027,375)','Ural (1,724,201)','Northwestern (1,686,858)','Volga (1,500,893)','Siberian (938,087)','Eastern (825,356)','Southern (768,043)','Caucasian (358,389)',
		'----COLOMBIA---','Antioquia (800,483)','Atlantico (345,011)','Cundinamarca (268,696)','Santander (235,864)','Bolivar (163,158)','Tolima (108,866)','Boyaca (107,512)','Cordoba (105,198)','Norte Santander (102,386)','Caldas (102,147)','Magdalena (101,695)','Cesar (93,360)','Narino (91,260)','Meta (91,246)','Huila (90,119)','Risaralda (90,112)','Valle (64,066)','Sucre (59,921)','Quindio (59,451)','Cauca (57,960)','Guajira (47,271)','Casanare (36,242)','Caqueta (23,145)','Putumayo (17,953)','Choco (16,608)','Arauca (14,534)','Amazonas Department (7,088)','Guaviare (5,186)','Vaupes (1,797)',
		'-----MEXICO----','Mexico State (384,959)','Nuevo Leon (210,836)','Guanajuato (204,636)','Jalisco (166,822)','Tabasco (144,817)','Puebla (126,905)','Veracruz (124,991)','Sonora (123,839)','Tamaulipas (104,853)','Coahuila (102,491)','Queretaro (100,649)','Baja California (92,092)','Oaxaca (84,226)','Chihuahua (81,148)','Guerrero (77,618)','Yucatan (76,368)','Sinaloa (75,874)','Michoacan (74,043)','Hidalgo (63,581)','Baja California Sur (63,147)','Durango (51,212)','Morelos (50,854)','Zacatecas (43,403)','Aguascalientes (39,423)','Nayarit (34,745)','Colima (33,505)','Tlaxcala (29,699)','Campeche (24,449)','Chiapas (23,672)',
		'--NETHERLANDS--','Zuid-Holland (724,110)','Noord-Holland (527,129)','Noord-Brabant (487,123)','Gelderland (361,850)','Limburg (232,800)','Overijssel (204,613)','Groningen (75,711)','Flevoland (73,762)','Zeeland (65,372)','Utrecht (65,141)','Drenthe (64,444)','Friesland (16,252)',
		'------PERU-----','Lima Province (870,351)','Lima Region (147,098)','Arequipa Region (118,405)','Callao (104,763)','Piura Region (95,501)','La Libertad (94,186)','Junin (90,140)','Ancash (81,727)','Cusco (76,512)','Cajamarca (67,754)','Lambayeque (65,303)','Ica (61,829)','San Martin (49,494)','Loreto (45,451)','Puno (42,423)','Huanuco (37,078)','Ayacucho (35,206)','Amazonas Region (33,059)','Ucayali (32,374)','Tacna (31,771)','Moquegua (30,444)','Apurimac (26,867)','Tumbes (19,660)','Huancavelica (16,671)','Pasco (16,481)','Madre de Dios (14,126)',
		'-----CANADA----','Ontario (783,526)','Quebec (651,327)','Alberta (361,623)','British Columbia (254,849)','Manitoba (85,507)','Saskatchewan (85,188)','New Brunswick (16,820)','Nova Scotia (10,199)','Newfoundland (5,582)',
		'-----CHILE-----','Biobio (167,762)','Valparaiso (138,268)','Maule (109,774)','Araucania (104,150)','Los Lagos (99,380)','O’Higgins (73,210)','Antofagasta (66,965)','Coquimbo (54,839)','Los Rios (53,839)','Tarapaca (45,165)','Nuble (39,501)','Atacama (30,824)','Magallanes (30,194)','Arica y Parinacota (29,120)','Aysen (10,311)',
		'----SLOVAKIA---','Bratislava (66,910)','Kosice (40,265)','Zilina (35,757)','Presov (32,310)','Trnava (23,614)','Nitra (23,571)','Trencin (23,392)','Banska Bystrica (22,151)',
		'----DENMARK----','Hovedstaden (390,289)','Midtjylland (149,158)','Syddanmark (124,183)','Sjaelland (113,698)','Nordjylland (62,613)',
		'--SAUDI ARABIA-','Ar Riyad (135,008)','Makkah Al Mukarramah (134,795)','Eastern Region (119,252)','Aseer (41,136)','Al Madinah Al Munawwarah (40,034)','Al Qaseem (21,854)','Jazan Province (21,282)','Hail Province (11,762)','Najran Province (10,756)','Tabuk Province (8,685)','Al Bahah (7,244)','Northern Borders (5,335)','Al Jawf (2,709)',
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
