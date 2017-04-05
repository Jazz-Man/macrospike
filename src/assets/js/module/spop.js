var $$ = require('domtastic');

var animationTime = 390;
var options, defaults, container, icon, layout, popStyle, positions, close;

function getStyle(sufix, arg) {

  popStyle = {
    'success': 'success',
    'error': 'error',
    'warning': 'warning'
  };
  return sufix + (
    popStyle[arg] || 'info');
};

function getPosition(sufix, position) {

  positions = {
    'top-left': 'top-left',
    'top-center': 'top-center',
    'top-right': 'top-right',
    'bottom-left': 'bottom-left',
    'bottom-center': 'bottom-center',
    'bottom-right': 'bottom-right'
  };
  return sufix + (
    positions[position] || 'top-right');
};

var SmallPop = function (template, style) {

  this.defaults = {
    template: null,
    style: 'info',
    autoclose: false,
    position: 'top-right',
    icon: true,
    group: false,
    onOpen: false,
    onClose: false
  };

  defaults = $$.extend(this.defaults, {});

  if (typeof template === 'string' || typeof style === 'string') {
    options = {
      template: template,
      style: style || defaults.style
    };
  } else if (typeof template === 'object') {
    options = template;
  } else {
    console.error('Invalid arguments.');
    return false;
  }

  this.opt = $$.extend(defaults, options);

  var group = $$('#spop--' + this.opt.group);

  if (group.length) {

    this.remove(group);
  }

  this.open();
};

SmallPop.prototype.create = function (template) {
  var position = '#' + getPosition('spop--', this.opt.position);
  container = $$(position);

  icon = (!this.opt.icon) ? '' : '<i class="spop-icon ' +
    getStyle('spop-icon--', this.opt.style) + '"></i>';


  layout = [
    '<div class="spop-close" data-spop="close" aria-label="Close">&times;</div>',
    icon,
    '<div class="spop-body">',
    template,
    '</div>'
  ].join('');


  if (container.length == 0) {

    this.popContainer = $$(document.createElement('div'));

    var popContainerClass = [
      'spop-container',
      getPosition('spop--', this.opt.position)
    ].join(' ');
    var popContainerId = getPosition('spop--', this.opt.position);


    this.popContainer.attr({
      'class': popContainerClass,
      'id': popContainerId
    });

    $$(document.body)
      .append(this.popContainer);

    container = $$(position);
  }

  var popClass = [
    'spop',
    'pop--out',
    'spop--in',
    getStyle('spop--', this.opt.style)
  ].join(' ');

  this.pop = $$(document.createElement('div'));

  this.pop.attr({
    'class': popClass,
    'role': 'alert'
  });

  if (this.opt.group && typeof this.opt.group === 'string') {
    this.pop.attr('id', 'spop--' + this.opt.group);
  }

  this.pop.html(layout);

  container.append(this.pop);
};

SmallPop.prototype.open = function () {

  this.create(this.opt.template);

  if (this.opt.onOpen) {
    this.opt.onOpen();
  }

  this.close();
};

SmallPop.prototype.close = function () {

  if (this.opt.autoclose && typeof this.opt.autoclose === 'number') {

    this.autocloseTimer = setTimeout(this.remove.bind(null, this.pop), this.opt.autoclose);
  }

  this.pop.on('click', this.addListeners.bind(this), false);
};

SmallPop.prototype.addListeners = function (event) {
  close = event.target.getAttribute('data-spop');

  if (close === 'close') {

    if (this.autocloseTimer) {
      clearTimeout(this.autocloseTimer);
    }

    if (this.opt.onClose) {
      this.opt.onClose();
    }

    this.remove(this.pop);
  }
};

SmallPop.prototype.remove = function (elm) {

  elm.removeClass('spop--in');

  setTimeout(function () {
    elm.remove()

  }, animationTime);
};

var spop = function (template, style) {
  if (!template || !window.addEventListener) {
    return false;
  }

  return new SmallPop(template, style);
};

module.exports = spop;