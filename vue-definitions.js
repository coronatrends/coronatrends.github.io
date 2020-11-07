"use strict";
// custom graph component

var point = {
'Acre':286,'Aguascalientes':283,'Alagoas':286,'Amapa':286,'Amazonas':286,'Amazonas Department':4,'Amazonas Region':286,'Ancash':286,'Antioquia':2,'Antofagasta':286,'Apurimac':286,'Arauca':1,'Araucania':286,'Arequipa Region':286,'Arica Y Parinacota':286,'Atacama':286,'Atlantico':28,'Australia':288,'Austria':288,'Ayacucho':286,'Aysen':286,'Bahia':286,'Baja California':283,'Baja California Sur':283,'Belgium':288,'Biobio':286,'Bolivar':2,'Boyaca':1,'Brazil':286,'Cajamarca':286,'Caldas':7,'Callao Province':286,'Campeche':283,'Canada':256,'Caqueta':19,'Casanare':1,'Cauca':3,'Ceara':286,'Cesar':22,'Chiapas':283,'Chihuahua':283,'Chile':286,'Choco':1,'Coahuila':283,'Colima':283,'Colombia':65,'Coquimbo':286,'Cordoba':20,'Cundinamarca':1,'Cusco':286,'Czechia':288,'Durango':283,'England':287,'Espirito Santo':286,'Germany':288,'Goias':286,'Guainia':1,'Guajira':7,'Guanajuato':283,'Guaviare':16,'Guerrero':283,'Hidalgo':283,'Huancavelica':286,'Huanuco':286,'Huila':10,'ICA':286,'Ireland':288,'Jalisco':283,'Japan':203,'Johannesburg':288,'Junin':286,'La Libertad':286,'Lambayeque':286,'Latvia':222,'Lima':286,'Lima Province':286,'Lima Region':286,'Lithuania':263,'Locations':286,'London':287,'Loreto':286,'Los Lagos':286,'Los Rios':286,'Madrede Dios':286,'Magallanes':286,'Magdalena':3,'Maranhao':286,'Mato Grosso':286,'Mato Grosso Sul':286,'Maule':286,'Meta':1,'Mexico':283,'Mexico City':283,'Mexico State':283,'Michoacan':283,'Minas Gerais':286,'Moquegua':286,'Morelos':283,'Narino':2,'Nayarit':283,'New Zealand':3,'Nigeria':284,'Norte Santander':2,'Nuble':286,'Nuevo Leon':283,'O Higgins':286,'Oaxaca':283,'Para':286,'Paraiba':286,'Parana':286,'Pasco':286,'Pernambuco':286,'Peru':286,'Piaui':286,'Piura Region':286,'Poland':288,'Puebla':283,'Puno':286,'Putumayo':7,'Queretaro':283,'Quindio':16,'Quintana Roo':283,'Rio De Janeiro State':286,'Rio Grande Norte':286,'Rio Grande Sul':286,'Risaralda':11,'Rondonia':286,'Roraima':286,'San Andres':7,'San Luis Potosi':283,'San Martin':286,'Santa Catarina':286,'Santander':1,'Santiago':286,'Sao Paulo State':286,'Sergipe':286,'Sinaloa':283,'Slovenia':288,'Sonora':283,'South Africa':288,'South Korea':288,'Spain':127,'Sucre':8,'Sweden':288,'Switzerland':288,'Sydney':288,'Tabasco':283,'Tacna':286,'Tamaulipas':283,'Tarapaca':286,'Tlaxcala':283,'Tocantins':286,'Tolima':1,'Tumbes':286,'Ucayali':286,'UK':287,'Valle':8,'Valparaiso':286,'Vaupes':1,'Veracruz':283,'Vichada':4,'Wales':284,'Yucatan':283,'Zacatecas':283,
'default':289
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
			else if ((e.key == '-' || e.key == '_') && this.dates.length > 0) {
				this.paused = true;
				this.day = Math.max(this.day - 1, this.minDay);
			}
			else if ((e.key == '+' || e.key == '=') && this.dates.length > 0) {
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
			'Brazil','USA','United Kingdom','Japan','United Arab Emirates','SouthAfrica','Australia','Argentina','France','China','Turkey','Nigeria','New Zealand','Colombia','Mexico','Germany','Singapore','Saudi Arabia','Morocco','Chile','Canada','Italy','Israel','Tunisia','Taiwan','Venezuela', 'Spain','India','Egypt','Uganda'
			]
			const selectAll = ['Europe','Lima','Flawed Democracies','Hybrid Regimes','Less Authoritarian','Colombia','Mexico','Nigeria','London','Maharashtra','Bihar','Tamil Nadu','Rajasthan','Madhya Pradesh','Lima Province','Piura Region','Lambayeque','Lima Region','La Libertad','Cajamarca','Arequipa Region','Ica','Gelderland','Zuid-Holland']
			if (this.selectedRegion == 'Locations')
				{this.selectedCountries = ['Barnet','London','England','United Kingdom','Western Europe','European Union','Europe','World'];}
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
		'Cities','Countries','Regions','ONS',
		'---------------',
		'London','Sydney','Johannesburg','Chicago','Mexico City','Seoul','Santiago','Lima',
		'---------------',
		'North America','South America','Latin America','Europe','EU','Balkans','Middle East','Africa','Asia','Oceania',
		'---------------',
		'Governance','Full Democracies','Flawed Democracies','Hybrid Regimes','Less Authoritarian','More Authoritarian',
		'---------------',
		'USA (9,607,336)','India (8,411,724)','Brazil (5,590,025)','Russia (1,699,695)','France (1,605,171)','Argentina (1,217,028)','UK (1,123,197)','Colombia (1,117,977)','Mexico (949,197)','Peru (914,722)','Italy (824,879)','South Africa (732,414)','Germany (631,172)','Chile (516,582)','Belgium (479,341)','Poland (466,679)','Czechia (391,945)','Netherlands (390,488)','Switzerland (202,504)','Canada (166,347)','Sweden (141,764)','Austria (132,515)','China (91,554)','Ireland (64,046)','Nigeria (63,508)','Slovenia (41,094)','Australia (27,633)','New Zealand (1,974)',
		'------USA------','Sunbelt (4,257,621)','South (4,187,193)','Midwest (2,132,890)','West (1,930,061)','Northeast (1,297,726)','Texas (969,874)','California (957,022)','Florida (827,556)','New York (519,261)','Illinois (453,941)','Georgia (372,511)','North Carolina (286,377)','Tennessee (273,148)','Arizona (252,775)','New Jersey (251,512)','Wisconsin (250,252)','Ohio (236,471)','Pennsylvania (225,698)','Michigan (218,675)','Alabama (212,505)','Missouri (200,049)','Indiana (196,369)','Virginia (187,232)','Louisiana (186,017)','South Carolina (181,645)','Minnesota (165,393)','Massachusetts (165,161)','Maryland (149,971)','Iowa (142,492)','Oklahoma (130,007)','Utah (124,470)','Mississippi (123,976)','Colorado (121,262)','Arkansas (117,973)','Kentucky (115,662)','Washington (113,090)','Nevada (105,629)','Kansas (90,244)','Nebraska (78,015)','Connecticut (77,408)','Idaho (70,632)','South Dakota (51,152)','New Mexico (51,112)','North Dakota (49,837)','Oregon (47,841)','Rhode Island (37,199)','Montana (36,977)','West Virginia (26,584)','Delaware (26,155)','Alaska (18,176)','Hawaii (15,593)','Wyoming (15,482)','New Hampshire (11,849)','Maine (7,285)','Vermont (2,353)',
		'-----INDIA-----','Maharashtra (1,703,444)','Karnataka (838,929)','Andhra Pradesh (835,953)','Tamil Nadu (736,777)','Uttar Pradesh (491,354)','Kerala (466,467)','West Bengal (393,524)','Odisha (297,274)','Bihar (220,246)','Rajasthan (205,800)','Chhattisgarh (196,233)','Gujarat (177,597)','Haryana (176,146)','Madhya Pradesh (174,825)','Punjab (135,834)','Jharkhand (103,518)','Jammu and Kashmir (97,224)','Uttarakhand (64,065)','Puducherry (35,552)','Tripura (31,234)','Himachal Pradesh (23,809)','Arunachal Pradesh (15,244)','Meghalaya (9,845)','Nagaland (9,227)','Ladakh (6,633)','Dadra and NHDD (3,260)','Mizoram (2,958)',
		'-----BRAZIL----','Sao Paulo State (1,117,795)','Minas Gerais (360,830)','Bahia (354,576)','Rio de Janeiro State (311,308)','Ceara (274,615)','Santa Catarina (261,543)','Goias (256,161)','Rio Grande Sul (249,437)','Parana (214,450)','Para (214,450)','Maranhao (185,986)','Pernambuco (163,039)','Amazonas (162,139)','Espirito Santo (156,681)','Mato Grosso (143,241)','Paraiba (133,286)','Piaui (113,774)','Alagoas (90,918)','Sergipe (84,491)','Mato Grosso Sul (82,884)','Rio Grande Norte (81,491)','Tocantins (75,648)','Rondonia (71,953)','Roraima (57,488)','Amapa (52,653)','Acre (30,954)',
		'-----RUSSIA----','Central (734,302)','Volga (220,119)','Northwestern (175,177)','Siberian (164,272)','Ural (128,599)','Southern (110,648)','Eastern (102,500)','Caucasian (77,241)',
		'----FRANCE-----','Ile-de-France (51,042)','Grand Est (19,001)','Auvergne-Rhone-Alpes (17,504)','Hauts-de-France (13,273)','Occitanie (6,841)','Bourgogne-Franche-Comte (6,588)','Nouvelle-Aquitaine (4,769)','Pays de la Loire (4,182)','Centre-Val de Loire (3,966)','Normandie (3,858)','Bretagne (2,420)','Corse (450)','Provence-Alpes-Cote d’Azur ()',
		'-------UK------','England (964,471)','Scotland (67,011)','Wales (58,107)',
		'----COLOMBIA---','Antioquia (24,949)','Atlantico (13,726)','Cundinamarca (9,706)','Sucre (8,715)','Cordoba (8,395)','Narino (8,124)','Bolivar (7,400)','Santander (6,888)','Cesar (6,137)','Caqueta (6,090)','Huila (4,991)','Guajira (4,847)','Boyaca (4,839)','Magdalena (4,507)','Tolima (4,480)','Norte Santander (4,432)','Meta (3,869)','Putumayo (3,679)','Cauca (3,520)','Choco (3,052)','Caldas (2,803)','Amazonas Department (2,428)','Casanare (1,884)','Arauca (1,806)','Quindio (1,705)','Risaralda (1,615)','Vaupes (1,071)','Valle (791)','Guaviare (719)',
		'-----MEXICO----','Mexico State (99,505)','Nuevo Leon (54,550)','Guanajuato (50,298)','Sonora (38,766)','Veracruz (37,441)','Puebla (36,063)','Jalisco (35,013)','Coahuila (34,663)','Tabasco (34,557)','Tamaulipas (32,657)','San Luis Potosi (29,517)','Michoacan (25,543)','Baja California (23,456)','Guerrero (22,336)','Sinaloa (22,229)','Yucatan (21,737)','Oaxaca (21,626)','Chihuahua (20,133)','Hidalgo (16,023)','Durango (15,056)','Queretaro (14,373)','Quintana Roo (13,554)','Baja California Sur (12,707)','Zacatecas (11,417)','Aguascalientes (9,910)','Tlaxcala (8,545)','Chiapas (7,567)','Morelos (6,993)','Nayarit (6,778)','Colima (6,688)','Campeche (6,534)',
		'------PERU-----','Lima Province (379,858)','Arequipa Region (44,859)','Piura Region (38,720)','Callao Province (37,842)','La Libertad (33,140)','Lima Region (30,651)','Ica (29,969)','Lambayeque (28,872)','Ancash (26,704)','Junin (23,556)','Cusco (22,606)','Loreto (22,528)','Cajamarca (22,390)','San Martin (21,828)','Ucayali (18,039)','Huanuco (17,502)','Puno (17,312)','Amazonas Region (16,996)','Moquegua (14,449)','Ayacucho (13,425)','Tacna (13,180)','Madre de Dios (8,845)','Tumbes (8,560)','Huancavelica (7,344)','Apurimac (5,850)','Pasco (5,718)',
		'-----CHILE-----','Valparaiso (30,498)','Biobio (29,931)','Antofagasta (21,447)','Maule (19,061)','O’Higgins (18,749)','Los Lagos (15,391)','Tarapaca (12,973)','Araucania (12,726)','Coquimbo (12,698)','Magallanes (12,427)','Arica y Parinacota (9,644)','Atacama (7,887)','Nuble (7,534)','Los Rios (3,690)','Aysen (1,060)',
		'--NETHERLANDS--','Zuid-Holland (113,716)','Noord-Holland (72,947)','Noord-Brabant (60,592)','Gelderland (37,674)','Utrecht (33,660)','Overijssel (22,076)','Limburg (17,538)','Flevoland (7,246)','Groningen (6,420)','Friesland (6,322)','Drenthe (5,665)','Zeeland (4,119)',
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
