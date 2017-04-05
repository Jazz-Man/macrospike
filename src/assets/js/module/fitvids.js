var $$ = require('domtastic');

var Hooks = require("./hooks");

var selectors = [
  'iframe[src*="player.vimeo.com"]',
  'iframe[src*="youtube.com"]',
  'iframe[src*="youtube-nocookie.com"]',
  'iframe[src*="kickstarter.com"][src*="video.html"]',
  'object'
];

function fitvids(parentSelector, opts) {
  parentSelector = parentSelector || 'body';
  opts = opts || {};
  if (isObject(parentSelector)) {
    opts = parentSelector;
    parentSelector = 'body'
  }
  
  opts.ignore = opts.ignore || '';
  opts.players = opts.players || '';
  
  var containers = $$(parentSelector);
  if (!containers.length) {
    return;
  }
  var custom = toSelectorArray(opts.players) || [];
  var ignored = toSelectorArray(opts.ignore) || [];
  var selector = selectors.filter(notIgnored(ignored)).concat(custom).join();
  
  if (!hasLength(selector)) {
    return;
  }
  
  containers.forEach(function (container) {
    var videos = $$(container).find(selector);
    videos.forEach(function (video) {
      wrap(video)
    })
  })
}

function toSelectorArray(input) {
  if (typeof input === 'string') {
    return input.split(',').map(trim).filter(hasLength)
  }
  else if ($$.isArray(input)) {
    return flatten(input.map(toSelectorArray).filter(hasLength))
  }
  return input || []
}

function wrap(el) {
  var _this = $$(el);
  var parent = _this.parent();
  if (parent.hasClass('fluid-width-video-wrapper')) {
    return;
  }

  var widthAttr = parseInt(_this.attr('width'), 10);
  var heightAttr = parseInt(_this.attr('height'), 10);
  
  var width = !isNaN(widthAttr) ? widthAttr : _this[0].clientWidth;
  var height = !isNaN(heightAttr) ? heightAttr : _this[0].clientHeight;
  var aspect = height / width;
  
  _this.removeAttr('width');
  _this.removeAttr('height');
  
  var wrapper = $$(document.createElement('div'));
  wrapper.addClass('fluid-width-video-wrapper').css({
    'padding-top':(aspect * 100) + '%'
  }).append(_this);
  
  parent.prepend(wrapper);
}


function notIgnored(ignored) {
  if (ignored.length < 1) {
    return function () {
      return true
    }
  }
  return function (selector) {
    return ignored.indexOf(selector) === -1
  }
}

function hasLength(input) {
  return input.length > 0
}

function trim(str) {
  return str.replace(/^\s+|\s+$/g, '')
}

function flatten(input) {
  return [].concat.apply([], input)
}

function isObject(input) {
  return Object.prototype.toString.call(input) === '[object Object]'
}

Hooks.addAction("_init", fitvids);
Hooks.addAction("pageLoader.processEnd", fitvids);
