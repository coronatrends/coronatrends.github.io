"use strict";
// custom graph component

var point = {
'Acre':731,'Aguascalientes':731,'Alagoas':731,'Amapa':731,'Amazonas':731,'Amazonas Department':728,'Amazonas Region':731,'Ancash':731,'Antioquia':728,'Antofagasta':731,'Apurimac':731,'Arauca':728,'Araucania':731,'Arequipa Region':731,'Arica Y Parinacota':731,'Atacama':731,'Atlantico':728,'Australia':730,'Ayacucho':731,'Aysen':731,'Bahia':731,'Baja California':731,'Baja California Sur':731,'Biobio':731,'Bolivar':728,'Boyaca':728,'Brazil':731,'Cajamarca':731,'Caldas':728,'Callao':731,'Campeche':731,'Caqueta':728,'Casanare':728,'Cauca':728,'Ceara':731,'Cesar':728,'Chiapas':731,'Chihuahua':731,'Chile':731,'Choco':728,'Coahuila':731,'Colima':731,'Colombia':728,'Coquimbo':731,'Cordoba':728,'Cundinamarca':728,'Cusco':731,'Denmark':731,'Durango':731,'Espirito Santo':731,'Goias':731,'Guainia':728,'Guajira':728,'Guanajuato':731,'Guaviare':728,'Guerrero':731,'Hidalgo':731,'Hovedstaden':731,'Huancavelica':731,'Huanuco':731,'Huila':728,'ICA':731,'Jalisco':731,'Japan':701,'Junin':731,'Karnataka':728,'La Libertad':731,'Lambayeque':731,'Lima':731,'Lima Province':731,'Lima Region':731,'Locations':731,'Loreto':731,'Los Lagos':731,'Los Rios':731,'Madrede Dios':731,'Magallanes':731,'Magdalena':728,'Maranhao':731,'Mato Grosso':731,'Mato Grosso Sul':731,'Maule':731,'Meta':728,'Mexico':731,'Mexico City':731,'Mexico State':731,'Michoacan':731,'Midtjylland':731,'Minas Gerais':731,'Moquegua':731,'Morelos':731,'Narino':728,'Nayarit':731,'Nordjylland':731,'Norte Santander':728,'Nuble':731,'Nuevo Leon':731,'O Higgins':731,'Oaxaca':731,'Para':731,'Paraiba':731,'Parana':731,'Pasco':731,'Pernambuco':731,'Peru':731,'Piaui':731,'Piura Region':731,'Puebla':731,'Puno':731,'Putumayo':728,'Queretaro':731,'Quindio':728,'Rio De Janeiro State':731,'Rio Grande Norte':731,'Rio Grande Sul':731,'Risaralda':728,'Rondonia':731,'Roraima':731,'San Andres':728,'San Martin':731,'Santa Catarina':731,'Santander':728,'Santiago':731,'Sao Paulo State':731,'Scotland':730,'Sergipe':731,'Sinaloa':731,'Sjaelland':731,'Slovakia':730,'Sonora':731,'South Africa':710,'South Korea':719,'Sucre':728,'Sweden':730,'Syddanmark':731,'Sydney':730,'Tabasco':731,'Tacna':731,'Tamaulipas':731,'Tarapaca':731,'Tlaxcala':731,'Tocantins':731,'Tolima':728,'Tumbes':731,'Ucayali':731,'UK':730,'Valle':728,'Valparaiso':731,'Vaupes':728,'Veracruz':731,'Vichada':728,'Yucatan':731,'Zacatecas':731,
'default':732
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
		'USA (70,495,874)','India (39,237,264)','Brazil (23,931,609)','France (16,041,383)','UK (15,784,488)','Russia (10,860,799)','Italy (9,781,191)','Spain (8,975,458)','Germany (8,716,804)','Colombia (5,714,092)','Mexico (4,595,589)','Netherlands (3,824,344)','South Africa (3,579,428)','Peru (2,894,215)','Canada (2,885,616)','Malaysia (2,829,089)','Czechia (2,732,453)','Thailand (2,377,500)','Portugal (2,176,256)','Japan (2,125,882)','Australia (2,086,925)','Romania (2,003,041)','Chile (1,949,675)','Switzerland (1,879,319)','Sweden (1,784,005)','Slovakia (1,454,621)','Denmark (1,355,815)','South Korea (733,902)','Saudi Arabia (647,819)','China (118,721)','New Zealand (15,550)',
		'------USA------','Sunbelt (28,216,231)','South (27,691,045)','West (15,294,568)','Midwest (15,188,013)','Northeast (12,376,318)','California (7,665,167)','Texas (5,905,609)','Florida (5,710,529)','New York (4,675,405)','Illinois (2,779,647)','Pennsylvania (2,560,167)','Ohio (2,497,544)','Georgia (2,229,675)','North Carolina (2,222,767)','Michigan (2,124,625)','New Jersey (2,062,114)','Arizona (1,729,663)','Tennessee (1,653,144)','Massachusetts (1,535,986)','Indiana (1,524,720)','Virginia (1,451,716)','Wisconsin (1,446,268)','Missouri (1,335,471)','South Carolina (1,265,715)','Minnesota (1,226,428)','Colorado (1,186,025)','Washington (1,152,818)','Alabama (1,137,387)','Louisiana (1,067,066)','Kentucky (1,056,662)','Maryland (1,006,943)','Oklahoma (914,722)','Utah (826,163)','Arkansas (734,834)','Iowa (695,705)','Mississippi (681,471)','Kansas (681,048)','Connecticut (671,674)','Nevada (614,774)','Oregon (570,893)','Nebraska (449,418)','New Mexico (437,934)','West Virginia (413,668)','Idaho (359,115)','Rhode Island (348,256)','New Hampshire (257,795)','Delaware (239,137)','Montana (222,099)','South Dakota (216,657)','North Dakota (210,482)','Hawaii (199,130)','Alaska (195,345)','Maine (166,927)','Wyoming (135,442)','Vermont (97,994)',
		'-----INDIA-----','Maharashtra (7,466,420)','Kerala (5,597,648)','Karnataka (3,467,472)','Tamil Nadu (3,103,410)','Andhra Pradesh (2,166,194)','West Bengal (1,958,265)','Uttar Pradesh (1,933,175)','Odisha (1,196,140)','Rajasthan (1,115,790)','Chhattisgarh (1,091,868)','Gujarat (1,045,937)','Haryana (901,303)','Madhya Pradesh (882,906)','Bihar (808,754)','Punjab (707,864)','Jharkhand (419,132)','Uttarakhand (396,674)','Jammu and Kashmir (390,949)','Himachal Pradesh (259,566)','Mizoram (159,488)','Puducherry (150,318)','Tripura (97,897)','Meghalaya (88,093)','Arunachal Pradesh (59,163)','Nagaland (33,441)','Ladakh (24,492)','Dadra and NHDD (11,031)',
		'-----BRAZIL----','Sao Paulo State (4,545,225)','Minas Gerais (2,463,640)','Parana (1,788,687)','Para (1,788,687)','Rio Grande Sul (1,669,817)','Rio de Janeiro State (1,571,974)','Santa Catarina (1,349,546)','Bahia (1,308,146)','Goias (993,220)','Ceara (987,114)','Espirito Santo (710,261)','Pernambuco (663,854)','Mato Grosso (589,409)','Amazonas (481,295)','Paraiba (474,846)','Rio Grande Norte (400,653)','Mato Grosso Sul (397,919)','Maranhao (377,458)','Piaui (345,078)','Rondonia (298,451)','Sergipe (282,070)','Tocantins (251,748)','Alagoas (248,397)','Roraima (135,840)','Amapa (134,108)','Acre (92,004)',
		'-------UK------','England (13,381,523)','Scotland (1,114,066)','Wales (756,722)',
		'-----RUSSIA----','Central (4,238,964)','Northwestern (1,771,021)','Ural (1,724,201)','Volga (1,552,365)','Siberian (976,234)','Eastern (825,356)','Southern (800,027)','Caucasian (375,588)',
		'----COLOMBIA---','Antioquia (873,729)','Atlantico (369,116)','Cundinamarca (286,216)','Santander (250,347)','Bolivar (186,556)','Tolima (116,241)','Boyaca (115,524)','Caldas (111,761)','Cordoba (110,553)','Magdalena (106,891)','Norte Santander (106,559)','Narino (99,185)','Risaralda (98,921)','Cesar (97,786)','Meta (95,485)','Huila (94,115)','Valle (67,515)','Cauca (66,018)','Quindio (65,710)','Sucre (61,810)','Guajira (49,575)','Casanare (37,510)','Caqueta (23,734)','Putumayo (18,796)','Choco (17,900)','Arauca (14,847)','Amazonas Department (7,182)','Guaviare (5,316)','Vaupes (1,814)',
		'-----MEXICO----','Mexico State (438,665)','Nuevo Leon (243,375)','Guanajuato (232,003)','Jalisco (189,635)','Tabasco (167,273)','Sonora (139,038)','Puebla (137,697)','Veracruz (135,232)','Coahuila (124,584)','Tamaulipas (120,842)','Queretaro (114,483)','Baja California (112,061)','Chihuahua (98,584)','Sinaloa (93,372)','Oaxaca (93,136)','Yucatan (90,329)','Guerrero (84,825)','Michoacan (80,328)','Baja California Sur (79,941)','Hidalgo (71,702)','Durango (60,597)','Zacatecas (56,802)','Morelos (55,401)','Aguascalientes (45,815)','Nayarit (44,791)','Colima (40,325)','Tlaxcala (32,423)','Campeche (27,317)','Chiapas (25,352)',
		'--NETHERLANDS--','Zuid-Holland (880,073)','Noord-Holland (667,521)','Noord-Brabant (582,070)','Gelderland (424,793)','Limburg (261,133)','Overijssel (243,742)','Groningen (94,556)','Flevoland (88,891)','Utrecht (84,208)','Zeeland (79,211)','Drenthe (77,093)','Friesland (16,252)',
		'------PERU-----','Lima Province (1,133,370)','Lima Region (183,330)','Arequipa Region (156,043)','Callao (126,337)','Piura Region (122,640)','La Libertad (118,074)','Junin (106,514)','Ancash (101,406)','Cusco (100,749)','Lambayeque (87,553)','Cajamarca (81,356)','Ica (78,977)','San Martin (55,200)','Puno (53,047)','Loreto (50,759)','Huanuco (43,561)','Tacna (41,651)','Ayacucho (41,210)','Amazonas Region (36,385)','Moquegua (36,248)','Ucayali (34,388)','Apurimac (30,342)','Tumbes (20,809)','Huancavelica (19,631)','Pasco (19,331)','Madre de Dios (15,304)',
		'-----CANADA----','Ontario (971,033)','Quebec (830,488)','Alberta (466,616)','British Columbia (308,079)','Manitoba (114,021)','Saskatchewan (107,842)','Nova Scotia (33,083)','New Brunswick (25,465)','Newfoundland (14,522)',
		'-----CHILE-----','Biobio (173,507)','Valparaiso (149,907)','Maule (112,625)','Araucania (110,224)','Los Lagos (102,404)','Antofagasta (76,697)','O’Higgins (75,855)','Coquimbo (59,373)','Tarapaca (58,837)','Los Rios (56,252)','Nuble (41,405)','Arica y Parinacota (34,887)','Magallanes (34,242)','Atacama (32,912)','Aysen (11,077)',
		'----SLOVAKIA---','Bratislava (72,468)','Kosice (42,694)','Zilina (38,342)','Presov (34,189)','Nitra (25,201)','Trnava (25,166)','Trencin (24,602)','Banska Bystrica (23,234)',
		'----DENMARK----','Hovedstaden (549,189)','Midtjylland (238,341)','Syddanmark (205,228)','Sjaelland (171,032)','Nordjylland (98,136)',
		'--SAUDI ARABIA-','Makkah Al Mukarramah (165,746)','Ar Riyad (163,735)','Eastern Region (132,196)','Al Madinah Al Munawwarah (46,396)','Aseer (44,797)','Jazan Province (24,726)','Al Qaseem (23,978)','Hail Province (12,404)','Najran Province (11,776)','Tabuk Province (9,757)','Al Bahah (8,224)','Northern Borders (5,719)','Al Jawf (2,900)',
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
