var $$ = require('domtastic');
var Hooks = require("../module/hooks");
var util = require("../module/util");

function responsive_init() {
    var pageHeader = $$("#page-header");
    var pageHeaderHeight = util.getMaxHeight(pageHeader);
    var pageFooter = $$("#page-footer");
    var pageFooterHeight = util.getMaxHeight(pageFooter);
    var fullWrapper = $$(".full-height");
    var body = $$(document.body);


    if (fullWrapper.length) {
        var fullWrapperHeight = (window.innerHeight - pageHeaderHeight - pageFooterHeight);

        fullWrapper.forEach(function (e) {
            var _this = $$(e);
            var heightPercent = _this.attr('data-height-percent');
            if (heightPercent) {
                fullWrapperHeight = fullWrapperHeight * heightPercent / 100;
            }
            // console.log(fullWrapperHeight * heightPercent / 100);
            _this.css({
                'height': fullWrapperHeight + 'px'
            });
        });
    }
}


Hooks.addAction("_init", responsive_init);
Hooks.addAction("pageLoader.processEnd", responsive_init);