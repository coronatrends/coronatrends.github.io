"use strict";
// custom graph component

var point = {
'Aguascalientes':785,'Amazonas Department':728,'Amazonas Region':786,'Ancash':786,'Andhra Pradesh':786,'Antioquia':728,'Apurimac':786,'Arauca':728,'Arequipa Region':786,'Arunachal Pradesh':786,'Atlantico':728,'Australia':748,'Ayacucho':786,'Baja California':785,'Baja California Sur':785,'Bihar':786,'Bolivar':728,'Boyaca':728,'Cajamarca':786,'Caldas':728,'Callao':786,'Campeche':785,'Caqueta':728,'Casanare':728,'Cauca':728,'Caucasian':1,'Central':1,'Cesar':728,'Chhattisgarh':786,'Chiapas':785,'Chihuahua':785,'Choco':728,'Coahuila':785,'Colima':785,'Colombia':728,'Cordoba':728,'Cundinamarca':728,'Cusco':786,'Dadraand N H D D':786,'Durango':785,'Eastern':1,'England':786,'Germany':762,'Guainia':728,'Guajira':728,'Guanajuato':785,'Guaviare':728,'Guerrero':785,'Gujarat':786,'Haryana':786,'Hidalgo':785,'Himachal Pradesh':786,'Huancavelica':786,'Huanuco':786,'Huila':728,'ICA':786,'India':786,'Jalisco':785,'Jammu And Kashmir':786,'Japan':758,'Jharkhand':786,'Junin':786,'Karnataka':786,'Kerala':786,'La Libertad':786,'Ladakh':786,'Lambayeque':786,'Lima':786,'Lima Province':786,'Lima Region':786,'London':786,'Loreto':786,'Madhya Pradesh':786,'Madrede Dios':786,'Magdalena':728,'Maharashtra':786,'Meghalaya':786,'Meta':728,'Mexico':785,'Mexico City':785,'Mexico State':785,'Michoacan':785,'Mizoram':786,'Moquegua':786,'Morelos':785,'Nagaland':786,'Narino':728,'Nayarit':785,'New Zealand':1,'Norte Santander':728,'Northwestern':1,'Nuevo Leon':785,'Oaxaca':785,'Odisha':786,'Pasco':786,'Peru':786,'Piura Region':786,'Portugal':782,'Puducherry':786,'Puebla':785,'Punjab':786,'Puno':786,'Putumayo':728,'Queretaro':785,'Quindio':728,'Rajasthan':786,'Risaralda':728,'Russia':1,'San Andres':728,'San Martin':786,'Santander':728,'Siberian':1,'Sinaloa':785,'Slovakia':786,'Sonora':785,'South Africa':710,'South Korea':719,'Southern':1,'Sucre':728,'Sweden':786,'Sydney':748,'Tabasco':785,'Tacna':786,'Tamaulipas':785,'Tamil Nadu':786,'Tlaxcala':785,'Tolima':728,'Tripura':786,'Tumbes':786,'Ucayali':786,'Ural':1,'Uttar Pradesh':786,'Valle':728,'Vaupes':728,'Veracruz':785,'Vichada':728,'Volga':1,'Wales':786,'West Bengal':786,'Yucatan':785,'Zacatecas':785,
'default':787
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
		'USA (79,717,247)','India (43,006,080)','Brazil (29,584,800)','France (23,297,675)','UK (20,093,762)','Germany (18,585,957)','Russia (17,264,828)','Italy (13,724,411)','Spain (11,324,637)','South Korea (9,038,938)','Netherlands (7,519,238)','Colombia (6,079,896)','Japan (6,016,178)','Mexico (5,624,954)','Malaysia (3,951,678)','Czechia (3,724,368)','South Africa (3,700,484)','Peru (3,540,108)','Portugal (3,458,727)','Canada (3,400,764)','Chile (3,368,704)','Thailand (3,328,973)','Switzerland (3,268,953)','Denmark (2,993,571)','Romania (2,810,630)','Australia (2,781,633)','Sweden (2,475,687)','Slovakia (2,333,162)','China (1,143,717)','Saudi Arabia (749,373)','New Zealand (471,225)',
		'------USA------','Sunbelt (32,118,330)','South (31,488,670)','West (18,066,735)','Midwest (16,845,423)','Northeast (13,398,168)','California (9,086,740)','Texas (6,687,899)','Florida (6,255,159)','New York (4,958,932)','Illinois (3,059,685)','Pennsylvania (2,773,762)','Ohio (2,667,332)','North Carolina (2,636,951)','Georgia (2,483,925)','Michigan (2,378,984)','New Jersey (2,190,575)','Tennessee (2,023,212)','Arizona (1,992,506)','Indiana (1,688,969)','Massachusetts (1,685,937)','Virginia (1,661,528)','Wisconsin (1,580,426)','Missouri (1,480,336)','South Carolina (1,465,763)','Washington (1,447,233)','Minnesota (1,442,218)','Colorado (1,331,016)','Kentucky (1,306,928)','Alabama (1,291,195)','Louisiana (1,174,190)','Oklahoma (1,115,664)','Maryland (1,008,185)','Utah (926,689)','Arkansas (828,890)','Mississippi (793,545)','Iowa (788,121)','Kansas (770,203)','Connecticut (731,868)','Nevada (710,285)','Oregon (701,218)','New Mexico (516,173)','Nebraska (512,811)','West Virginia (496,534)','Idaho (443,096)','Rhode Island (392,364)','New Hampshire (301,386)','Montana (272,122)','Delaware (259,102)','Alaska (244,887)','North Dakota (239,472)','Hawaii (238,788)','South Dakota (236,866)','Maine (234,003)','Wyoming (155,982)','Vermont (129,341)',
		'-----INDIA-----','Maharashtra (7,871,230)','Kerala (6,522,254)','Karnataka (3,943,804)','Tamil Nadu (3,451,769)','Andhra Pradesh (2,318,861)','Uttar Pradesh (2,069,782)','West Bengal (2,016,477)','Odisha (1,286,691)','Rajasthan (1,281,927)','Gujarat (1,237,287)','Chhattisgarh (1,151,688)','Madhya Pradesh (1,040,322)','Haryana (984,058)','Bihar (830,359)','Punjab (758,791)','Jammu and Kashmir (453,425)','Uttarakhand (436,926)','Jharkhand (434,949)','Himachal Pradesh (284,155)','Mizoram (220,863)','Puducherry (165,754)','Tripura (100,854)','Meghalaya (93,634)','Arunachal Pradesh (64,468)','Nagaland (35,417)','Ladakh (28,172)','Dadra and NHDD (11,300)',
		'-----BRAZIL----','Tocantins ()','Sergipe ()','Sao Paulo State ()','Santa Catarina ()','Roraima ()','Rondonia ()','Rio de Janeiro State ()','Rio Grande Sul ()','Rio Grande Norte ()','Piaui ()','Pernambuco ()','Parana ()','Paraiba ()','Para ()','Minas Gerais ()','Mato Grosso Sul ()','Mato Grosso ()','Maranhao ()','Goias ()','Espirito Santo ()','Ceara ()','Bahia ()','Amazonas ()','Amapa ()','Alagoas ()','Acre ()',
		'-------UK------','Wales ()','Scotland ()','England ()',
		'-----RUSSIA----','Volga (0)','Ural (0)','Southern (0)','Siberian (0)','Northwestern (0)','Eastern (0)','Central (0)','Caucasian (0)',
		'--NETHERLANDS--','Zuid-Holland (1,558,238)','Noord-Holland (1,218,356)','Noord-Brabant (1,166,313)','Gelderland (897,084)','Utrecht (608,437)','Overijssel (512,783)','Limburg (497,340)','Groningen (221,084)','Drenthe (178,559)','Flevoland (168,878)','Zeeland (153,871)','Friesland (16,252)',
		'----COLOMBIA---','Antioquia (873,729)','Atlantico (369,116)','Cundinamarca (286,216)','Santander (250,347)','Bolivar (186,556)','Tolima (116,241)','Boyaca (115,524)','Caldas (111,761)','Cordoba (110,553)','Magdalena (106,891)','Norte Santander (106,559)','Narino (99,185)','Risaralda (98,921)','Cesar (97,786)','Meta (95,485)','Huila (94,115)','Valle (67,515)','Cauca (66,018)','Quindio (65,710)','Sucre (61,810)','Guajira (49,575)','Casanare (37,510)','Caqueta (23,734)','Putumayo (18,796)','Choco (17,900)','Arauca (14,847)','Amazonas Department (7,182)','Guaviare (5,316)','Vaupes (1,814)',
		'-----MEXICO----','Mexico State (534,963)','Nuevo Leon (311,637)','Guanajuato (279,682)','Jalisco (237,694)','Tabasco (189,546)','Veracruz (176,039)','Puebla (168,082)','Sonora (163,557)','Coahuila (144,097)','Tamaulipas (142,096)','Queretaro (140,703)','Baja California (131,131)','Chihuahua (128,876)','Sinaloa (120,883)','Oaxaca (118,837)','Yucatan (108,673)','Baja California Sur (102,153)','Guerrero (98,103)','Michoacan (93,561)','Hidalgo (91,018)','Morelos (68,138)','Durango (67,854)','Zacatecas (67,201)','Aguascalientes (63,055)','Nayarit (57,870)','Colima (54,371)','Tlaxcala (43,449)','Chiapas (35,833)','Campeche (33,766)',
		'------PERU-----','Lima Province (1,388,428)','Lima Region (213,955)','Arequipa Region (212,179)','Piura Region (157,549)','Callao (146,270)','La Libertad (146,216)','Junin (125,484)','Ancash (125,411)','Cusco (116,477)','Lambayeque (105,343)','Ica (103,367)','Cajamarca (95,553)','Puno (65,348)','San Martin (61,785)','Loreto (57,811)','Tacna (53,652)','Huanuco (51,981)','Moquegua (48,252)','Ayacucho (48,000)','Amazonas Region (43,876)','Ucayali (39,366)','Apurimac (38,787)','Tumbes (27,471)','Huancavelica (25,592)','Pasco (23,911)','Madre de Dios (17,721)',
		'-----CANADA----','Ontario (1,145,534)','Quebec (942,280)','Alberta (534,285)','British Columbia (353,578)','Manitoba (133,928)','Saskatchewan (130,133)','Nova Scotia (48,471)','New Brunswick (42,320)','Newfoundland (32,113)',
		'-----CHILE-----','Biobio (331,895)','Valparaiso (287,561)','Maule (224,861)','Araucania (205,058)','Los Lagos (186,126)','O’Higgins (141,095)','Antofagasta (118,801)','Coquimbo (118,640)','Los Rios (101,912)','Nuble (93,920)','Tarapaca (78,239)','Atacama (62,728)','Arica y Parinacota (54,101)','Magallanes (49,268)','Aysen (23,570)',
		'----DENMARK----','Hovedstaden (1,008,035)','Midtjylland (680,687)','Syddanmark (593,542)','Sjaelland (393,181)','Nordjylland (304,187)',
		'----SLOVAKIA---','Bratislava (302,692)','Kosice (75,334)','Zilina (69,315)','Presov (58,377)','Nitra (50,615)','Trnava (46,916)','Trencin (43,356)','Banska Bystrica (38,891)',
		'--SAUDI ARABIA-','Ar Riyad (199,212)','Makkah Al Mukarramah (181,487)','Eastern Region (149,246)','Al Madinah Al Munawwarah (51,276)','Aseer (50,948)','Jazan Province (30,291)','Al Qaseem (27,976)','Hail Province (14,159)','Najran Province (13,136)','Tabuk Province (11,821)','Al Bahah (9,353)','Northern Borders (6,763)','Al Jawf (3,803)',
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
