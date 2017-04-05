var $$ = require('domtastic');
var Hooks = require("../module/hooks");
var util = require("../module/util");

function responsive_init() {
  var pageHeader = $$("#page-header");
	var pageHeaderHeight = util.getMaxHeight(pageHeader);
  var pageFooter = $$("#page-footer");
  var pageFooterHeight =  util.getMaxHeight(pageFooter);
  var fullWrapper = $$(".full-height");
  var body = $$(document.body);
  
//  if(pageHeader.hasClass('fixed-top')){
//	  body.css({
//	  	'padding-top':pageHeaderHeight+'px',
//		  'padding-bottom':pageFooterHeight+'px'
//	  });
//  }
  
  
  if (fullWrapper.length){
    fullWrapper.css({
      'height': (window.innerHeight - pageHeaderHeight - pageFooterHeight)+'px'
    });
  }
}


Hooks.addAction("_init", responsive_init);
Hooks.addAction("pageLoader.processEnd", responsive_init);