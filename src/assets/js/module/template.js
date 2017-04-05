var $$ = require('domtastic');

module.exports = function (id, data) {
	
	var tpl = $$('#tmpl-' + id).html();
	var options = {
		variable: 'data',
		imports:  {'$$': $$}
	};
	
	var template = require('lodash/template');
	var compiled = template(tpl, options);
	
	return compiled(data);
	
};