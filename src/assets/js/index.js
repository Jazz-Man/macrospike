var $$ = require('domtastic');
require('./module/viewport');
// var acf = require('./lib/acf-input');
var Hooks = require('./module/hooks');
// var spop = require('./module/spop');
var doc = $$(document);

require('./module/ajaxloader')();

doc.on('complete', init);

doc.ready(init);

function init(e) {
	
	require('./module/auch');
	
	require('./module/side-nav');
	
	require('./components/responsive');
	
	require('./components/wpas');
	require('./components/profile');
	require('./module/fitvids');
//   // require('./components/rating');
//   // require('./components/add-listing-form');
	
	Hooks.doAction('_init');
}