var $$ = require('domtastic');
var Hooks = require('./hooks');
var reqwest = require('reqwest');
var template = require('../module/template');
var RestClient = require('./rest-client');
var api = new RestClient('http://dev.upages.com.ua/wp-json/wp/v2');
api.res('posts');
api.res('listing_category');
api.res('listing_city');

api.res('users');

var AutoComplete = require('./autoComplete');

function AjaxForm(options) {
	var _this = this;
	
	_this.elem = $$(options.elem);
	if (_this.elem.length) {
		_this.elemID = _this.elem.attr('id');
		_this.all_text_input = _this.elem.find('[type="text"]');
		_this.ajax_complete = options.ajax_complete;
		_this.current_page = 1;
		_this.post_type = _this.getOption('post_type');
		_this.url_hash = _this.getOption('url_hash');
		_this.results_container = $$(_this.getOption('results_container'));
		
		_this.button_load = $$(_this.getOption('button_load'));
		_this.storage = null;
		_this.storege_key = "wpas_instance_" + _this.elemID;
		_this.show_default = _this.getOption('show_default');
		
		_this.init();
	}
	
}

AjaxForm.prototype.showEl = function (el) {
	el.addClass('active show')
	  .removeClass('hide');
};

AjaxForm.prototype.hideEl = function (el) {
	el.removeClass('active show')
	  .addClass('hide');
};

AjaxForm.prototype.lockForm = function () {
	
	this.elem.addClass('wpas-locked')
	    .find('[type="submit"]')
	    .attr('disabled', 'disabled');
};

AjaxForm.prototype.formLocked = function () {
	return this.elem.hasClass('wpas-locked');
};

AjaxForm.prototype.unlockForm = function () {
	this.elem.removeClass('wpas-locked')
	    .find('[type="submit"]')
	    .removeAttr('disabled');
};

AjaxForm.prototype.getOption = function (option) {
	
	var elOption = JSON.parse(this.elem.attr('data-ajax-form-option'));
	
	if (elOption[option] !== null) {
		return elOption[option];
	}
	else {
		return {};
	}
};

AjaxForm.prototype.getSerialize = function () {
	return reqwest.serialize(this.elem[0], {type: 'map'});
};

AjaxForm.prototype.setPage = function (pagenum) {
	var _this = this;
	_this.current_page = pagenum;
	var elemPageField = _this.elem.find('#wpas-paged');
	elemPageField[0].value = pagenum
};

AjaxForm.prototype.submitForm = function () {
	var _this = this;
	
	_this.setPage(1);
	_this.setRequest(_this.getSerialize());
	_this.results_container.empty();
	_this.sendRequest(this.request_data, _this.current_page);
};

AjaxForm.prototype.setRequest = function () {
	this.request_data = this.getSerialize();
};

AjaxForm.prototype.storeInstance = function (requestResults) {
	var _this = this;
	var instance = {
		request: _this.request_data,
		results: {
			html: _this.results_container.html(),
			ajax: requestResults
		},
		page:    _this.current_page
	};
	instance = JSON.stringify(instance);
	localStorage.setItem(_this.storege_key, instance);
	
};

AjaxForm.prototype.preloaderInit = function () {
	var _this = this;
	
	_this.loadingImage = $$("<img id='wpas-loading-img' src='" + _this.getOption('loadingImageURL') + "'>");
	
	_this.results_preloader.append(_this.loadingImage.addClass('hide'));
};

AjaxForm.prototype.appendResContainer = function (res) {
	return this.results_container.append(res);
};

AjaxForm.prototype.respData = function (resp) {
	var _this = this;
	_this.resp_data = JSON.parse(resp.data);
	return _this.resp_data
};

AjaxForm.prototype.sendRequest = function (data, page) {
	
	var _this = this;

//	_this.hideEl(_this.button_load);
//	_this.showEl(_this.loadingImage);
	
	api.posts.get(data).then(function (res) {
		var listingItemTemplate = template('listings-map-result-item', {'item': res});
		_this.appendResContainer(listingItemTemplate);
		_this.storeInstance(res);
		
		if (_this.ajax_complete) {
//			var _resp = _this.respData(resp);
			_this.ajax_complete.apply(res, [res]);
			
		}
		
	}).catch(function (e) {
		console.log(e);
	});

//	reqwest({
//		url:         'http://dev.upages.com.ua/wp-json/wp/v2/posts',
//		method:      'get',
//		crossOrigin: true,
//		type:        'json',
//		success:     function (resp) {

//			 _this.hideEl(_this.loadingImage);
//			 _this.current_page = res.current_page;
//			 var max_page = res.max_page;
//
//			 if (max_page < 1 || this.current_page == max_page) {
//			   _this.hideEl(_this.button_load);
//			 } else {
//			   _this.showEl(_this.button_load);
//			 }
//			 _this.storeInstance(res);
//			 _this.unlockForm();
//		},
//		complete:    function (resp) {
//			// if (_this.ajax_complete) {
//			//   var _resp = _this.respData(resp);
//			//   _this.ajax_complete.apply(_resp, [_resp]);
//			//
//			// }
//		},
//		error:       function (err) {
//			console.log(err);
//		}
//	});
};

AjaxForm.prototype.autoComplete = function () {
	var _this = this;
	
	_this.all_text_input.forEach(function (e) {
		var complete = new AutoComplete({
			selector: e,
			minChars: 1,
			source:   function (term, suggest) {
				term = term.toLowerCase();
				var choices;
				var autocomplete_params = $$(e).attr('data-autocomplete');
				if (autocomplete_params) {
					autocomplete_params = JSON.parse(autocomplete_params);
					var type = autocomplete_params.type;
					
					switch (type) {
						case 'post':
							
							api.posts.get({
								'filter[post_type]': autocomplete_params.post_type
							}).then(function (res) {
								process(res, type);
							}).catch(function (e) {
								console.log(e);
							});
						case 'taxonomy':
							var taxonomy = autocomplete_params.taxonomy;
							
							switch (taxonomy) {
								case 'listing-city':
									
									api.listing_city.get({
										'filter[name__like]': term
									}).then(function (res) {
										process(res, type);
									}).catch(function (e) {
										console.log(e);
									});
								case 'listing-category':
									
									api.listing_category.get({
										'filter[name__like]': term
									}).then(function (res) {
										process(res, type);
									}).catch(function (e) {
										console.log(e);
									});
							}
						
						default:
							return;
						
					}
					
					function process(res, type) {
						choices = res;
						var suggestions = [];
						if (choices.length !== 0) {
							choices.forEach(function (e) {
								var resTitle;
								
								switch (type) {
									case 'taxonomy':
										resTitle = e.name;
										break;
									case 'post':
										resTitle = e.title.rendered;
										break;
									default:
										resTitle = '';
									
								}
								
								if (resTitle === '') {
									return;
								}
								if (~resTitle.toLowerCase().indexOf(term)) {
									suggestions.push(resTitle);
								}
							});
						}
						suggest(suggestions);
					}
				}
				else {
					return;
				}
				
			},
			onSelect: function (e, term, item) {
				e.preventDefault();
				if (_this.formLocked()) {
					return;
				}
//				_this.lockForm();
				_this.submitForm();
			}
		});
	});
};

AjaxForm.prototype.init = function () {
	
	var _this = this;
	// _this.preloaderInit();
	
	_this.storage = JSON.parse(localStorage.getItem(_this.storege_key));
	
	_this.autoComplete();
	_this.setPage(1);
	_this.setRequest(_this.getSerialize());
	
	if (_this.results_container.length) {
		if (_this.storage !== null) {
			
			_this.all_text_input.forEach(function (e) {
				var _e = $$(e);
				var _name = _e.attr('name');
				
				if (_name !== null && _this.storage.request[_name]) {
					var _val = _this.storage.request[_name];
					_e.val(_val);
				}
				
			});

//			_this.results_container.html(_this.storage.results.html);
			_this.appendResContainer(_this.storage.results.html);

			if (_this.ajax_complete) {
				var _resp = _this.storage.results.ajax;
				_this.ajax_complete.apply(_resp, [_resp]);
			}
		}
		else {
			_this.sendRequest(_this.request_data, _this.current_page);
		}
	}
	
	_this.elem.on('submit', function (e) {
		e.preventDefault();
		if (_this.formLocked()) {
			return;
		}
		_this.lockForm();
		_this.submitForm();
	});
	
	this.button_load.on('click', function () {
		_this.setPage(parseInt(_this.current_page) + 1);
		_this.sendRequest(_this.request_data, _this.current_page);
	})
};

module.exports = AjaxForm;