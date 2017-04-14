var $$ = require('domtastic');
var Hooks = require("./hooks");
var viewport = require('./viewport');

function responsive_init() {
	
	var fullWrapper = $$(".full-height");
	
	if (fullWrapper.length) {
		
		fullWrapper.forEach(function (e) {
			setHeight(e);
		});
	}
}

function getfullWrapperHeight() {
	var pageHeaderHeight = $$("#page-header").prop('clientHeight') || 56;
	var pageFooterHeight = $$("#page-footer").prop('clientHeight') || 50;
	
	return window.innerHeight - (pageHeaderHeight + pageFooterHeight)
}

function setHeight(el) {
	
	var _this = $$(el);
	
	var h = getfullWrapperHeight();
	
	var heightPercent = _this.attr('data-height-percent');
	
	if (heightPercent) {
		h = (getfullWrapperHeight() * heightPercent) / 100;
	}
	_this.css({
		'height': h + 'px'
	});
}

Hooks.addAction("_init", responsive_init);
Hooks.addAction("pageLoader.processEnd", responsive_init);