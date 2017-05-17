var $$ = require('domtastic');
var template = require('../module/template');
var Hooks = require("../module/hooks");


var tabledata = {
	tableHeader: [
		{
			key: 'hour',
			name: 'Hour'
		}, {
			key: 'country',
			name: 'Country'
		}, {
			key: 'event',
			name: 'Name'
		}, {
			key: 'actual',
			name: 'Actual'
		}, {
			key: 'exp',
			name: 'Exp.'
		}, {
			key: 'prior',
			name: 'Prior'
		}, {
			key: 'chart',
			name: 'Chart'
		}
	],
	data: [
		{
			date: 'Tue, Apr 25',
			cols: [
				[
					{
						key:'hour',
						value:'10:00'
					},
					{
						key:'country',
						value:'US'
					},
					{
						key:'event',
						value:'Consumer Confidence'
					},
					{
						key:'actual',
						value:'120.3'
					},
					{
						key:'exp',
						value:'122.5'
					},
					{
						key:'prior',
						value:'125.6'
					},
					{
						key:'chart',
						value:'http://charts.macrospike.com/c/12665'
					}
				],
				[
					{
						key:'hour',
						value:'10:00'
					},
					{
						key:'country',
						value:'US'
					},
					{
						key:'event',
						value:'Consumer Confidence'
					},
					{
						key:'actual',
						value:'120.3'
					},
					{
						key:'exp',
						value:'122.5'
					},
					{
						key:'prior',
						value:'125.6'
					},
					{
						key:'chart',
						value:'http://charts.macrospike.com/c/12665'
					}
				],
			]
			
		},
		{
			date: 'Wed, Apr 26',
			cols: [
				[
					{
						key:'hour',
						value:'10:00'
					},
					{
						key:'country',
						value:'US'
					},
					{
						key:'event',
						value:'Consumer Confidence'
					},
					{
						key:'actual',
						value:'120.3'
					},
					{
						key:'exp',
						value:'122.5'
					},
					{
						key:'prior',
						value:'125.6'
					},
					{
						key:'chart',
						value:'http://charts.macrospike.com/c/12665'
					}
				],
				[
					{
						key:'hour',
						value:'10:00'
					},
					{
						key:'country',
						value:'US'
					},
					{
						key:'event',
						value:'Consumer Confidence'
					},
					{
						key:'actual',
						value:'120.3'
					},
					{
						key:'exp',
						value:'122.5'
					},
					{
						key:'prior',
						value:'125.6'
					},
					{
						key:'chart',
						value:'http://charts.macrospike.com/c/12665'
					}
				],
			]
			
		}
	]
};

var fxfxsCalendarTable = $$('#fxfxs_calendar');
if (fxfxsCalendarTable.length) {
	
	
	var tableMobile = template('fxfxs-calendar-mobile', {'item': tabledata});
	
	fxfxsCalendarTable.html(tableMobile);
	
	console.log(tableMobile);
}