"use strict";
// custom graph component

var point = {
'Aguascalientes':522,'Amazonas Region':558,'Ancash':558,'Antofagasta':556,'Apurimac':558,'Araucania':556,'Arequipa Region':558,'Arica Y Parinacota':556,'Atacama':556,'Ayacucho':558,'Aysen':556,'Baja California':522,'Baja California Sur':522,'Biobio':556,'Cajamarca':558,'Callao':558,'Campeche':522,'Chiapas':522,'Chihuahua':522,'Chile':556,'Coahuila':522,'Colima':522,'Coquimbo':556,'Cusco':558,'Denmark':19,'Durango':522,'Guanajuato':522,'Guerrero':522,'Hidalgo':522,'Hovedstaden':19,'Huancavelica':558,'Huanuco':558,'ICA':558,'Jalisco':522,'Junin':558,'La Libertad':558,'Lambayeque':558,'Lima':558,'Lima Province':558,'Lima Region':558,'Loreto':558,'Los Lagos':556,'Los Rios':556,'Madrede Dios':558,'Magallanes':556,'Maule':556,'Mexico':522,'Mexico City':522,'Mexico State':522,'Michoacan':522,'Midtjylland':19,'Montreal':551,'Moquegua':558,'Morelos':522,'Nayarit':522,'Nordjylland':19,'Nuble':556,'Nuevo Leon':522,'O Higgins':556,'Oaxaca':522,'Pasco':558,'Peru':558,'Piura Region':558,'Puebla':522,'Puno':558,'Queretaro':522,'San Martin':558,'Santiago':556,'Sinaloa':522,'Sjaelland':19,'Sonora':522,'Syddanmark':19,'Tabasco':522,'Tacna':558,'Tamaulipas':522,'Tarapaca':556,'Tlaxcala':522,'Tumbes':558,'Ucayali':558,'Valparaiso':556,'Veracruz':522,'Yucatan':522,'Zacatecas':522,
'default':559
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
		'USA (35,131,393)','India (31,726,507)','Brazil (19,953,501)','Russia (6,230,482)','France (6,063,402)','UK (5,902,354)','Colombia (4,801,050)','Italy (4,358,533)','Germany (3,779,797)','Mexico (2,861,498)','Peru (2,114,445)','Netherlands (1,869,909)','Czechia (1,673,769)','Chile (1,617,852)','Canada (1,439,020)','Saudi Arabia (526,814)','Denmark (318,485)','South Korea (202,203)','China (105,279)','Australia (34,836)','New Zealand (2,877)',
		'------USA------','Sunbelt (14,545,544)','South (13,883,925)','West (7,701,685)','Midwest (7,592,816)','Northeast (5,868,389)','California (3,984,330)','Texas (3,153,326)','Florida (2,634,882)','New York (2,155,718)','Illinois (1,431,697)','Pennsylvania (1,232,248)','Georgia (1,186,858)','Ohio (1,132,331)','North Carolina (1,063,758)','New Jersey (1,045,193)','Michigan (1,012,838)','Arizona (931,423)','Tennessee (912,768)','Indiana (774,290)','Missouri (759,194)','Massachusetts (721,885)','Virginia (698,394)','Wisconsin (689,349)','South Carolina (623,952)','Minnesota (613,589)','Alabama (589,110)','Colorado (577,486)','Louisiana (560,297)','Kentucky (487,237)','Oklahoma (486,235)','Washington (476,982)','Maryland (469,549)','Utah (434,891)','Arkansas (389,310)','Iowa (380,174)','Nevada (359,201)','Connecticut (355,580)','Mississippi (348,585)','Kansas (333,947)','Nebraska (228,470)','Oregon (221,801)','New Mexico (211,492)','Idaho (202,407)','West Virginia (167,718)','Rhode Island (158,705)','South Dakota (125,232)','Montana (116,643)','Delaware (111,946)','North Dakota (111,705)','New Hampshire (103,495)','Alaska (76,238)','Maine (70,487)','Wyoming (65,540)','Hawaii (43,251)','Vermont (25,078)',
		'-----INDIA-----','Maharashtra (6,315,063)','Kerala (3,425,473)','Karnataka (2,908,284)','Tamil Nadu (2,563,544)','Andhra Pradesh (1,970,008)','Uttar Pradesh (1,708,500)','West Bengal (1,529,295)','Chhattisgarh (1,002,458)','Odisha (979,737)','Rajasthan (953,704)','Gujarat (824,921)','Madhya Pradesh (791,862)','Haryana (769,956)','Bihar (724,917)','Punjab (599,162)','Jharkhand (347,197)','Uttarakhand (342,198)','Jammu and Kashmir (321,725)','Himachal Pradesh (206,369)','Puducherry (121,061)','Tripura (78,719)','Meghalaya (65,891)','Arunachal Pradesh (48,566)','Mizoram (39,363)','Nagaland (27,967)','Ladakh (20,345)','Ladakh (20,345)','Dadra and NHDD (10,513)',
		'-----BRAZIL----','Sao Paulo State (4,063,680)','Minas Gerais (1,975,547)','Parana (1,383,358)','Para (1,383,358)','Rio Grande Sul (1,369,579)','Bahia (1,194,954)','Santa Catarina (1,115,302)','Rio de Janeiro State (1,033,477)','Ceara (919,544)','Goias (743,677)','Pernambuco (591,952)','Espirito Santo (543,654)','Mato Grosso (488,640)','Paraiba (422,675)','Amazonas (417,119)','Rio Grande Norte (359,801)','Mato Grosso Sul (356,742)','Maranhao (337,357)','Piaui (309,956)','Sergipe (274,732)','Rondonia (258,143)','Alagoas (230,131)','Tocantins (210,704)','Amapa (121,342)','Roraima (120,159)','Acre (87,186)',
		'-----RUSSIA----','Central (2,653,496)','Northwestern (1,018,656)','Volga (779,453)','Siberian (511,462)','Southern (409,075)','Ural (365,442)','Eastern (364,731)','Caucasian (209,870)',
		'-----FRANCE----','Ile-de-France (122,060)','Auvergne-Rhone-Alpes (63,822)','Provence-Alpes-Cote d’Azur (49,609)','Grand Est (48,857)','Hauts-de-France (48,245)','Occitanie (27,070)','Bourgogne-Franche-Comte (24,953)','Nouvelle-Aquitaine (21,477)','Normandie (18,157)','Pays de la Loire (16,200)','Centre-Val de Loire (15,365)','Bretagne (9,841)','Corse (1,205)',
		'-------UK------','England (5,173,082)','Scotland (347,005)','Wales (243,249)',
		'----COLOMBIA---','Antioquia (716,358)','Atlantico (308,526)','Cundinamarca (257,661)','Santander (219,629)','Bolivar (151,278)','Tolima (105,167)','Boyaca (102,948)','Cordoba (99,927)','Caldas (98,409)','Magdalena (88,738)','Narino (86,816)','Norte Santander (86,669)','Cesar (86,653)','Huila (85,768)','Meta (85,638)','Risaralda (85,633)','Valle (59,521)','Sucre (57,744)','Quindio (54,523)','Cauca (52,236)','Guajira (41,445)','Casanare (34,276)','Caqueta (22,150)','Choco (16,011)','Putumayo (15,499)','Arauca (12,786)','Amazonas Department (6,628)','Guaviare (5,015)','Vaupes (1,727)',
		'-----MEXICO----','Mexico State (293,257)','Nuevo Leon (143,529)','Guanajuato (138,946)','Jalisco (106,911)','Puebla (91,430)','Sonora (89,012)','Tabasco (88,127)','Veracruz (81,047)','Queretaro (74,013)','Tamaulipas (73,374)','Coahuila (73,209)','Chihuahua (60,342)','Sinaloa (57,934)','Oaxaca (55,456)','Yucatan (54,551)','Michoacan (54,036)','Baja California (52,784)','Guerrero (52,303)','Baja California Sur (49,387)','Hidalgo (44,669)','Durango (37,629)','Morelos (37,132)','Zacatecas (33,454)','Aguascalientes (27,946)','Tlaxcala (21,322)','Nayarit (19,319)','Colima (16,208)','Campeche (14,792)','Chiapas (14,780)',
		'------PERU-----','Lima Province (786,068)','Lima Region (138,947)','Arequipa Region (110,362)','Callao (98,456)','La Libertad (85,668)','Piura Region (84,643)','Junin (81,797)','Ancash (74,794)','Cusco (70,487)','Cajamarca (63,988)','Lambayeque (59,113)','Ica (56,428)','San Martin (47,499)','Loreto (44,205)','Puno (37,250)','Huanuco (34,733)','Ayacucho (31,952)','Ucayali (31,886)','Amazonas Region (30,756)','Tacna (29,099)','Moquegua (28,373)','Apurimac (25,496)','Tumbes (17,929)','Huancavelica (15,653)','Pasco (15,189)','Madre de Dios (13,674)',
		'--NETHERLANDS--','Zuid-Holland (446,422)','Noord-Holland (321,260)','Noord-Brabant (299,914)','Gelderland (207,828)','Limburg (124,622)','Overijssel (121,319)','Groningen (46,155)','Flevoland (40,210)','Utrecht (39,769)','Drenthe (36,908)','Zeeland (32,142)','Friesland (16,252)',
		'-----CHILE-----','Biobio (148,367)','Valparaiso (120,339)','Maule (99,603)','Araucania (96,661)','Los Lagos (87,454)','O’Higgins (67,396)','Antofagasta (59,624)','Los Rios (48,445)','Coquimbo (47,582)','Tarapaca (40,265)','Nuble (35,280)','Magallanes (29,127)','Atacama (26,719)','Arica y Parinacota (26,325)','Aysen (8,053)',
		'-----CANADA----','Ontario (558,036)','Quebec (377,798)','Alberta (234,295)','British Columbia (149,889)','Manitoba (57,593)','Saskatchewan (50,096)','Nova Scotia (5,887)','New Brunswick (2,383)','Newfoundland (1,440)',
		'----DENMARK----','Hovedstaden (597)','Midtjylland (295)','Syddanmark (256)','Sjaelland (208)','Nordjylland (103)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (126,608)','Ar Riyad (126,457)','Eastern Region (115,226)','Aseer (39,369)','Al Madinah Al Munawwarah (38,298)','Al Qaseem (20,296)','Jazan Province (19,448)','Hail Province (11,112)','Najran Province (9,874)','Tabuk Province (8,110)','Al Bahah (6,864)','Northern Borders (4,892)','Al Jawf (2,398)',
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
