/**
 * NProgress, (c) 2013, 2014 Rico Sta. Cruz - http://ricostacruz.com/nprogress * @license MIT
 */

;(function(root, factory) {
	
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.NProgress = factory();
	}
	
})(this, function() {
	var NProgress = {};
	
	NProgress.version = '0.1.6';
	
	var Settings = NProgress.settings = {
		minimum: 0.08,
		easing: 'ease',
		positionUsing: '',
		speed: 200,
		trickle: true,
		trickleRate: 0.02,
		trickleSpeed: 800,
		showSpinner: true,
		barSelector: '[role="bar"]',
		spinnerSelector: '[role="spinner"]',
		parent: 'body',
		template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
	};
	
	/**
	 * Updates configuration.
	 *
	 *     NProgress.configure({
   *       minimum: 0.1
   *     });
	 */
	NProgress.configure = function(options) {
		var key, value;
		for (key in options) {
			value = options[key];
			if (value !== undefined && options.hasOwnProperty(key)) Settings[key] = value;
		}
		
		return this;
	};
	
	/**
	 * Last number.
	 */
	
	NProgress.status = null;
	
	/**
	 * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
	 *
	 *     NProgress.set(0.4);
	 *     NProgress.set(1.0);
	 */
	
	NProgress.set = function(n) {
		var started = NProgress.isStarted();
		
		n = clamp(n, Settings.minimum, 1);
		NProgress.status = (n === 1 ? null : n);
		
		var progress = NProgress.render(!started),
			bar      = progress.querySelector(Settings.barSelector),
			speed    = Settings.speed,
			ease     = Settings.easing;
		
		progress.offsetWidth; /* Repaint */
		
		queue(function(next) {
			// Set positionUsing if it hasn't already been set
			if (Settings.positionUsing === '') Settings.positionUsing = NProgress.getPositioningCSS();
			
			// Add transition
			css(bar, barPositionCSS(n, speed, ease));
			
			if (n === 1) {
				// Fade out
				css(progress, {
					transition: 'none',
					opacity: 1
				});
				progress.offsetWidth; /* Repaint */
				
				setTimeout(function() {
					css(progress, {
						transition: 'all ' + speed + 'ms linear',
						opacity: 0
					});
					setTimeout(function() {
						NProgress.remove();
						next();
					}, speed);
				}, speed);
			} else {
				setTimeout(next, speed);
			}
		});
		
		return this;
	};
	
	NProgress.isStarted = function() {
		return typeof NProgress.status === 'number';
	};
	
	/**
	 * Shows the progress bar.
	 * This is the same as setting the status to 0%, except that it doesn't go backwards.
	 *
	 *     NProgress.start();
	 *
	 */
	NProgress.start = function() {
		if (!NProgress.status) NProgress.set(0);
		
		var work = function() {
			setTimeout(function() {
				if (!NProgress.status) return;
				NProgress.trickle();
				work();
			}, Settings.trickleSpeed);
		};
		
		if (Settings.trickle) work();
		
		return this;
	};
	
	/**
	 * Hides the progress bar.
	 * This is the *sort of* the same as setting the status to 100%, with the
	 * difference being `done()` makes some placebo effect of some realistic motion.
	 *
	 *     NProgress.done();
	 *
	 * If `true` is passed, it will show the progress bar even if its hidden.
	 *
	 *     NProgress.done(true);
	 */
	
	NProgress.done = function(force) {
		if (!force && !NProgress.status) return this;
		
		return NProgress.inc(0.3 + 0.5 * Math.random()).set(1);
	};
	
	/**
	 * Increments by a random amount.
	 */
	
	NProgress.inc = function(amount) {
		var n = NProgress.status;
		
		if (!n) {
			return NProgress.start();
		} else {
			if (typeof amount !== 'number') {
				amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
			}
			
			n = clamp(n + amount, 0, 0.994);
			return NProgress.set(n);
		}
	};
	
	NProgress.trickle = function() {
		return NProgress.inc(Math.random() * Settings.trickleRate);
	};
	
	/**
	 * Waits for all supplied jQuery promises and
	 * increases the progress as the promises resolve.
	 *
	 * @param $promise jQUery Promise
	 */
	(function() {
		var initial = 0, current = 0;
		
		NProgress.promise = function($promise) {
			if (!$promise || $promise.state() == "resolved") {
				return this;
			}
			
			if (current == 0) {
				NProgress.start();
			}
			
			initial++;
			current++;
			
			$promise.always(function() {
				current--;
				if (current == 0) {
					initial = 0;
					NProgress.done();
				} else {
					NProgress.set((initial - current) / initial);
				}
			});
			
			return this;
		};
		
	})();
	
	/**
	 * (Internal) renders the progress bar markup based on the `template`
	 * setting.
	 */
	
	NProgress.render = function(fromStart) {
		if (NProgress.isRendered()) return document.getElementById('nprogress');
		
		addClass(document.documentElement, 'nprogress-busy');
		
		var progress = document.createElement('div');
		progress.id = 'nprogress';
		progress.innerHTML = Settings.template;
		
		var bar      = progress.querySelector(Settings.barSelector),
			perc     = fromStart ? '-100' : toBarPerc(NProgress.status || 0),
			parent   = document.querySelector(Settings.parent),
			spinner;
		
		css(bar, {
			transition: 'all 0 linear',
			transform: 'translate3d(' + perc + '%,0,0)'
		});
		
		if (!Settings.showSpinner) {
			spinner = progress.querySelector(Settings.spinnerSelector);
			spinner && removeElement(spinner);
		}
		
		if (parent != document.body) {
			addClass(parent, 'nprogress-custom-parent');
		}
		
		parent.appendChild(progress);
		return progress;
	};
	
	/**
	 * Removes the element. Opposite of render().
	 */
	
	NProgress.remove = function() {
		removeClass(document.documentElement, 'nprogress-busy');
		removeClass(document.querySelector(Settings.parent), 'nprogress-custom-parent')
		var progress = document.getElementById('nprogress');
		progress && removeElement(progress);
	};
	
	/**
	 * Checks if the progress bar is rendered.
	 */
	
	NProgress.isRendered = function() {
		return !!document.getElementById('nprogress');
	};
	
	/**
	 * Determine which positioning CSS rule to use.
	 */
	
	NProgress.getPositioningCSS = function() {
		// Sniff on document.body.style
		var bodyStyle = document.body.style;
		
		// Sniff prefixes
		var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
		                   ('MozTransform' in bodyStyle) ? 'Moz' :
		                   ('msTransform' in bodyStyle) ? 'ms' :
		                   ('OTransform' in bodyStyle) ? 'O' : '';
		
		if (vendorPrefix + 'Perspective' in bodyStyle) {
			// Modern browsers with 3D support, e.g. Webkit, IE10
			return 'translate3d';
		} else if (vendorPrefix + 'Transform' in bodyStyle) {
			// Browsers without 3D support, e.g. IE9
			return 'translate';
		} else {
			// Browsers without translate() support, e.g. IE7-8
			return 'margin';
		}
	};
	
	/**
	 * Helpers
	 */
	
	function clamp(n, min, max) {
		if (n < min) return min;
		if (n > max) return max;
		return n;
	}
	
	/**
	 * (Internal) converts a percentage (`0..1`) to a bar translateX
	 * percentage (`-100%..0%`).
	 */
	
	function toBarPerc(n) {
		return (-1 + n) * 100;
	}
	
	
	/**
	 * (Internal) returns the correct CSS for changing the bar's
	 * position given an n percentage, and speed and ease from Settings
	 */
	
	function barPositionCSS(n, speed, ease) {
		var barCSS;
		
		if (Settings.positionUsing === 'translate3d') {
			barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
		} else if (Settings.positionUsing === 'translate') {
			barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
		} else {
			barCSS = { 'margin-left': toBarPerc(n)+'%' };
		}
		
		barCSS.transition = 'all '+speed+'ms '+ease;
		
		return barCSS;
	}
	
	/**
	 * (Internal) Queues a function to be executed.
	 */
	
	var queue = (function() {
		var pending = [];
		
		function next() {
			var fn = pending.shift();
			if (fn) {
				fn(next);
			}
		}
		
		return function(fn) {
			pending.push(fn);
			if (pending.length == 1) next();
		};
	})();
	
	/**
	 * (Internal) Applies css properties to an element, similar to the jQuery
	 * css method.
	 *
	 * While this helper does assist with vendor prefixed property names, it
	 * does not perform any manipulation of values prior to setting styles.
	 */
	
	var css = (function() {
		var cssPrefixes = [ 'Webkit', 'O', 'Moz', 'ms' ],
			cssProps    = {};
		
		function camelCase(string) {
			return string.replace(/^-ms-/, 'ms-').replace(/-([\da-z])/gi, function(match, letter) {
				return letter.toUpperCase();
			});
		}
		
		function getVendorProp(name) {
			var style = document.body.style;
			if (name in style) return name;
			
			var i = cssPrefixes.length,
				capName = name.charAt(0).toUpperCase() + name.slice(1),
				vendorName;
			while (i--) {
				vendorName = cssPrefixes[i] + capName;
				if (vendorName in style) return vendorName;
			}
			
			return name;
		}
		
		function getStyleProp(name) {
			name = camelCase(name);
			return cssProps[name] || (cssProps[name] = getVendorProp(name));
		}
		
		function applyCss(element, prop, value) {
			prop = getStyleProp(prop);
			element.style[prop] = value;
		}
		
		return function(element, properties) {
			var args = arguments,
				prop,
				value;
			
			if (args.length == 2) {
				for (prop in properties) {
					value = properties[prop];
					if (value !== undefined && properties.hasOwnProperty(prop)) applyCss(element, prop, value);
				}
			} else {
				applyCss(element, args[1], args[2]);
			}
		}
	})();
	
	/**
	 * (Internal) Determines if an element or space separated list of class names contains a class name.
	 */
	
	function hasClass(element, name) {
		var list = typeof element == 'string' ? element : classList(element);
		return list.indexOf(' ' + name + ' ') >= 0;
	}
	
	/**
	 * (Internal) Adds a class to an element.
	 */
	
	function addClass(element, name) {
		var oldList = classList(element),
			newList = oldList + name;
		
		if (hasClass(oldList, name)) return;
		
		// Trim the opening space.
		element.className = newList.substring(1);
	}
	
	/**
	 * (Internal) Removes a class from an element.
	 */
	
	function removeClass(element, name) {
		var oldList = classList(element),
			newList;
		
		if (!hasClass(element, name)) return;
		
		// Replace the class name.
		newList = oldList.replace(' ' + name + ' ', ' ');
		
		// Trim the opening and closing spaces.
		element.className = newList.substring(1, newList.length - 1);
	}
	
	/**
	 * (Internal) Gets a space separated list of the class names on the element.
	 * The list is wrapped with a single space on each end to facilitate finding
	 * matches within the list.
	 */
	
	function classList(element) {
		return (' ' + (element.className || '') + ' ').replace(/\s+/gi, ' ');
	}
	
	/**
	 * (Internal) Removes an element from the DOM.
	 */
	
	function removeElement(element) {
		element && element.parentNode && element.parentNode.removeChild(element);
	}
	
	return NProgress;
});

/*-
 * Author: Alin Marcu
 * Author URI: https://deconf.com
 * Copyright 2013 Alin Marcu
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 */

"use strict";

if ( gadwpItemData.mapsApiKey ) {
	google.charts.load('current', {mapsApiKey: gadwpItemData.mapsApiKey, 'packages':['corechart', 'table', 'orgchart', 'geochart']});
} else {
	google.charts.load('current', {'packages':['corechart', 'table', 'orgchart', 'geochart']});
}

google.charts.setOnLoadCallback( GADWPReportLoad );

// Get the numeric ID
gadwpItemData.getID = function ( item ) {
	if ( gadwpItemData.scope == 'admin-item' ) {
		if ( typeof item.id == "undefined" ) {
			return 0
		}
		if ( item.id.split( '-' )[ 1 ] == "undefined" ) {
			return 0;
		} else {
			return item.id.split( '-' )[ 1 ];
		}
	} else {
		if ( typeof item.id == "undefined" ) {
			return 1;
		}
		if ( item.id.split( '-' )[ 4 ] == "undefined" ) {
			return 1;
		} else {
			return item.id.split( '-' )[ 4 ];
		}
	}
};

// Get the selector
gadwpItemData.getSelector = function ( scope ) {
	if ( scope == 'admin-item' ) {
		return 'a[id^="gadwp-"]';
	} else {
		return 'li[id^="wp-admin-bar-gadwp"]';
	}
};

gadwpItemData.responsiveDialog = function () {
	var dialog, wWidth, visible;
	
	visible = jQuery( ".ui-dialog:visible" );
	
	// on each visible dialog
	visible.each( function () {
		dialog = jQuery( this ).find( ".ui-dialog-content" ).data( "ui-dialog" );
		// on each fluid dialog
		if ( dialog.options.fluid ) {
			wWidth = jQuery( window ).width();
			// window width vs dialog width
			if ( wWidth < ( parseInt( dialog.options.maxWidth ) + 50 ) ) {
				// don't fill the entire screen
				jQuery( this ).css( "max-width", "90%" );
			} else {
				// maxWidth bug fix
				jQuery( this ).css( "max-width", dialog.options.maxWidth + "px" );
			}
			// change dialog position
			dialog.option( "position", dialog.options.position );
		}
	} );
};

jQuery.fn.extend( {
	gadwpItemReport : function ( itemId ) {
		var postData, tools, template, reports, refresh, init, slug = "-" + itemId;
		
		tools = {
			setCookie : function ( name, value ) {
				var expires, dateItem = new Date();
				
				if ( gadwpItemData.scope == 'admin-widgets' ) {
					name = "gadwp_wg_" + name;
				} else {
					name = "gadwp_ir_" + name;
				}
				dateItem.setTime( dateItem.getTime() + ( 24 * 60 * 60 * 1000 * 7 ) );
				expires = "expires=" + dateItem.toUTCString();
				document.cookie = name + "=" + value + "; " + expires + "; path=/";
			},
			getCookie : function ( name ) {
				var cookie, cookiesArray, div, i = 0;
				
				if ( gadwpItemData.scope == 'admin-widgets' ) {
					name = "gadwp_wg_" + name + "=";
				} else {
					name = "gadwp_ir_" + name + "=";
				}
				cookiesArray = document.cookie.split( ';' );
				for ( i = 0; i < cookiesArray.length; i++ ) {
					cookie = cookiesArray[ i ];
					while ( cookie.charAt( 0 ) == ' ' )
						cookie = cookie.substring( 1 );
					if ( cookie.indexOf( name ) == 0 )
						return cookie.substring( name.length, cookie.length );
				}
				return false;
			},
			escape : function ( str ) {
				var div = document.createElement( 'div' );
				div.appendChild( document.createTextNode( str ) );
				return div.innerHTML;
			}
		};
		
		template = {
			
			addOptions : function ( id, list ) {
				var defaultMetric, defaultDimension, defaultView, output = [];
				
				if ( list == false ) {
					return;
				}
				
				if ( !tools.getCookie( 'default_metric' ) || !tools.getCookie( 'default_dimension' ) ) {
					defaultMetric = 'sessions';
					defaultDimension = '30daysAgo';
				} else {
					defaultMetric = tools.getCookie( 'default_metric' );
					defaultDimension = tools.getCookie( 'default_dimension' );
					defaultView = tools.getCookie( 'default_view' );
				}
				
				jQuery.each( list, function ( key, value ) {
					if ( key == defaultMetric || key == defaultDimension || key == defaultView ) {
						output.push( '<option value="' + key + '" selected="selected">' + value + '</option>' );
					} else {
						output.push( '<option value="' + key + '">' + value + '</option>' );
					}
				} );
				jQuery( id ).html( output.join( '' ) );
			},
			
			init : function () {
				var tpl;
				
				if ( !jQuery( '#gadwp-window' + slug ).length ) {
					return;
				}
				
				if ( jQuery( '#gadwp-window' + slug ).html().length ) { // add main template once
					return;
				}
				
				tpl = '<div id="gadwp-container' + slug + '">';
				if ( gadwpItemData.viewList != false ) {
					tpl += '<select id="gadwp-sel-view' + slug + '"></select>';
				}
				tpl += '<select id="gadwp-sel-period' + slug + '"></select> ';
				tpl += '<select id="gadwp-sel-report' + slug + '"></select>';
				tpl += '<div id="gadwp-progressbar' + slug + '"></div>';
				tpl += '<div id="gadwp-status' + slug + '"></div>';
				tpl += '<div id="gadwp-reports' + slug + '"></div>';
				tpl += '<div style="text-align:right;width:100%;font-size:0.8em;clear:both;margin-right:5px;margin-top:10px;">';
				tpl += gadwpItemData.i18n[ 14 ];
				tpl += ' <a href="https://deconf.com/google-analytics-dashboard-wordpress/?utm_source=gadwp_report&utm_medium=link&utm_content=back_report&utm_campaign=gadwp" rel="nofollow" style="text-decoration:none;font-size:1em;">GADWP</a>&nbsp;';
				tpl += '</div>';
				tpl += '</div>',
					
					jQuery( '#gadwp-window' + slug ).append( tpl );
				
				template.addOptions( '#gadwp-sel-view' + slug, gadwpItemData.viewList );
				template.addOptions( '#gadwp-sel-period' + slug, gadwpItemData.dateList );
				template.addOptions( '#gadwp-sel-report' + slug, gadwpItemData.reportList );
				
			}
		};
		
		reports = {
			oldViewPort: 0,
			orgChartTableChartData : '',
			tableChartData : '',
			orgChartPieChartsData : '',
			geoChartTableChartData : '',
			areaChartBottomStatsData : '',
			realtime : '',
			rtRuns : null,
			i18n : null,
			
			getTitle : function ( scope ) {
				if ( scope == 'admin-item' ) {
					return jQuery( '#gadwp' + slug ).attr( "title" );
				} else {
					return document.getElementsByTagName( "title" )[ 0 ].innerHTML;
				}
			},
			
			alertMessage : function ( msg ) {
				jQuery( "#gadwp-status" + slug ).css( {
					"margin-top" : "3px",
					"padding-left" : "5px",
					"height" : "auto",
					"color" : "#000",
					"border-left" : "5px solid red"
				} );
				jQuery( "#gadwp-status" + slug ).html( msg );
			},
			
			areaChartBottomStats : function ( response ) {
				reports.areaChartBottomStatsData = response;
				if ( jQuery.isArray( response ) ) {
					if ( !jQuery.isNumeric( response[ 0 ] ) ) {
						if ( jQuery.isArray( response[ 0 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							if ( postData.query == 'visitBounceRate,bottomstats' ) {
								reports.drawAreaChart( response[ 0 ], true );
							} else {
								reports.drawAreaChart( response[ 0 ], false );
							}
						} else {
							reports.throwDebug( response[ 0 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-areachart' + slug, response[ 0 ], "125px" );
					}
					if ( !jQuery.isNumeric( response[ 1 ] ) ) {
						if ( jQuery.isArray( response[ 1 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.drawBottomStats( response[ 1 ] );
						} else {
							reports.throwDebug( response[ 1 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-bottomstats' + slug, response[ 1 ], "40px" );
					}
				} else {
					reports.throwDebug( response );
				}
				NProgress.done();
				
			},
			
			orgChartPieCharts : function ( response ) {
				var i = 0;
				reports.orgChartPieChartsData = response;
				if ( jQuery.isArray( response ) ) {
					if ( !jQuery.isNumeric( response[ 0 ] ) ) {
						if ( jQuery.isArray( response[ 0 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.drawOrgChart( response[ 0 ] );
						} else {
							reports.throwDebug( response[ 0 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-orgchart' + slug, response[ 0 ], "125px" );
					}
					
					for ( i = 1; i < response.length; i++ ) {
						if ( !jQuery.isNumeric( response[ i ] ) ) {
							if ( jQuery.isArray( response[ i ] ) ) {
								jQuery( '#gadwp-reports' + slug ).show();
								reports.drawPieChart( 'piechart-' + i, response[ i ], reports.i18n[ i ] );
							} else {
								reports.throwDebug( response[ i ] );
							}
						} else {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.throwError( '#gadwp-piechart-' + i + slug, response[ i ], "80px" );
						}
					}
				} else {
					reports.throwDebug( response );
				}
				NProgress.done();
			},
			
			geoChartTableChart : function ( response ) {
				reports.geoChartTableChartData = response;
				if ( jQuery.isArray( response ) ) {
					if ( !jQuery.isNumeric( response[ 0 ] ) ) {
						if ( jQuery.isArray( response[ 0 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.drawGeoChart( response[ 0 ] );
							reports.drawTableChart( response[ 0 ] );
						} else {
							reports.throwDebug( response[ 0 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-geochart' + slug, response[ 0 ], "125px" );
						reports.throwError( '#gadwp-tablechart' + slug, response[ 0 ], "125px" );
					}
				} else {
					reports.throwDebug( response );
				}
				NProgress.done();
			},
			
			orgChartTableChart : function ( response ) {
				reports.orgChartTableChartData = response;
				if ( jQuery.isArray( response ) ) {
					if ( !jQuery.isNumeric( response[ 0 ] ) ) {
						if ( jQuery.isArray( response[ 0 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.drawOrgChart( response[ 0 ] );
						} else {
							reports.throwDebug( response[ 0 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-orgchart' + slug, response[ 0 ], "125px" );
					}
					
					if ( !jQuery.isNumeric( response[ 1 ] ) ) {
						if ( jQuery.isArray( response[ 1 ] ) ) {
							reports.drawTableChart( response[ 1 ] );
						} else {
							reports.throwDebug( response[ 1 ] );
						}
					} else {
						reports.throwError( '#gadwp-tablechart' + slug, response[ 1 ], "125px" );
					}
				} else {
					reports.throwDebug( response );
				}
				NProgress.done();
			},
			
			tableChart : function ( response ) {
				reports.tableChartData = response;
				if ( jQuery.isArray( response ) ) {
					if ( !jQuery.isNumeric( response[ 0 ] ) ) {
						if ( jQuery.isArray( response[ 0 ] ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.drawTableChart( response[ 0 ] );
						} else {
							reports.throwDebug( response[ 0 ] );
						}
					} else {
						jQuery( '#gadwp-reports' + slug ).show();
						reports.throwError( '#gadwp-tablechart' + slug, response[ 0 ], "125px" );
					}
				} else {
					reports.throwDebug( response );
				}
				NProgress.done();
			},
			
			drawTableChart : function ( data ) {
				var chartData, options, chart;
				
				chartData = google.visualization.arrayToDataTable( data );
				options = {
					page : 'enable',
					pageSize : 10,
					width : '100%',
					allowHtml : true
				};
				chart = new google.visualization.Table( document.getElementById( 'gadwp-tablechart' + slug ) );
				
				chart.draw( chartData, options );
			},
			
			drawOrgChart : function ( data ) {
				var chartData, options, chart;
				
				chartData = google.visualization.arrayToDataTable( data );
				options = {
					allowCollapse : true,
					allowHtml : true,
					height : '100%'
				};
				chart = new google.visualization.OrgChart( document.getElementById( 'gadwp-orgchart' + slug ) );
				
				chart.draw( chartData, options );
			},
			
			drawPieChart : function ( id, data, title ) {
				var chartData, options, chart;
				
				chartData = google.visualization.arrayToDataTable( data );
				options = {
					is3D : false,
					tooltipText : 'percentage',
					legend : 'none',
					chartArea : {
						width : '99%',
						height : '80%'
					},
					title : title,
					pieSliceText : 'value',
					colors : gadwpItemData.colorVariations
				};
				chart = new google.visualization.PieChart( document.getElementById( 'gadwp-' + id + slug ) );
				
				chart.draw( chartData, options );
			},
			
			drawGeoChart : function ( data ) {
				var chartData, options, chart;
				
				chartData = google.visualization.arrayToDataTable( data );
				options = {
					chartArea : {
						width : '99%',
						height : '90%'
					},
					colors : [ gadwpItemData.colorVariations[ 5 ], gadwpItemData.colorVariations[ 4 ] ]
				};
				if ( gadwpItemData.region ) {
					options.region = gadwpItemData.region;
					options.displayMode = 'markers';
					options.datalessRegionColor = 'EFEFEF';
				}
				chart = new google.visualization.GeoChart( document.getElementById( 'gadwp-geochart' + slug ) );
				
				chart.draw( chartData, options );
			},
			
			drawAreaChart : function ( data, format ) {
				var chartData, options, chart, formatter;
				
				chartData = google.visualization.arrayToDataTable( data );
				
				if ( format ) {
					formatter = new google.visualization.NumberFormat( {
						suffix : '%',
						fractionDigits : 2
					} );
					
					formatter.format( chartData, 1 );
				}
				
				options = {
					legend : {
						position : 'none'
					},
					pointSize : 3,
					colors : [ gadwpItemData.colorVariations[ 0 ], gadwpItemData.colorVariations[ 4 ] ],
					chartArea : {
						width : '99%',
						height : '90%'
					},
					vAxis : {
						textPosition : "in",
						minValue : 0
					},
					hAxis : {
						textPosition : 'none'
					}
				};
				chart = new google.visualization.AreaChart( document.getElementById( 'gadwp-areachart' + slug ) );
				
				chart.draw( chartData, options );
			},
			
			drawBottomStats : function ( data ) {
				jQuery( "#gdsessions" + slug ).html( data[ 0 ] );
				jQuery( "#gdusers" + slug ).html( data[ 1 ] );
				jQuery( "#gdpageviews" + slug ).html( data[ 2 ] );
				jQuery( "#gdbouncerate" + slug ).html( data[ 3 ] );
				jQuery( "#gdorganicsearch" + slug ).html( data[ 4 ] );
				jQuery( "#gdpagespervisit" + slug ).html( data[ 5 ] );
				jQuery( "#gdpagetime" + slug ).html( data[ 6 ] );
				jQuery( "#gdpageload" + slug ).html( data[ 7 ] );
				jQuery( "#gdsessionduration" + slug ).html( data[ 8 ] );
			},
			
			rtOnlyUniqueValues : function ( value, index, self ) {
				return self.indexOf( value ) === index;
			},
			
			rtCountSessions : function ( rtData, searchValue ) {
				var count = 0, i = 0;
				
				for ( i = 0; i < rtData[ "rows" ].length; i++ ) {
					if ( jQuery.inArray( searchValue, rtData[ "rows" ][ i ] ) > -1 ) {
						count += parseInt( rtData[ "rows" ][ i ][ 6 ] );
					}
				}
				return count;
			},
			
			rtGenerateTooltip : function ( rtData ) {
				var count = 0, table = "", i = 0;
				
				for ( i = 0; i < rtData.length; i++ ) {
					count += parseInt( rtData[ i ].count );
					table += "<tr><td class='gadwp-pgdetailsl'>" + rtData[ i ].value + "</td><td class='gadwp-pgdetailsr'>" + rtData[ i ].count + "</td></tr>";
				}
				if ( count ) {
					return ( "<table>" + table + "</table>" );
				} else {
					return ( "" );
				}
			},
			
			rtPageDetails : function ( rtData, searchValue ) {
				var sant, pageTitle, pgStatsTable, i = 0, j = 0, sum = 0, newsum = 0, countrfr = 0, countkwd = 0, countdrt = 0, countscl = 0, countcpg = 0, tablerfr = "", tablekwd = "", tablescl = "", tablecpg = "", tabledrt = "";
				
				rtData = rtData[ "rows" ];
				
				for ( i = 0; i < rtData.length; i++ ) {
					
					if ( rtData[ i ][ 0 ] == searchValue ) {
						pageTitle = rtData[ i ][ 5 ];
						
						switch ( rtData[ i ][ 3 ] ) {
							
							case "REFERRAL":
								countrfr += parseInt( rtData[ i ][ 6 ] );
								tablerfr += "<tr><td class='gadwp-pgdetailsl'>" + rtData[ i ][ 1 ] + "</td><td class='gadwp-pgdetailsr'>" + rtData[ i ][ 6 ] + "</td></tr>";
								break;
							case "ORGANIC":
								countkwd += parseInt( rtData[ i ][ 6 ] );
								tablekwd += "<tr><td class='gadwp-pgdetailsl'>" + rtData[ i ][ 2 ] + "</td><td class='gadwp-pgdetailsr'>" + rtData[ i ][ 6 ] + "</td></tr>";
								break;
							case "SOCIAL":
								countscl += parseInt( rtData[ i ][ 6 ] );
								tablescl += "<tr><td class='gadwp-pgdetailsl'>" + rtData[ i ][ 1 ] + "</td><td class='gadwp-pgdetailsr'>" + rtData[ i ][ 6 ] + "</td></tr>";
								break;
							case "CUSTOM":
								countcpg += parseInt( rtData[ i ][ 6 ] );
								tablecpg += "<tr><td class='gadwp-pgdetailsl'>" + rtData[ i ][ 1 ] + "</td><td class='gadwp-pgdetailsr'>" + rtData[ i ][ 6 ] + "</td></tr>";
								break;
							case "DIRECT":
								countdrt += parseInt( rtData[ i ][ 6 ] );
								break;
						}
					}
				}
				
				if ( countrfr ) {
					tablerfr = "<table><tr><td>" + reports.i18n[ 0 ] + "(" + countrfr + ")</td></tr>" + tablerfr + "</table><br />";
				}
				if ( countkwd ) {
					tablekwd = "<table><tr><td>" + reports.i18n[ 1 ] + "(" + countkwd + ")</td></tr>" + tablekwd + "</table><br />";
				}
				if ( countscl ) {
					tablescl = "<table><tr><td>" + reports.i18n[ 2 ] + "(" + countscl + ")</td></tr>" + tablescl + "</table><br />";
				}
				if ( countcpg ) {
					tablecpg = "<table><tr><td>" + reports.i18n[ 3 ] + "(" + countcpg + ")</td></tr>" + tablecpg + "</table><br />";
				}
				if ( countdrt ) {
					tabledrt = "<table><tr><td>" + reports.i18n[ 4 ] + "(" + countdrt + ")</td></tr></table><br />";
				}
				return ( "<p><center><strong>" + pageTitle + "</strong></center></p>" + tablerfr + tablekwd + tablescl + tablecpg + tabledrt );
			},
			
			rtRefresh : function () {
				if ( reports.render.focusFlag ) {
					postData.from = false;
					postData.to = false;
					postData.query = 'realtime';
					jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
						if ( jQuery.isArray( response ) ) {
							jQuery( '#gadwp-reports' + slug ).show();
							reports.realtime = response[ 0 ];
							reports.drawRealtime( reports.realtime );
						} else {
							reports.throwDebug( response );
						}
						
						NProgress.done();
						
					} );
				}
			},
			
			drawRealtime : function ( rtData ) {
				var rtInfoRight, uPagePath, uReferrals, uKeywords, uSocial, uCustom, i = 0, pagepath = [], referrals = [], keywords = [], social = [], visittype = [], custom = [], uPagePathStats = [], pgStatsTable = "", uReferrals = [], uKeywords = [], uSocial = [], uCustom = [], uVisitType = [ "REFERRAL", "ORGANIC", "SOCIAL", "CUSTOM" ], uVisitorType = [ "DIRECT", "NEW" ];
				
				jQuery( function () {
					jQuery( '#gadwp-widget *' ).tooltip( {
						tooltipClass : "gadwp"
					} );
				} );
				
				rtData = rtData[ 0 ];
				
				if ( jQuery.isNumeric( rtData ) || typeof rtData === "undefined" ) {
					rtData = [];
					rtData[ "totalsForAllResults" ] = [];
					rtData[ "totalsForAllResults" ][ "rt:activeUsers" ] = "0";
					rtData[ "rows" ] = [];
				}
				
				if ( rtData[ "totalsForAllResults" ][ "rt:activeUsers" ] !== document.getElementById( "gadwp-online" ).innerHTML ) {
					jQuery( "#gadwp-online" ).fadeOut( "slow" );
					jQuery( "#gadwp-online" ).fadeOut( 500 );
					jQuery( "#gadwp-online" ).fadeOut( "slow", function () {
						if ( ( parseInt( rtData[ "totalsForAllResults" ][ "rt:activeUsers" ] ) ) < ( parseInt( document.getElementById( "gadwp-online" ).innerHTML ) ) ) {
							jQuery( "#gadwp-online" ).css( {
								'background-color' : '#FFE8E8'
							} );
						} else {
							jQuery( "#gadwp-online" ).css( {
								'background-color' : '#E0FFEC'
							} );
						}
						document.getElementById( "gadwp-online" ).innerHTML = rtData[ "totalsForAllResults" ][ "rt:activeUsers" ];
					} );
					jQuery( "#gadwp-online" ).fadeIn( "slow" );
					jQuery( "#gadwp-online" ).fadeIn( 500 );
					jQuery( "#gadwp-online" ).fadeIn( "slow", function () {
						jQuery( "#gadwp-online" ).css( {
							'background-color' : '#FFFFFF'
						} );
					} );
				}
				
				if ( rtData[ "totalsForAllResults" ][ "rt:activeUsers" ] == 0 ) {
					rtData[ "rows" ] = [];
				}
				
				for ( i = 0; i < rtData[ "rows" ].length; i++ ) {
					pagepath.push( rtData[ "rows" ][ i ][ 0 ] );
					if ( rtData[ "rows" ][ i ][ 3 ] == "REFERRAL" ) {
						referrals.push( rtData[ "rows" ][ i ][ 1 ] );
					}
					if ( rtData[ "rows" ][ i ][ 3 ] == "ORGANIC" ) {
						keywords.push( rtData[ "rows" ][ i ][ 2 ] );
					}
					if ( rtData[ "rows" ][ i ][ 3 ] == "SOCIAL" ) {
						social.push( rtData[ "rows" ][ i ][ 1 ] );
					}
					if ( rtData[ "rows" ][ i ][ 3 ] == "CUSTOM" ) {
						custom.push( rtData[ "rows" ][ i ][ 1 ] );
					}
					visittype.push( rtData[ "rows" ][ i ][ 3 ] );
				}
				
				uPagePath = pagepath.filter( reports.rtOnlyUniqueValues );
				for ( i = 0; i < uPagePath.length; i++ ) {
					uPagePathStats[ i ] = {
						"pagepath" : uPagePath[ i ],
						"count" : reports.rtCountSessions( rtData, uPagePath[ i ] )
					}
				}
				uPagePathStats.sort( function ( a, b ) {
					return b.count - a.count
				} );
				
				pgStatsTable = "";
				for ( i = 0; i < uPagePathStats.length; i++ ) {
					if ( i < gadwpItemData.rtLimitPages ) {
						pgStatsTable += '<div class="gadwp-pline"><div class="gadwp-pleft"><a href="#" data-gadwp="' + reports.rtPageDetails( rtData, uPagePathStats[ i ].pagepath ) + '">' + uPagePathStats[ i ].pagepath.substring( 0, 70 ) + '</a></div><div class="gadwp-pright">' + uPagePathStats[ i ].count + '</div></div>';
					}
				}
				document.getElementById( "gadwp-pages" ).innerHTML = '<br /><div class="gadwp-pg">' + pgStatsTable + '</div>';
				
				uReferrals = referrals.filter( reports.rtOnlyUniqueValues );
				for ( i = 0; i < uReferrals.length; i++ ) {
					uReferrals[ i ] = {
						"value" : uReferrals[ i ],
						"count" : reports.rtCountSessions( rtData, uReferrals[ i ] )
					};
				}
				uReferrals.sort( function ( a, b ) {
					return b.count - a.count
				} );
				
				uKeywords = keywords.filter( reports.rtOnlyUniqueValues );
				for ( i = 0; i < uKeywords.length; i++ ) {
					uKeywords[ i ] = {
						"value" : uKeywords[ i ],
						"count" : reports.rtCountSessions( rtData, uKeywords[ i ] )
					};
				}
				uKeywords.sort( function ( a, b ) {
					return b.count - a.count
				} );
				
				uSocial = social.filter( reports.rtOnlyUniqueValues );
				for ( i = 0; i < uSocial.length; i++ ) {
					uSocial[ i ] = {
						"value" : uSocial[ i ],
						"count" : reports.rtCountSessions( rtData, uSocial[ i ] )
					};
				}
				uSocial.sort( function ( a, b ) {
					return b.count - a.count
				} );
				
				uCustom = custom.filter( reports.rtOnlyUniqueValues );
				for ( i = 0; i < uCustom.length; i++ ) {
					uCustom[ i ] = {
						"value" : uCustom[ i ],
						"count" : reports.rtCountSessions( rtData, uCustom[ i ] )
					};
				}
				uCustom.sort( function ( a, b ) {
					return b.count - a.count
				} );
				
				rtInfoRight = '<div class="gadwp-bigtext"><a href="#" data-gadwp="' + reports.rtGenerateTooltip( uReferrals ) + '"><div class="gadwp-bleft">' + reports.i18n[ 0 ] + '</a></div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitType[ 0 ] ) + '</div></div>';
				rtInfoRight += '<div class="gadwp-bigtext"><a href="#" data-gadwp="' + reports.rtGenerateTooltip( uKeywords ) + '"><div class="gadwp-bleft">' + reports.i18n[ 1 ] + '</a></div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitType[ 1 ] ) + '</div></div>';
				rtInfoRight += '<div class="gadwp-bigtext"><a href="#" data-gadwp="' + reports.rtGenerateTooltip( uSocial ) + '"><div class="gadwp-bleft">' + reports.i18n[ 2 ] + '</a></div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitType[ 2 ] ) + '</div></div>';
				rtInfoRight += '<div class="gadwp-bigtext"><a href="#" data-gadwp="' + reports.rtGenerateTooltip( uCustom ) + '"><div class="gadwp-bleft">' + reports.i18n[ 3 ] + '</a></div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitType[ 3 ] ) + '</div></div>';
				
				rtInfoRight += '<div class="gadwp-bigtext"><div class="gadwp-bleft">' + reports.i18n[ 4 ] + '</div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitorType[ 0 ] ) + '</div></div>';
				rtInfoRight += '<div class="gadwp-bigtext"><div class="gadwp-bleft">' + reports.i18n[ 5 ] + '</div><div class="gadwp-bright">' + reports.rtCountSessions( rtData, uVisitorType[ 1 ] ) + '</div></div>';
				
				document.getElementById( "gadwp-tdo-right" ).innerHTML = rtInfoRight;
			},
			
			throwDebug : function ( response ) {
				jQuery( "#gadwp-status" + slug ).css( {
					"margin-top" : "3px",
					"padding-left" : "5px",
					"height" : "auto",
					"color" : "#000",
					"border-left" : "5px solid red"
				} );
				if ( response == '-24' ) {
					jQuery( "#gadwp-status" + slug ).html( gadwpItemData.i18n[ 15 ] );
				} else {
					jQuery( "#gadwp-reports" + slug ).css( {
						"background-color" : "#F7F7F7",
						"height" : "auto",
						"margin-top" : "10px",
						"padding-top" : "50px",
						"padding-bottom" : "50px",
						"color" : "#000",
						"text-align" : "center"
					} );
					jQuery( "#gadwp-reports" + slug ).html ( response );
					jQuery( "#gadwp-reports" + slug ).show();
					jQuery( "#gadwp-status" + slug ).html( gadwpItemData.i18n[ 11 ] );
					console.log( "\n********************* GADWP Log ********************* \n\n" + response );
					postData = {
						action : 'gadwp_set_error',
						response : response,
						gadwp_security_set_error : gadwpItemData.security,
					};
					jQuery.post( gadwpItemData.ajaxurl, postData );
				}
			},
			
			throwError : function ( target, response, p ) {
				jQuery( target ).css( {
					"background-color" : "#F7F7F7",
					"height" : "auto",
					"padding-top" : p,
					"padding-bottom" : p,
					"color" : "#000",
					"text-align" : "center"
				} );
				if ( response == -21 ) {
					jQuery( target ).html( gadwpItemData.i18n[ 12 ] + ' (' + response + ')' );
				} else {
					jQuery( target ).html( gadwpItemData.i18n[ 13 ] + ' (' + response + ')' );
				}
			},
			
			render : function ( view, period, query ) {
				var projectId, from, to, tpl, focusFlag;
				
				if ( period == 'realtime' ) {
					jQuery( '#gadwp-sel-report' + slug ).hide();
				} else {
					jQuery( '#gadwp-sel-report' + slug ).show();
					clearInterval( reports.rtRuns );
				}
				
				jQuery( '#gadwp-status' + slug ).html( '' );
				switch ( period ) {
					case 'today':
						from = 'today';
						to = 'today';
						break;
					case 'yesterday':
						from = 'yesterday';
						to = 'yesterday';
						break;
					case '7daysAgo':
						from = '7daysAgo';
						to = 'yesterday';
						break;
					case '14daysAgo':
						from = '14daysAgo';
						to = 'yesterday';
						break;
					case '90daysAgo':
						from = '90daysAgo';
						to = 'yesterday';
						break;
					case '365daysAgo':
						from = '365daysAgo';
						to = 'yesterday';
						break;
					case '1095daysAgo':
						from = '1095daysAgo';
						to = 'yesterday';
						break;
					default:
						from = '30daysAgo';
						to = 'yesterday';
						break;
				}
				
				tools.setCookie( 'default_metric', query );
				tools.setCookie( 'default_dimension', period );
				
				if ( typeof view !== 'undefined' ) {
					tools.setCookie( 'default_view', view );
					projectId = view;
				} else {
					projectId = false;
				}
				
				if ( gadwpItemData.scope == 'admin-item' ) {
					postData = {
						action : 'gadwp_backend_item_reports',
						gadwp_security_backend_item_reports : gadwpItemData.security,
						from : from,
						to : to,
						filter : itemId
					}
				} else if ( gadwpItemData.scope == 'front-item' ) {
					postData = {
						action : 'gadwp_frontend_item_reports',
						gadwp_security_frontend_item_reports : gadwpItemData.security,
						from : from,
						to : to,
						filter : gadwpItemData.filter
					}
				} else {
					postData = {
						action : 'gadwp_backend_item_reports',
						gadwp_security_backend_item_reports : gadwpItemData.security,
						projectId : projectId,
						from : from,
						to : to
					}
				}
				if ( period == 'realtime' ) {
					
					reports.i18n = gadwpItemData.i18n.slice( 20, 26 );
					
					reports.render.focusFlag = 1;
					
					jQuery( window ).bind( "focus", function ( event ) {
						reports.render.focusFlag = 1;
					} ).bind( "blur", function ( event ) {
						reports.render.focusFlag = 0;
					} );
					
					tpl = '<div id="gadwp-realtime' + slug + '">';
					tpl += '<div class="gadwp-rt-box">';
					tpl += '<div class="gadwp-tdo-left">';
					tpl += '<div class="gadwp-online" id="gadwp-online">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-tdo-right" id="gadwp-tdo-right">';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 0 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 1 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 2 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 3 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 4 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '<div class="gadwp-bigtext">';
					tpl += '<div class="gadwp-bleft">' + reports.i18n[ 5 ] + '</div>';
					tpl += '<div class="gadwp-bright">0</div>';
					tpl += '</div>';
					tpl += '</div>';
					tpl += '</div>';
					tpl += '<div>';
					tpl += '<div id="gadwp-pages" class="gadwp-pages">&nbsp;</div>';
					tpl += '</div>';
					tpl += '</div>';
					
					jQuery( '#gadwp-reports' + slug ).html( tpl );
					
					reports.rtRefresh( reports.render.focusFlag );
					
					reports.rtRuns = setInterval( reports.rtRefresh, 55000 );
					
				} else {
					if ( jQuery.inArray( query, [ 'referrers', 'contentpages', 'searches' ] ) > -1 ) {
						
						tpl = '<div id="gadwp-orgcharttablechart' + slug + '">';
						tpl += '<div id="gadwp-orgchart' + slug + '"></div>';
						tpl += '<div id="gadwp-tablechart' + slug + '"></div>';
						tpl += '</div>';
						
						jQuery( '#gadwp-reports' + slug ).html( tpl );
						jQuery( '#gadwp-reports' + slug ).hide();
						
						postData.query = 'channelGrouping,' + query;
						
						jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
							reports.orgChartTableChart( response );
						} );
					} else if ( query == '404errors' ) {
						tpl = '<div id="gadwp-404tablechart' + slug + '">';
						tpl += '<div id="gadwp-tablechart' + slug + '"></div>';
						tpl += '</div>';
						
						jQuery( '#gadwp-reports' + slug ).html( tpl );
						jQuery( '#gadwp-reports' + slug ).hide();
						
						postData.query = query;
						
						jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
							reports.tableChart( response );
						} );
					} else if ( query == 'trafficdetails' || query == 'technologydetails' ) {
						
						tpl = '<div id="gadwp-orgchartpiecharts' + slug + '">';
						tpl += '<div id="gadwp-orgchart' + slug + '"></div>';
						tpl += '<div class="gadwp-floatwraper">';
						tpl += '<div id="gadwp-piechart-1' + slug + '" class="halfsize floatleft"></div>';
						tpl += '<div id="gadwp-piechart-2' + slug + '" class="halfsize floatright"></div>';
						tpl += '</div>';
						tpl += '<div class="gadwp-floatwraper">';
						tpl += '<div id="gadwp-piechart-3' + slug + '" class="halfsize floatleft"></div>';
						tpl += '<div id="gadwp-piechart-4' + slug + '" class="halfsize floatright"></div>';
						tpl += '</div>';
						tpl += '</div>';
						
						jQuery( '#gadwp-reports' + slug ).html( tpl );
						jQuery( '#gadwp-reports' + slug ).hide();
						if ( query == 'trafficdetails' ) {
							postData.query = 'channelGrouping,medium,visitorType,source,socialNetwork';
							reports.i18n = gadwpItemData.i18n.slice( 0, 5 );
						} else {
							reports.i18n = gadwpItemData.i18n.slice( 15, 20 );
							postData.query = 'deviceCategory,browser,operatingSystem,screenResolution,mobileDeviceBranding';
						}
						
						jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
							reports.orgChartPieCharts( response )
						} );
						
					} else if ( query == 'locations' ) {
						
						tpl = '<div id="gadwp-geocharttablechart' + slug + '">';
						tpl += '<div id="gadwp-geochart' + slug + '"></div>';
						tpl += '<div id="gadwp-tablechart' + slug + '"></div>';
						tpl += '</div>';
						
						jQuery( '#gadwp-reports' + slug ).html( tpl );
						jQuery( '#gadwp-reports' + slug ).hide();
						
						postData.query = query;
						
						jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
							reports.geoChartTableChart( response );
						} );
						
					} else {
						
						tpl = '<div id="gadwp-areachartbottomstats' + slug + '">';
						tpl += '<div id="gadwp-areachart' + slug + '"></div>';
						tpl += '<div id="gadwp-bottomstats' + slug + '">';
						tpl += '<div class="inside">';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 5 ] + '</h3><p id="gdsessions' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 6 ] + '</h3><p id="gdusers' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 7 ] + '</h3><p id="gdpageviews' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 8 ] + '</h3><p id="gdbouncerate' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 9 ] + '</h3><p id="gdorganicsearch' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 10 ] + '</h3><p id="gdpagespervisit' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 26 ] + '</h3><p id="gdpagetime' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 27 ] + '</h3><p id="gdpageload' + slug + '">&nbsp;</p></div>';
						tpl += '<div class="small-box"><h3>' + gadwpItemData.i18n[ 28 ] + '</h3><p id="gdsessionduration' + slug + '">&nbsp;</p></div>';
						tpl += '</div>';
						tpl += '</div>';
						tpl += '</div>';
						
						jQuery( '#gadwp-reports' + slug ).html( tpl );
						jQuery( '#gadwp-reports' + slug ).hide();
						
						postData.query = query + ',bottomstats';
						
						jQuery.post( gadwpItemData.ajaxurl, postData, function ( response ) {
							reports.areaChartBottomStats( response );
						} );
						
					}
					
				}
				
			},
			
			refresh : function () {
				if ( jQuery( '#gadwp-areachartbottomstats' + slug ).length > 0 && jQuery.isArray( reports.areaChartBottomStatsData ) ) {
					reports.areaChartBottomStats( reports.areaChartBottomStatsData );
				}
				if ( jQuery( '#gadwp-orgchartpiecharts' + slug ).length > 0 && jQuery.isArray( reports.orgChartPieChartsData ) ) {
					reports.orgChartPieCharts( reports.orgChartPieChartsData );
				}
				if ( jQuery( '#gadwp-geocharttablechart' + slug ).length > 0 && jQuery.isArray( reports.geoChartTableChartData ) ) {
					reports.geoChartTableChart( reports.geoChartTableChartData );
				}
				if ( jQuery( '#gadwp-orgcharttablechart' + slug ).length > 0 && jQuery.isArray( reports.orgChartTableChartData ) ) {
					reports.orgChartTableChart( reports.orgChartTableChartData );
				}
				if ( jQuery( '#gadwp-404tablechart' + slug ).length > 0 && jQuery.isArray( reports.tableChartData ) ) {
					reports.tableChart( reports.tableChartData );
				}
			},
			
			init : function () {
				
				if ( !jQuery( "#gadwp-reports" + slug ).length ) {
					return;
				}
				
				if ( jQuery( "#gadwp-reports" + slug ).html().length ) { // only when report is empty
					return;
				}
				
				try {
					NProgress.configure( {
						parent : "#gadwp-progressbar" + slug,
						showSpinner : false
					} );
					NProgress.start();
				} catch ( e ) {
					reports.alertMessage( gadwpItemData.i18n[ 0 ] );
				}
				
				reports.render( jQuery( '#gadwp-sel-view' + slug ).val(), jQuery( '#gadwp-sel-period' + slug ).val(), jQuery( '#gadwp-sel-report' + slug ).val() );
				
				jQuery( window ).resize( function () {
					var diff = jQuery(window).width() - reports.oldViewPort;
					if ( ( diff < -5 ) || ( diff > 5 ) ) {
						reports.oldViewPort = jQuery(window).width();
						reports.refresh(); //refresh only on over 5px viewport width changes
					}
				} );
			}
		};
		
		template.init();
		
		reports.init();
		
		jQuery( '#gadwp-sel-view' + slug ).change( function () {
			jQuery( '#gadwp-reports' + slug ).html( '' );
			reports.init();
		} );
		
		jQuery( '#gadwp-sel-period' + slug ).change( function () {
			jQuery( '#gadwp-reports' + slug ).html( '' );
			reports.init();
		} );
		
		jQuery( '#gadwp-sel-report' + slug ).change( function () {
			jQuery( '#gadwp-reports' + slug ).html( '' );
			reports.init();
		} );
		
		if ( gadwpItemData.scope == 'admin-widgets' ) {
			
		} else {
			return this.dialog( {
				width : 'auto',
				maxWidth : 510,
				height : 'auto',
				modal : true,
				fluid : true,
				dialogClass : 'gadwp wp-dialog',
				resizable : false,
				title : reports.getTitle( gadwpItemData.scope ),
				position : {
					my : "top",
					at : "top+100",
					of : window
				}
			} );
		}
	}
} );

function GADWPReportLoad () {
	if ( gadwpItemData.scope == 'admin-widgets' ) {
		jQuery( '#gadwp-window-1' ).gadwpItemReport( 1 );
	} else {
		jQuery( gadwpItemData.getSelector( gadwpItemData.scope ) ).click( function () {
			if ( !jQuery( "#gadwp-window-" + gadwpItemData.getID( this ) ).length > 0 ) {
				jQuery( "body" ).append( '<div id="gadwp-window-' + gadwpItemData.getID( this ) + '"></div>' );
			}
			jQuery( '#gadwp-window-' + gadwpItemData.getID( this ) ).gadwpItemReport( gadwpItemData.getID( this ) );
		} );
	}
	
	// on window resize
	jQuery( window ).resize( function () {
		gadwpItemData.responsiveDialog();
	} );
	
	// dialog width larger than viewport
	jQuery( document ).on( "dialogopen", ".ui-dialog", function ( event, ui ) {
		gadwpItemData.responsiveDialog();
	} );
}
