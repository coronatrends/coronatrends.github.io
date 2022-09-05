"use strict";
// custom graph component

var point = {
'Acre':955,'Aguascalientes':956,'Alagoas':955,'Amapa':955,'Amazonas':955,'Amazonas Department':947,'Amazonas Region':956,'Ancash':956,'Antioquia':947,'Antofagasta':955,'Apurimac':956,'Arauca':947,'Araucania':955,'Arequipa Region':956,'Arica Y Parinacota':955,'Atacama':955,'Atlantico':947,'Australia':748,'Ayacucho':956,'Aysen':955,'Bahia':955,'Baja California':956,'Baja California Sur':956,'Biobio':955,'Bolivar':947,'Boyaca':947,'Brazil':955,'Cajamarca':956,'Caldas':947,'Callao':956,'Campeche':956,'Caqueta':947,'Casanare':947,'Cauca':947,'Ceara':955,'Cesar':947,'Chiapas':956,'Chihuahua':956,'Chile':955,'Choco':947,'Coahuila':956,'Colima':956,'Colombia':947,'Coquimbo':955,'Cordoba':947,'Cundinamarca':947,'Cusco':956,'Drenthe':955,'Durango':956,'England':952,'Espirito Santo':955,'Flevoland':955,'Friesland':955,'Gelderland':955,'Germany':762,'Goias':955,'Groningen':955,'Guainia':947,'Guajira':947,'Guanajuato':956,'Guaviare':947,'Guerrero':956,'Hidalgo':956,'Huancavelica':956,'Huanuco':956,'Huila':947,'ICA':956,'Jalisco':956,'Junin':956,'La Libertad':956,'Lambayeque':956,'Lima':956,'Lima Province':956,'Lima Region':956,'Limburg':955,'Locations':955,'London':952,'Loreto':956,'Los Lagos':955,'Los Rios':955,'Madrede Dios':956,'Magallanes':955,'Magdalena':947,'Maranhao':955,'Mato Grosso':955,'Mato Grosso Sul':955,'Maule':955,'Meta':947,'Mexico':956,'Mexico City':956,'Mexico State':956,'Michoacan':956,'Minas Gerais':955,'Moquegua':956,'Morelos':956,'Narino':947,'Nayarit':956,'Netherlands':955,'Noord Brabant':955,'Noord Holland':955,'Norte Santander':947,'Nuble':955,'Nuevo Leon':956,'O Higgins':955,'Oaxaca':956,'Overijssel':955,'Para':955,'Paraiba':955,'Parana':955,'Pasco':956,'Pernambuco':955,'Peru':956,'Piaui':955,'Piura Region':956,'Portugal':807,'Puebla':956,'Puno':956,'Putumayo':947,'Queretaro':956,'Quindio':947,'Rio De Janeiro State':955,'Rio Grande Norte':955,'Rio Grande Sul':955,'Risaralda':947,'Romania':881,'Rondonia':955,'Roraima':955,'San Andres':947,'San Martin':956,'Santa Catarina':955,'Santander':947,'Santiago':955,'Sao Paulo State':955,'Scotland':804,'Sergipe':955,'Sinaloa':956,'Sonora':956,'South Africa':709,'Spain':819,'Sucre':947,'Sweden':953,'Sydney':748,'Tabasco':956,'Tacna':956,'Tamaulipas':956,'Tarapaca':955,'Tlaxcala':956,'Tocantins':955,'Tolima':947,'Tumbes':956,'Ucayali':956,'UK':804,'Utrecht':955,'Valle':947,'Valparaiso':955,'Vaupes':947,'Veracruz':956,'Vichada':947,'Wales':946,'Yucatan':956,'Zacatecas':956,'Zeeland':955,'Zuid Holland':955,
'default':957
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
		'USA (94,748,404)','India (44,462,445)','Brazil (34,456,145)','France (33,600,422)','Germany (32,247,828)','South Korea (23,606,740)','UK (23,521,792)','Italy (21,938,269)','Japan (19,460,588)','Russia (19,442,127)','Spain (13,352,019)','Netherlands (8,386,189)','Mexico (7,041,181)','Colombia (6,302,809)','Portugal (5,425,891)','Malaysia (4,791,456)','Thailand (4,659,902)','Chile (4,532,562)','Canada (4,209,083)','Peru (4,115,117)','Czechia (4,046,756)','Switzerland (4,045,011)','South Africa (4,012,812)','Denmark (3,274,583)','Romania (3,227,188)','Australia (2,781,633)','Slovakia (2,584,276)','Sweden (2,569,152)','China (2,547,297)','New Zealand (1,749,139)','Saudi Arabia (813,764)',
		'------USA------','Sunbelt (37,975,264)','South (37,071,303)','West (21,788,011)','Midwest (19,457,197)','Northeast (16,010,419)','California (11,145,004)','Texas (7,869,972)','Florida (7,449,881)','New York (6,002,784)','Illinois (3,702,814)','Pennsylvania (3,185,902)','North Carolina (3,140,666)','Ohio (3,076,127)','Georgia (2,870,630)','Michigan (2,770,749)','New Jersey (2,689,381)','Tennessee (2,302,525)','Arizona (2,254,409)','Virginia (2,047,180)','Massachusetts (2,013,992)','Indiana (1,899,746)','Wisconsin (1,835,477)','Washington (1,788,130)','Missouri (1,694,777)','South Carolina (1,674,286)','Minnesota (1,656,835)','Colorado (1,634,718)','Kentucky (1,549,699)','Alabama (1,494,300)','Louisiana (1,440,295)','Oklahoma (1,256,292)','Maryland (1,225,543)','Utah (1,029,933)','Arkansas (936,412)','Mississippi (925,174)','Oregon (880,074)','Connecticut (878,347)','Iowa (873,517)','Kansas (864,853)','Nevada (837,026)','New Mexico (613,000)','West Virginia (584,809)','Nebraska (559,444)','Idaho (491,057)','Rhode Island (451,284)','New Hampshire (351,087)','Hawaii (339,538)','Montana (305,567)','Delaware (303,639)','Alaska (294,512)','Maine (284,015)','North Dakota (265,310)','South Dakota (257,548)','Wyoming (175,043)','Vermont (153,627)',
		'-----INDIA-----','Maharashtra (8,104,854)','Kerala (6,761,424)','Karnataka (4,054,746)','Tamil Nadu (3,570,567)','Andhra Pradesh (2,337,241)','Uttar Pradesh (2,123,776)','West Bengal (2,107,888)','Odisha (1,328,465)','Rajasthan (1,309,924)','Gujarat (1,284,869)','Chhattisgarh (1,174,130)','Madhya Pradesh (1,053,638)','Haryana (1,052,876)','Bihar (848,762)','Punjab (780,848)','Jammu and Kashmir (478,323)','Uttarakhand (448,525)','Jharkhand (441,998)','Himachal Pradesh (311,300)','Mizoram (236,810)','Puducherry (173,025)','Tripura (107,719)','Meghalaya (96,444)','Arunachal Pradesh (66,709)','Nagaland (35,891)','Ladakh (29,241)','Dadra and NHDD (11,437)',
		'-----BRAZIL----','Sao Paulo State (6,037,128)','Minas Gerais (3,872,628)','Parana (2,735,109)','Para (2,735,109)','Rio Grande Sul (2,715,049)','Rio de Janeiro State (2,494,713)','Santa Catarina (1,865,827)','Bahia (1,687,321)','Goias (1,678,627)','Ceara (1,381,149)','Espirito Santo (1,214,619)','Pernambuco (1,049,704)','Mato Grosso (826,859)','Paraiba (651,270)','Amazonas (613,967)','Mato Grosso Sul (578,147)','Rio Grande Norte (551,878)','Maranhao (469,143)','Rondonia (454,841)','Piaui (398,577)','Tocantins (343,832)','Sergipe (342,820)','Alagoas (320,440)','Amapa (178,106)','Roraima (174,795)','Acre (149,201)',
		'-------UK------','England (18,057,963)','Scotland (1,843,856)','Wales (867,491)',
		'-----RUSSIA----','Central (6,643,362)','Ural (3,799,215)','Northwestern (3,197,601)','Volga (3,162,077)','Eastern (2,533,195)','Siberian (1,991,027)','Southern (1,597,639)','Caucasian (875,215)',
		'--NETHERLANDS--','Noord-Holland (18,106)','Zuid-Holland (16,449)','Noord-Brabant (12,453)','Gelderland (7,957)','Limburg (5,315)','Overijssel (4,656)','Utrecht (4,417)','Groningen (1,975)','Flevoland (1,764)','Zeeland (1,471)','Drenthe (1,135)','Friesland (21)',
		'-----MEXICO----','Mexico State (697,020)','Nuevo Leon (398,656)','Guanajuato (350,377)','Jalisco (282,303)','Veracruz (223,245)','Tabasco (213,098)','Puebla (207,057)','Sonora (193,730)','Coahuila (179,549)','Queretaro (176,262)','Tamaulipas (175,224)','Sinaloa (173,913)','Chihuahua (163,680)','Baja California (162,577)','Oaxaca (148,352)','Yucatan (136,224)','Baja California Sur (124,044)','Hidalgo (118,090)','Guerrero (115,807)','Michoacan (109,403)','Morelos (89,746)','Aguascalientes (83,980)','Zacatecas (79,193)','Durango (79,091)','Nayarit (71,766)','Colima (67,060)','Tlaxcala (56,240)','Chiapas (47,519)','Campeche (42,771)',
		'----COLOMBIA---','Antioquia (942,417)','Atlantico (415,605)','Cundinamarca (327,357)','Santander (292,970)','Bolivar (202,672)','Boyaca (129,165)','Tolima (126,790)','Norte Santander (124,090)','Cordoba (121,870)','Caldas (119,260)','Magdalena (117,311)','Risaralda (109,347)','Cesar (108,605)','Narino (107,530)','Meta (107,262)','Huila (102,978)','Cauca (76,028)','Valle (75,716)','Quindio (72,636)','Sucre (66,886)','Guajira (57,799)','Casanare (42,768)','Caqueta (25,578)','Putumayo (21,723)','Choco (18,826)','Arauca (16,920)','Amazonas Department (7,797)','Guaviare (5,651)','Vaupes (1,949)',
		'-----CHILE-----','Biobio (440,349)','Valparaiso (419,248)','Maule (300,623)','Araucania (259,668)','Los Lagos (222,335)','O’Higgins (193,047)','Coquimbo (182,610)','Antofagasta (163,016)','Nuble (129,594)','Los Rios (128,428)','Tarapaca (101,369)','Atacama (99,061)','Arica y Parinacota (71,519)','Magallanes (61,389)','Aysen (30,938)',
		'-----CANADA----','Ontario (1,435,597)','Quebec (1,180,685)','Alberta (602,434)','British Columbia (382,436)','Manitoba (148,428)','Saskatchewan (141,815)','Nova Scotia (121,380)','New Brunswick (75,152)','Newfoundland (51,111)',
		'------PERU-----','Lima Province (1,652,399)','Arequipa Region (267,282)','Lima Region (245,627)','Piura Region (171,818)','La Libertad (168,097)','Callao (159,385)','Ancash (147,488)','Junin (145,802)','Cusco (134,535)','Lambayeque (119,208)','Ica (116,556)','Cajamarca (108,893)','Puno (73,835)','San Martin (67,050)','Loreto (62,564)','Tacna (60,126)','Moquegua (58,909)','Huanuco (57,873)','Ayacucho (53,376)','Amazonas Region (49,506)','Apurimac (44,146)','Ucayali (42,969)','Tumbes (31,436)','Huancavelica (28,692)','Pasco (27,183)','Madre de Dios (20,362)',
		'----DENMARK----','Hovedstaden (1,093,638)','Midtjylland (742,114)','Syddanmark (654,595)','Sjaelland (437,637)','Nordjylland (331,957)',
		'--SAUDI ARABIA-','Ar Riyad (221,026)','Makkah Al Mukarramah (199,785)','Eastern Region (160,119)','Al Madinah Al Munawwarah (55,240)','Aseer (53,902)','Jazan Province (32,237)','Al Qaseem (29,496)','Hail Province (14,611)','Najran Province (13,633)','Tabuk Province (12,401)','Al Bahah (10,591)','Northern Borders (6,939)','Al Jawf (3,898)',
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
