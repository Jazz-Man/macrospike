/*
* native JQUERY animation
*
* */

var $$ = require('domtastic');

function fadeIn(el) {
  var el = $$(el);
  var opacity = 0;
  
  el.css({
    opacity:0,
    filter:''
  });
  
  var last = +new Date();
  var tick = function() {
    opacity += (new Date() - last) / 400;
    el.css({
      opacity:opacity,
      filter:'alpha(opacity=' + (100 * opacity)|0 + ')'
    });
    
    last = +new Date();
    
    if (opacity < 1) {
      (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
    }
  };
  
  tick();
}

module.exports = {
  fadeIn: fadeIn
};