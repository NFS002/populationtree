//
//  LAYOUT
//
var margin = {top: 13, right: 0, bottom: 35, left: 20},
    centerPadding = 30,
    // width refers to one half pyramid
    width = 340 - margin.left - margin.right,
    height = 670 - margin.top - margin.bottom,
    barHeight = Math.floor(height / 100);	// 100 agebands

//
// GLOBALS
//
var datacsv, data = [], title, analyse, animate, animState = false, fixState = false,
	initialOutline = false, ioYear, ioVariant, ageState = false, firstRun = false,
	tmpMcolor, tmpFcolor, birthyear, uiHolder, clickBirthYear =0, currSize,
	pastMcolor = "rgb(56,86,151)", pastFcolor = "rgb(131,136,140)", futureMcolor = "rgb(56,86,151)", futureFcolor = "rgb(131,136,140)",
	highlight = "rgb(15,8,29)", oldColor = "rgb(0,8,67)", mediumColor = "rgb(34,91,106)", youngColor = "rgb(163,163,163)",
	locale;


var state = {
		year : { hsh : 'y',
				default: 2014
		},
		agelimits : { hsh : 'a',
				default: "20,65"
		},
		variant : { hsh : 'v',
				default: 5
		},
		outline : { hsh : 'o'},
		language : { hsh : 'l',
				default: 'en'
		},
		size : { hsh : 's',
				default: 'xl'
		},
		agegroups : { hsh : 'g',
				default: false
		},
		birthyear : { hsh : 'b',
					default: 0
		}
}


//
// Descriptive Texts
//

// Main Headline Projection for years >= beginProjection
var head = "Population in the UK 1970 - 2060";

// Headline for years < beginProjection
var headPast = "Population in the UK 1970 - 2060";
// X-axis labels for men and women
var xMen = "Men (thousand)";

var xWomen = "Women (thousand)";

var ageStructure = "Age Structure";

// this is for mouseover the pyramid, highlight birthyear
var bYearTxt = {
	de: "Jahrgang",
	en: "Year of birth",
	fr: "Année de naissance",
	es: "Año de nacimiento",
	ru: "Год рождения"
}

var persTxt = {
	de: "Personen",
	en: "people",
	fr: "Personnes",
	es: "Personas",
	ru: "человек"
}

var chartInfoText = "The chart below shows the old-age dependency ratio (as a percentage) for various different state retirement ages over the course of both the historical population figures and the projection. The number in the top right of each bar is the percentage of the population over that state retiremet age, for the given year on which the data is set to, and The number written in red is this state retirement age. The numbers 65,67, and 69 have been chosen as these will most likely be the chosen ages over the course of this projection. 65 is the current state retirement age. The particular on which the chart is set to is displayed in the top left of the main chart."

d3.select("#chartinfotext").text(chartInfoText);

var de = d3.locale({
  decimal: ",",
  thousands: "\xa0",
  grouping: [3],
  currency: ["", " €"],
  dateTime: "%A, der %e. %B %Y, %X",
  date: "%e.%m.%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"], // unused
  days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  shortMonths: ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
});

var en = d3.locale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["£", ""],
  dateTime: "%a %e %b %X %Y",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

var fr = d3.locale({
  decimal: ",",
  thousands: ".",
  grouping: [3],
  currency: ["", " €"],
  dateTime: "%A, le %e %B %Y, %X",
  date: "%d/%m/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"], // unused
  days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  shortDays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  shortMonths: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
});

function getStateRetirementAge(year) {
    if (year < 2014)
        return 65;
    else if (year < 2017)
        return 66;
    else if (year < 2020)
        return 67;
    else
        return 68;
}


function getChartData(year) {



}



//
// SETTINGS
//
var   currVariant = "v1", // must have data for intial year, applies only for years >= beginprojection
	  tmpVariant = "v1",  // switches to "v0" in past years for easier dataset structure
  	  age1 = 99,   // highest age
  	  // BEWARE HARDCODED DATE RANGE
      year0 = 1961, // earliest year
      year1 = 2060, // end year
	  beginProjection = 2014;
      year  = year0, // initial year
      ageLimits = [20, 65],
	  speed = 400,
	  language = "en",
	  nrXticks = 7,  // number of ticks at x-axis
	  nrYticks = 5, // year increment on y-axis (age),
	  generationDividers = {1896 : "\'The forgotten generation\'",
	                        1910 : "\'The greatest generation\'" ,
	                        1925 : "\'The silent generation\'",
	                        1945 : "\'The baby boomers\'",
	                        1965 : "\'Generation X\'" ,
	                        1980 : "\'The millenials\'",
	                        2000 : "\'The centennials\'",
	                        2015 : "",
	                        2035 : "" ,
	                        2055 : "",
	                        2080: "" };





// changes the layout programmatically for embeding and responsiveness
function reformat(size) {

	// size "medium/mobile" for embeding and phones
	if (size == "m") {

		d3.selectAll(".xl").style("display", "none");
		d3.selectAll(".birthyear").select("text").style("fill", "none");

		nrXticks = 3;
		nrYticks = 10;

		margin.right = 10, margin.left = 10;
		centerPadding = 24;
	    width = 240 - margin.left - margin.right,
		height = 480 - margin.top - margin.bottom;
		barHeight = Math.floor(height / 100);	// 100 agebands

		d3.select("#wrapper")
			.style("width", "512px")
			.style("height", "750px");

		d3.select("#easel")
			.style("width", "505px")
			.style("height", "480px")
			.style("top", "78px");

		d3.select("#dashBoard")
			.style("width", "505px")
			.style("height", "145px")
			.style("left", "0px")
			.style("top", "565px");


		currSize = "m";
//		should expand to full size if possible even if sent from mobile
// 		state.size.val = "m";
	}

// 	rewriteHash();

}


// read settings from URL parameters
var readHash = function() {

	var myH =location.hash.split('#')[1];
	// keep out the script kiddies, hopefully
	if (myH) {
		var myHa = myH.substring(0, 48);
		var myHash = myHa.replace(/[^0-9a-y,&=]/g, ''); // these characters are allowed

		// many thanks to
		// http://stackoverflow.com/questions/18346710/create-object-from-string-in-javascript

		var params = function(){
			var result = {};
			myHash.split(/&/).forEach(function(el){
				var parts = el.split(/=/);
				result[parts[0]] = parts[1];
				});
			return result;
		}();

		if (params.hasOwnProperty('a')) {

			var a = params.a.split(',');
			var a0 = +a[0];
			var a1 = +a[1];
			if (a0<a1 && a0>0 && a1<100) {
				ageLimits[0] = a0;
				ageLimits[1] = a1;
				state.agelimits.val=params.a;
			}
		}

		if (params.hasOwnProperty('v')) {

			var v = +params.v;
			if (v>=1 && v<=6) {

					tmpVariant = "v"+v;
					year<beginProjection ? currVariant="v1" : currVariant=tmpVariant;
			}
		}

		if (params.hasOwnProperty('g')) {

			ageState=true;
		}

		if (params.hasOwnProperty('b')) {

			var b = +params.b;
			if (b>=year0-100 && b<=year1) {
				clickBirthYear = b;
			}
		}

		if (params.hasOwnProperty('l')) {
			// Language, Localization
			var supportedLanguages = ["de","en","fr","es","ru"];

				if (supportedLanguages.indexOf(params.l) > -1) {

					language = params.l;

					} else {

					language = "de";

					}

				state.language.val = language;
			}

		if (params.hasOwnProperty('o')) {
			// Outline
			var o = params.o.split("v");

			if (+o[0]>=year0 && +o[0]<=year1) {

				initialOutline = true;
				ioYear = +o[0];

				if (+o[1]>=0 && +o[1]<=6) {

					ioVariant = "v"+o[1];

				}
			}
		}

		if (params.hasOwnProperty('s')) {
			// Layout size
			reformat(params.s);
			}

		if (params.hasOwnProperty('y')) {

			var y = +params.y;
			if (y>=year0 && y<=year1) {
				year = y;
				state.year.val = year;
			}
		}

	}  // end if url has hash

	if (!state.language.hasOwnProperty('val')) {

		try {
			if (navigator.language.substring(0, 2)=='en') {language = "en"};
			if (navigator.language.substring(0, 2)=='de') {language = "de"};
			if (navigator.language.substring(0, 2)=='es') {language = "es"};
			if (navigator.language.substring(0, 2)=='ru') {language = "ru"};
			if (navigator.language.substring(0, 2)=='fr') {language = "fr"};
		} catch(e) {
			language = "de";
		}
	}

  	locale = en;
}

readHash();


/* numberformats */
var mill = locale.numberFormat(".1f");
var perc = locale.numberFormat("%");
var thsd = locale.numberFormat("n");
var full = d3.format("0f");


var yearSlider = d3.slider().value(year).orientation("vertical")
				.min(year0).max(year1).step(1)
				.axis( d3.svg.axis().orient("right")
					.tickValues([1961,1971,1980,1990,2000,2014,2030,2040,2050,2060])
					.tickPadding(10)
					.tickFormat(d3.format(""))
					)
				.on("slide", function(evt, value) {
					evt.stopPropagation();
					scrollPyramid(value, currVariant);
    				});

d3.select('#sliderHolder').call(yearSlider);

d3.select("#txLow").text("<"+ageLimits[0]);
d3.select("#txMed").text(ageLimits[0]+"–"+(ageLimits[1]-1));
d3.select("#txUp").text(ageLimits[1]+"+");



//
// SCALES
//
var x = d3.scale.linear()
    .range([width, 0]);

var w = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
	//.ordinal()
	//.rangeRoundBands([barHeight / 2, height - barHeight / 2]);
    .range([barHeight / 2, height - barHeight / 2]);

// y scale for the path outline
var yy = d3.scale.linear()
    .range([-barHeight, -height])
    .domain([0, age1]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(nrXticks)
    .tickSize(-height)
    .tickPadding(7);

var wAxis = d3.svg.axis()
    .scale(w)
    .orient("bottom")
    .ticks(nrXticks)
    .tickSize(-height)
    .tickPadding(7);



// An SVG element with a bottom-right origin
var svg = d3.select("#easel").append("svg")
    .attr("width", (width + margin.left + margin.right)*2+centerPadding)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// A sliding container to hold the bars by birthyear.
var birthyears = svg.append("g")
    .attr("class", "birthyears");

var dsv = d3.dsv(";", "text/plain");

//CSV URI
dsv("UK-population-1950-2060.rf.csv",function(csv) {
  datacsv=d3.nest()
    .key(function(d) {return d.Year;})
    .key(function(d) {return d.mw;})
    .key(function(d) {return d.Variant;})
    .map(csv);
    // shuffle the destatis table into the mbostock example format
    for (i=year0; i<(year1+1); i++) {
 		if (typeof datacsv[i].m[0] != "undefined") {

        for (j=0; j<(age1+1); j++) {
			// observed data of the past
           data.push({year: +i, age: +j, mw: "1", variant: "v0", people : +datacsv[i].m[0][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "2", variant: "v0", people : +datacsv[i].w[0][0]["AgeRange_"+j+"_"+(j+1)]});

           }
		}

 		if (typeof datacsv[i].m[1] != "undefined") {

        for (j=0; j<(age1+1); j++) {
			// several projection variants
           data.push({year: +i, age: +j, mw: "1", variant: "v1", people : +datacsv[i].m[1][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "2", variant: "v1", people : +datacsv[i].w[1][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "1", variant: "v2", people : +datacsv[i].m[2][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "2", variant: "v2", people : +datacsv[i].w[2][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "1", variant: "v3", people : +datacsv[i].m[3][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "2", variant: "v3", people : +datacsv[i].w[3][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "1", variant: "v6", people : +datacsv[i].m[6][0]["AgeRange_"+j+"_"+(j+1)]});
           data.push({year: +i, age: +j, mw: "2", variant: "v6", people : +datacsv[i].w[6][0]["AgeRange_"+j+"_"+(j+1)]});
           }
        }
    }
  // Update the scale domains.
  var maxPeople = d3.max(data, function(d) { return d.people; })
  x.domain([0, maxPeople]);
  w.domain([0, maxPeople]);
  y.domain([year1 - age1, year1]);


// agegroup slider will be attached to a Div that fits the pyramid
// beware SVG coordinates now used in HTML
var ageSliderDiv = d3.select("#easel").append("div")
			.attr("id", "ageSliderHolder")
			.style("height", height+"px")
			.style("top", margin.top-3+"px") // offset slider handle
			.style("left", margin.left+centerPadding/2+width+"px");

var labelHandle1 = ageSliderDiv.append("div")
			.attr("class", "ageLimit")
			.style("top", y(year1 - ageLimits[0])-2+"px") // manual offset also ageSlider
			.text(ageLimits[0]);

var labelHandle2 = ageSliderDiv.append("div").attr("class", "ageLimit")
			.attr("class", "ageLimit")
			.style("top", y(year1 - ageLimits[1])-2+"px") // manual offset also ageSlider
			.text(ageLimits[1]);

var ageGroupSlider = d3.slider().value(ageLimits).orientation("vertical")
				.min(0).max(100).step(1)
				.animate(false)
				.on("slide", function(evt, value) {
					// what gets done when the age limit handles are draged
					ageLimits = value;
					state.agelimits.val = ageLimits[0] + "," + ageLimits[1];
					rewriteHash();
					d3.select("#txLow").text("<"+ageLimits[0]);
					d3.select("#txMed").text(ageLimits[0]+"–"+(ageLimits[1]-1));
					d3.select("#txUp").text(ageLimits[1]+"+");
					labelHandle1
						.style("top", y(year1 - ageLimits[0])-2+"px") // manual offset see above
						.text(ageLimits[0]);
					labelHandle2
						.style("top", y(year1 - ageLimits[1])-2+"px") // manual offset see above
						.text(ageLimits[1]);
					paintAgeGroups();
					calcAgegroups();
   				});

d3.select('#ageSliderHolder').call(ageGroupSlider);


  // move the sliding container to initial position if not end year
  birthyears.attr("transform", "translate(0," + (y(year1) - y(year)) + ")");

  // Produce a map from year and birthyear to [male, female].
  data = d3.nest()
      .key(function(d) { return d.year; })
      .key(function(d) { return d.variant; })
      .key(function(d) { return d.year - d.age; })
      .rollup(function(v) { return v.map(function(d) { return d.people; }); })
      .map(data);

  // Add an axis to show the population values.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      	.attr("x", width/2 )
        .attr("y",  32 )
        .attr("class", "xAxisLabel")
        .text(xMen);

  // Add a *** 2nd axis *** to show the population values of women to the right.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+(width+centerPadding)+"," + height + ")")
      .call(wAxis)
      .append("text")
      	.attr("x", width/2 )
        .attr("y",  32 )
        .attr("class", "xAxisLabel")
        .text(xWomen);


   // A label for the current year.
  title = svg.append("text")
   	.attr("class", "title")
   	.attr("x", (width * 2) - 10 )
   	.attr("y", 65)
   	.text(year);

 	pastFuture();



  // Add labeled rects for each birthyear (so that no enter or exit is required).
  birthyear = birthyears.selectAll(".birthyear")
      .data(d3.range(year0 - age1, year1 + 1, 1))	// 1yr agebands for every year
    .enter().append("g")
      .attr("class", function(birthyear) { return birthyear==clickBirthYear ? "clickBirthYear" : "birthyear" }) // in case highlight birthyears was invoked by URL
      .attr("transform", function(birthyear) { return "translate(0," + y(birthyear) + ")"; })
      .on("mouseover", function(d) {
	      if (clickBirthYear==0) {
      			d3.select(this).select("text").style("opacity", 0)
      			// no highlight of the symmetry
      			d3.select(this).select(".males").style("fill", highlight)
      			d3.select(this).select(".females").style("fill", highlight)
      			d3.select(this).append("text")
      						.attr("class", "hoverBirthYear")
      						.attr("x", width-10)
      						.attr("y", -1)
      						.attr("text-anchor", "end")
  							.text(bYearTxt[language]+" "+d);
      			d3.select(this).append("text")
      						.attr("class", "hoverBirthYear hoverTotals")
      						.attr("x", width+centerPadding+10)
      						.attr("y", -1)
      						.attr("text-anchor", "start")
  							.text(thsd((data[year][tmpVariant][d][0]+data[year][tmpVariant][d][1])*1000)+" "+persTxt[language]);
  				}
      		})
      .on("click", function(d) {
	      if (clickBirthYear==0) {
	      		clickBirthYear = d;
	      		state.birthyear.val = clickBirthYear;
	      		rewriteHash();
      			d3.select(this).attr("class", "clickBirthYear")
      			}
	      })
      .on("mouseout", function(d, i) {
        	if (clickBirthYear==0) {
        		d3.select(this).select(".males").style("fill", tmpMcolor);
        		d3.select(this).select(".females").style("fill", tmpFcolor);
      			d3.select(this).select("text").style("opacity", 1);
	  			d3.select(this).selectAll(".hoverBirthYear").remove();
	  			}
      		});

  birthyear.selectAll("rect")
     .data(function(birthyear) {
     	     	var mf = !data[year][tmpVariant][birthyear] ? [0, 0] : data[year][tmpVariant][birthyear];
     	     	var sym = d3.min(mf);
     		return [mf[0], mf[1], sym, sym];	// pyramid and symmetry
     })
    .enter().append("rect")
      .attr("y", -barHeight / 2)
      .attr("height", barHeight)
      .attr("class", function(d, i){
      		if (i==0) {return "males"}
      		if (i==1) {return "females"}
      		if (i>1) {return "symmetry"}
      })
      .style("fill", function(d, i){		// in case initial year is in the past
      		if (i==0) {return tmpMcolor}
      		if (i==1) {return tmpFcolor}
      })
      .attr("x", function(d, i){
      		return i % 2 ? width+centerPadding : x(d)})
      .attr("width", function(d, i){
      		return i % 2 ? w(d) : width - x(d)});

  // Add labels to show birthyear.
  birthyear.append("text")
      .attr("x", width - 20)
      .attr("dy", ".35em")
      .text(function(birthyear, i) { return (i+6) % 5 ? "" : birthyear }); // +6 by trial & error

  // Add labels to show age (separate; not animated).
  svg.selectAll(".age")
      .data(d3.range(0, age1 + 2, nrYticks))	// 5year label up to 100 (+2 ?)
    .enter().append("text")
      .attr("class", "age")
      .attr("y", function(age) { return y(year1 - age); }) // may be an issue with the original: year1 instead of year
      .attr("x", width + centerPadding/2)
      .attr("dy", ".3em")
      .text(function(age) { return age; });

  	// draw Play/Pause UI on top of scales
  	// Icons from the material design project
    // https://github.com/google/material-design-icons
    var pause = "M18 32h4V16h-4v16zm6-28C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16zm2-8h4V16h-4v16z";
    var play = "M20 33l12-9-12-9v18zm4-29C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z";

    uiHolder = svg.append("g")
    				.attr("transform","scale(" + 2.5 + ")")
    				.attr("class", "noPrint")
    				.style("fill", "#999");




    uiHolder.append("path")
    	.attr("d", pause)
    	.attr("id", "pause")
    	.style("opacity", 0);



    uiHolder.append("path")
    	.attr("d", play)
    	.attr("id", "play");


    uiHolder.append("path")
    	.attr("d", "M0 0h48v48H0z")
    	.style("opacity", 0)
    	.on("click", toggleAnimate);


  // Allow the arrow keys to change the displayed year.
  window.focus();
  d3.select(window).on("keydown", function() {
    switch (d3.event.keyCode) {
      case 37: year = Math.max(year0, year - 1); break;
      case 39: year = Math.min(year1, year + 1); break;
    }
    pyramid(year);
  });


calcAgegroups();


// in case some settings were invoked by URL parameters
if (currSize=="m") {

	d3.selectAll(".birthyear")
		.style("fill", "none");

	d3.selectAll(".age")
		.style("font-size", "14px");

	d3.selectAll(".tick text")
		.style("font-size", "12px");

	d3.selectAll(".xAxisLabel")
		.style("font-size", "12px");
}

if (ageState) {
	ageState=false;
	firstRun=true;
	toggleAgeLimits();
	}

if (clickBirthYear!=0) {

 	d3.select(".clickBirthYear").select(".males").style("fill", highlight);
 	d3.select(".clickBirthYear").select(".females").style("fill", highlight);

	d3.select(".clickBirthYear").append("text")
				.attr("class", "hoverBirthYear")
				.attr("x", width-10)
				.attr("y", -1)
				.attr("text-anchor", "end")
				.text(bYearTxt[language]+" "+clickBirthYear);
	d3.select(".clickBirthYear").append("text")
				.attr("class", "hoverBirthYear hoverTotals")
				.attr("x", width+centerPadding+10)
				.attr("y", -1)
				.attr("text-anchor", "start")
				.text(thsd((data[year][tmpVariant][clickBirthYear][0]+data[year][tmpVariant][clickBirthYear][1])*1000)+" "+persTxt[language]);
	}

if (initialOutline) { outline(ioYear, ioVariant) }

// TESTING SCREEN SIZE DETECTION
// title.text(document.documentElement.clientWidth);
// title.text(window.innerWidth);

// remove loading indicator
d3.selectAll(".hourglass").remove();

}); // end of stuff that gets done after loading the csv data



// Mousewheel Scrolling thanks to
// http://blog.paranoidferret.com/index.php/2007/10/31/javascript-tutorial-the-scroll-wheel/

function hookEvent(element, eventName, callback)
{
  if(typeof(element) == "string")
    element = document.getElementById(element);
  if(element == null)
    return;
  if(element.addEventListener)
  {
    if(eventName == 'mousewheel')
    {
      element.addEventListener('DOMMouseScroll',
        callback, false);
    }
    element.addEventListener(eventName, callback, false);
  }
  else if(element.attachEvent)
    element.attachEvent("on" + eventName, callback);
}

function MouseWheel(e)
{
  e.preventDefault();
  e.stopPropagation();
  e = e ? e : window.event;
  var wheelData = e.detail ? e.detail * -1 : e.wheelDelta;
  wheelData > 0 ? year = Math.max(year0, year - 1) : year = Math.min(year1, year + 1);
  scrollPyramid(year, currVariant);
}


// tries to emulate the mousewheel behaviour on swipe in y-axis

touchStart = function(event) {
		startY = event.touches[0].pageY;
		keepTrackOfTouches = event.touches.length;
	}

touchEnd = function(event) {
		keepTrackOfTouches = event.touches.length;
	}

touchMove = function(event) {
	// Prevent scrolling on the pyramd div
	event.preventDefault();

	// do the following only when x fingers are touching simultanously
	if (keepTrackOfTouches == 1) {

		var y = startY - event.touches[0].pageY;
		y < 0 ? year = Math.max(year0, year - 1) : year = Math.min(year1, year + 1);
		scrollPyramid(year, currVariant);
	}
}



function calcAgegroups() {
	year < beginProjection ? tmpVariant = "v0" : tmpVariant = currVariant;
	// Total Pop incl. 100+ AGE GROUP (males and females)
	var tmpVariantInt = +tmpVariant.split("v")[1];
	var sum = +datacsv[year].m[tmpVariantInt][0].Total + ( datacsv[year].w[tmpVariantInt][0].Total -0);


	drawBarChart(year,tmpVariantInt,sum)
	drawGenerations();
}

function drawBarChart(year,tmpVariantInt,sum) {

        //get the barchart elements

        var sra65bar = d3.select("#sra65");
        var sra67bar = d3.select("#sra67");
        var sra69bar = d3.select("#sra69");

        //get the barchart elements widths
        var sraBarWidths = calcSraBarWidths(year,tmpVariantInt,sum);

        //adjust the elements widths
        sra65bar.style('width',(sraBarWidths[0] + 110) + 'px');
        sra67bar.style('width',(sraBarWidths[1] + 85) + 'px');
        sra69bar.style('width',(sraBarWidths[2] + 50) + 'px');

        //write text on the bars aswell.
        sra65bar.html(sraBarWidths[0].toFixed(1) + '% <p class="chartbarsubtext">65</p>');
        sra67bar.html(sraBarWidths[1].toFixed(1) + '% <p class="chartbarsubtext">67</p>');
        sra69bar.html(sraBarWidths[2].toFixed(1) + '% <p class="chartbarsubtext">69</p>');

        //adjust the totalpopulationbar
        //var totalPopBar = d3.select('.totalpopbar');


        //adjust text on the total population bar
        d3.select('#totalpoptext').text('Total Population: ' + (sum * 1000).toLocaleString())

    }

function calcSraBarWidths(year,tmpVariantInt,sum) {

        var num65below = 0;
        for (var i=0;i<65;i++)	{
		num65below += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }
	    var num65plus = sum  - num65below;
	    var num20to65 = 0;
	    for (var i=20;i<65;i++)	{
		num20to65 += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }

	    var num67below = 0;
        for (var i=0;i<67;i++)	{
		num67below += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }
	    var num67plus = sum - num67below;
	    var num20to67 = 0;
	    for (var i=20;i<67;i++)	{
		num20to67 += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }

	    var num69below = 0;
        for (var i=0;i<69;i++)	{
		num69below += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }
	    var num69plus = sum - num69below;
	    var num20to69 = 0;
	    for (var i=20;i<69;i++)	{
		num20to69 += data[year][tmpVariant][year-i][0] + data[year][tmpVariant][year-i][1];
	    }

	    var perc65plus = num65plus/num20to65 * 100;
	    var perc67plus = num67plus/num20to67 * 100;
	    var perc69plus = num69plus/num20to69 * 100;


	    return [perc65plus,perc67plus,perc69plus];

}

function drawGenerations() {
        var p = 0;

        for (var i = 0;i < Object.keys(generationDividers).length;i++) {
        var generationLeaderText = Object.keys(generationDividers)[i] + " to " + (Object.keys(generationDividers)[i + 1] - 1);

        var filterGenerationLeader = birthyear.filter(function(d) {
	        return (d == (Object.keys(generationDividers)[i]))
	         });

	       filterGenerationLeader.append("text")
	               .attr("class", "generationLeader")
				   .attr("x", width-10)
				   .attr("y", -1)
				   .attr("text-anchor", "end")
				   .text(generationLeaderText);
			filterGenerationLeader.append("text")
				   .attr("class", "generationLeader")
      			   .attr("x", width+centerPadding+10)
      			   .attr("y", -1)
      			   .attr("text-anchor", "start")
  				   .text(generationDividers[Object.keys(generationDividers)[i]]);



	        var filterGeneration = birthyear.filter(function(d) {
		    return (d >= Object.keys(generationDividers)[i] && d < Object.keys(generationDividers)[i + 1])
		    });

            if (i%2 == 0 || i == 0) {
	            filterGeneration.selectAll(".males").style("stroke", "#000");
	            filterGeneration.selectAll(".females").style("stroke", "#000");
	            }
	     }
}


// reset clicked birthYear
function resetClicked() {

 	d3.selectAll(".hoverBirthYear").remove();
 	d3.select(".clickBirthYear").select(".males").style("fill", tmpMcolor);
 	d3.select(".clickBirthYear").select(".females").style("fill", tmpFcolor);
 	d3.select(".clickBirthYear").select("text").style("opacity", 1);
 	d3.select(".clickBirthYear").attr("class", "birthyear");
 	clickBirthYear = 0;
 	state.birthyear.val = clickBirthYear;
 	rewriteHash();
}


// this will move a clicked birthyear along
// via animation, slider, scrollwheel, touch or keyboard
// until it reaches either end of the pyramid (top or bottom)
function movingBirthYear() {

	if (clickBirthYear == 0) {

 		// since mouseout is not triggered during animated pyramid
	 	d3.selectAll(".hoverBirthYear").remove()

 	} else {

 	if ((year-clickBirthYear)< 0 || (year-clickBirthYear)>99) {

 		resetClicked();

 	} else {

 	 	d3.select(".clickBirthYear").select(".hoverTotals")
	 		.text(thsd((data[year][tmpVariant][clickBirthYear][0]+data[year][tmpVariant][clickBirthYear][1])*1000)+" "+persTxt[language]);
 		}
	}
}

// the past has only one variant ("v0")
// the future has usually several ("v1", "v2", "v3" …)
// color-switching of the bars is done here as well
// if necessary

// maybe reference only once for performance?

var assumptionsDiv=d3.selectAll(".futureMeta");

function pastFuture() {

	var beforeColor=tmpMcolor;
    title.text(year);


	if (year < beginProjection) {
		assumptionsDiv.style("display", "none");
	    tmpVariant = "v0"
		state.variant.val = "2";
	    tmpMcolor = pastMcolor;
	    tmpFcolor = pastFcolor;
    } else {
		assumptionsDiv.style("display", "block");
	    tmpVariant = currVariant;
		state.variant.val = tmpVariant.substring(1, 2);
	    tmpMcolor = futureMcolor;
	    tmpFcolor = futureFcolor;
    }

	// minimize repaints
    if (beforeColor!=tmpMcolor) {

	    d3.selectAll(".males").style("fill", tmpMcolor);
	    d3.selectAll(".females").style("fill", tmpFcolor);
	 	d3.select(".clickBirthYear").select(".males").style("fill", highlight)
	 	d3.select(".clickBirthYear").select(".females").style("fill", highlight)
    }
}


function pyramid(myYear) {

    year = myYear;
	yearSlider.value(year);
 	pastFuture();

    birthyears
    	.transition()
    	.ease("linear")
        .duration(speed)
        .attr("transform", "translate(0," + (y(year1) - y(year)) + ")");

    birthyear.selectAll("rect")
     .data(function(birthyear) {
     	     	var mf = !data[year][tmpVariant][birthyear] ? [0, 0] : data[year][tmpVariant][birthyear];
     	     	var sym = d3.min(mf);
     		return [mf[0], mf[1], sym, sym];	// pyramid and symmetry
     })
      .transition()
        .duration(speed)
      .attr("x", function(d, i){
      		return i % 2 ? width+centerPadding : x(d)})
      .attr("width", function(d, i){
      		return i % 2 ? w(d) : width - x(d)});

	  movingBirthYear();
	  calcAgegroups();
 }


// similar to the pyramid but without transitions
function scrollPyramid(myYear, myVariant) {

    year = myYear;
	yearSlider.value(year);

	currVariant = myVariant;
	pastFuture();

	state.year.val=year;
	rewriteHash();

    birthyears
        .attr("transform", "translate(0," + (y(year1) - y(year)) + ")");

    birthyear.selectAll("rect")
     .data(function(birthyear) {
     	     	var mf = !data[year][tmpVariant][birthyear] ? [0, 0] : data[year][tmpVariant][birthyear];
     	     	var sym = d3.min(mf);
     		return [mf[0], mf[1], sym, sym];	// pyramid and symmetry
     })
      .attr("x", function(d, i){
      		return i % 2 ? width+centerPadding : x(d)})
      .attr("width", function(d, i){
      		return i % 2 ? w(d) : width - x(d)});

	  movingBirthYear();
	  calcAgegroups();
	  if (ageState) {paintAgeGroups();}
}





  function nextPyramid() {

		year+=1;
		if (year > year1) {

			stopAnimate();
			birthyears
				.transition()
				.delay(speed*3)
				.duration(1000)
				.style("opacity", 0)
				.each("end", function() {

						if (ageState) {paintAgeGroups();};
						scrollPyramid(year0, currVariant);
						birthyears
						.transition()
						.duration(1000)
						.style("opacity", 1)
						.each("end", function() {
								startAnimate();
							});
					});

		} else {

			if (ageState) {paintAgeGroups();}
			pyramid(year);

			state.year.val=year;
			rewriteHash();

		}
  }

  function startAnimate() {

  	 animate = setInterval(nextPyramid, speed);

     uiHolder.select("#play")
     	.style("opacity", 0)
  	 uiHolder.select("#pause")
     	.style("opacity", 1)

  }

  function stopAnimate() {

     uiHolder.select("#pause")
     	.style("opacity", 0)
     uiHolder.select("#play")
     	.style("opacity", 1)

  	 clearInterval(animate);
  }

  function toggleAnimate() {
  	animState = !animState;
  	animState ? startAnimate() : stopAnimate();
  }


function rewriteHash() {

	// the "!" gets filtered out in the readHash function
	// but otherwise keeps the scrolling position of the page intact
	var myHash="!";

	for (var key in state) {
			if (state[key].hasOwnProperty('val') && state[key].val != state[key].default) {
			myHash += state[key].hsh +"="+ state[key].val +"&";
			}
		}
	// boolean values are represented with just their parameter shortname present or not
	myHash = myHash.replace(/=true/,'');
	// removes the last "&" for aesthetic reasons (end of line)
	location.hash = myHash.replace(/&$/,'');
}
