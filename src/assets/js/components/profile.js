var $$ = require('domtastic');

require.ensure([], function (require) {
	var Chart = require('chart.js');
	
	Chart.defaults.global.hover.mode = 'nearest';
	
	var data = {
		labels:   [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July"
		],
		datasets: [
			{
				label:                "My First dataset",
				fillColor:            "rgba(220,220,220,0.2)",
				strokeColor:          "rgba(220,220,220,1)",
				pointColor:           "rgba(220,220,220,1)",
				pointStrokeColor:     "#fff",
				pointHighlightFill:   "#fff",
				pointHighlightStroke: "rgba(0,0,0,.15)",
				data:                 [
					65,
					59,
					80,
					81,
					56,
					55,
					40
				],
				backgroundColor:      "#4CAF50"
			},
			{
				label:                "My Second dataset",
				fillColor:            "rgba(255,255,255,.25)",
				strokeColor:          "rgba(255,255,255,.75)",
				pointColor:           "#fff",
				pointStrokeColor:     "#fff",
				pointHighlightFill:   "#fff",
				pointHighlightStroke: "rgba(0,0,0,.15)",
				data:                 [
					28,
					48,
					40,
					19,
					86,
					27,
					90
				]
			}
		]
	};
	
	var dataPie = [
		{
			value:     300,
			color:     "#F7464A",
			highlight: "#FF5A5E",
			label:     "Red"
		},
		{
			value:     50,
			color:     "#46BFBD",
			highlight: "#5AD3D1",
			label:     "Green"
		},
		{
			value:     100,
			color:     "#FDB45C",
			highlight: "#FFC870",
			label:     "Yellow"
		}
	];
	
	var option = {
//		responsive:             true,
		// set font color
		scaleFontColor:         "#fff",
		// font family
		defaultFontFamily:      "'Roboto', sans-serif",
		// background grid lines color
		scaleGridLineColor:     "rgba(255,255,255,.1)",
		// hide vertical lines
		scaleShowVerticalLines: false
	};
	
//	var ctx = document.getElementById("myChart");
//	var myLineChart = new Chart(ctx,{
//		type: 'line',
//		data: data,
////		options:option
//	});

	
}, 'chart');