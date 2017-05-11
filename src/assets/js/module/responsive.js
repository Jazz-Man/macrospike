var $$ = require('domtastic');
var Hooks = require("./hooks");
var viewport = require('./viewport');
var util = require('./util');
var win = $$(window);

function responsive_init() {
	
	var fullWrapper = $$(".full-height");
		pageContentSpase();
	
	if (fullWrapper.length) {
		
		fullWrapper.forEach(function (e) {
			setHeight(e);
		});
	}
}

function heightHF() {
	return {
		header: util.getMaxHeight($$("#page-header")),
		footer:util.getMaxHeight($$("#page-footer"))
	}
}

function pageContentSpase() {
	var pageContent = $$('#page-content');
	
	if(pageContent.length){
		var  hf = heightHF();
		pageContent.css({
			'margin-top':hf.header+ 'px'
		});
	}
	
}

function getfullWrapperHeight() {
	var  hf = heightHF();
	
	return win.prop('innerHeight') - (hf.header + hf.footer)
}

function setHeight(el) {
	
	var _this = $$(el);
	
	var h = getfullWrapperHeight();
	
	var heightPercent = _this.attr('data-height-percent');
	console.log(heightPercent);
	
	if (heightPercent) {
		h = (getfullWrapperHeight() * heightPercent) / 100;
	}
	_this.css({
		'height': h + 'px'
	});
}

Hooks.addAction("_init", responsive_init);
Hooks.addAction("pageLoader.processEnd", responsive_init);

win.on('resize', responsive_init);