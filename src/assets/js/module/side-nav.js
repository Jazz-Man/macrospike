var $$ = require("domtastic");
var util = require("./util");
var Hooks = require("./hooks");

var offCanvasToggle = $$("[data-toggle=off-canvas]");

//if (offCanvasToggle.length) {
//	offCanvasToggle.css('margin-left', '300px');
//	var collapse = $$(offCanvasToggle.attr("href")) || $$(offCanvasToggle.attr("data-target"));
//	offCanvasToggle.on("click", function (e) {
//		e.preventDefault();
//		if (!collapse.hasClass("show")) {
//			util.show(collapse);
//		}
//		else {
//			util.hide(collapse);
//		}
//	});
//
//}

var decouple = require("decouple");
var scrollTimeout;
var scrolling = false;
var doc = window.document;
var html = doc.documentElement;
var msPointerSupported = window.navigator.msPointerEnabled;
var touch = {
	"start": msPointerSupported ? "MSPointerDown" : "touchstart",
	"move":  msPointerSupported ? "MSPointerMove" : "touchmove",
	"end":   msPointerSupported ? "MSPointerUp" : "touchend"
};
var prefix = function prefix() {
	var regex = /^(Webkit|Khtml|Moz|ms|O)(?=[A-Z])/;
	var styleDeclaration = doc.getElementsByTagName("script")[0].style;
	var prop;
	for (prop in styleDeclaration) {
		if (regex.test(prop)) {
			return "-" + prop.match(regex)[0].toLowerCase() + "-";
		}
	}
	if ("WebkitOpacity" in styleDeclaration) {
		return "-webkit-";
	}
	if ("KhtmlOpacity" in styleDeclaration) {
		return "-khtml-";
	}
	return "";
}();

function hasIgnoredElements(el) {
	for (; el.parentNode;) {
		if (el.getAttribute("data-slideout-ignore") !== null) {
			return el;
		}
		el = el.parentNode;
	}
	return null;
}
function Slideout(options) {
	options = options || {};
	var self = this;
	self._startOffsetX = 0;
	self._currentOffsetX = 0;
	self._opening = false;
	self._moved = false;
	self._opened = false;
	self._preventOpen = false;
	self._touch = options.touch === undefined ? true : options.touch && true;
	self._side = options.side || "left";
	self.panel = $$(options.panel);
	self.menu = $$(options.menu);
	
	if (!self.panel.hasClass("slideout-panel")) {
		self.panel.addClass("slideout-panel");
	}
	
	if (!self.panel.hasClass("slideout-panel-" + self._side)) {
		self.panel.addClass("slideout-panel-" + self._side);
	}
	
	if (!self.menu.hasClass("slideout-menu")) {
		self.menu.addClass("slideout-menu");
	}
	
	if (!self.menu.hasClass("slideout-menu-" + self._side)) {
		self.menu.addClass("slideout-menu-" + self._side);
	}
	
	self._fx = options.fx || "ease";
	self._duration = parseInt(options.duration, 10) || 300;
	self._tolerance = parseInt(options.tolerance, 10) || 70;
	self._padding = self._translateTo = parseInt(options.padding, 10) || 256;
	self._orientation = self._side === "right" ? -1 : 1;
	self._translateTo *= self._orientation;
	if (self._touch) {
		self._initTouchEvents();
	}
}
Slideout.prototype.open = function () {
	var self = this;
	Hooks.doAction("beforeopen");
	if (!html.classList.contains("slideout-open")) {
		html.classList.add("slideout-open");
	}
	self._setTransition();
	self._translateXTo(self._translateTo);
	self._opened = true;
	
	setTimeout(function () {
		
		self.panel.css({
			'transition':         '',
			'-webkit-transition': ''
		});
		self.menu.css({
			'transition':         '',
			'-webkit-transition': ''
		});
		Hooks.doAction("open");
	}, self._duration + 50);
	return self;
};
Slideout.prototype.close = function () {
	var self = this;
	if (!self.isOpen() && !self._opening) {
		return self;
	}
	Hooks.doAction("beforeclose");
	self._setTransition();
	self._translateXTo(0);
	self._opened = false;
	setTimeout(function () {
		html.classList.remove("slideout-open");
		
		var css = {
			'transition':         '',
			'-webkit-transition': '',
			'transform':          ''
		};
		
		css[prefix + "transform"] = css['transition'];
		
		self.panel.css(css);
		
		Hooks.doAction("close");
	}, self._duration + 50);
	return self;
};
Slideout.prototype.toggle = function () {
	var self = this;
	return self.isOpen() ? self.close() : self.open();
};
Slideout.prototype.isOpen = function () {
	return this._opened;
};
Slideout.prototype._translateXTo = function (translateX) {
	var self = this;
	self._currentOffsetX = translateX;
	
	var css = {
		'transform': "translateX(" + translateX + "px)"
	};
	css[prefix + "transform"] = css['transform'];
	
	self.panel.css(css);
//	self.panel.css(css);
	
	return self;
};
Slideout.prototype._setTransition = function () {
	var self = this;
	var css = {
		'transition': prefix + "transform " + self._duration + "ms " + self._fx
	};
	
	css[prefix + "transition"] = css['transition'];
	
	self.panel.css(css);
	
	return self;
};
Slideout.prototype._initTouchEvents = function () {
	var self = this;
	self._onScrollFn = decouple(doc, "scroll", function () {
		if (!self._moved) {
			clearTimeout(scrollTimeout);
			scrolling = true;
			scrollTimeout = setTimeout(function () {
				scrolling = false;
			}, 250);
		}
	});
	self._preventMove = function (eve) {
		if (self._moved) {
			eve.preventDefault();
		}
	};
	doc.addEventListener(touch.move, self._preventMove);
	self._resetTouchFn = function (eve) {
		if (typeof eve.touches === "undefined") {
			return;
		}
		self._moved = false;
		self._opening = false;
		self._startOffsetX = eve.touches[0].pageX;
		self._preventOpen = !self._touch || !self.isOpen() && self.menu[0].clientWidth !== 0;
	};
	self.panel.on(touch.start, self._resetTouchFn);
	self._onTouchCancelFn = function () {
		self._moved = false;
		self._opening = false;
	};
	self.panel.on("touchcancel", this._onTouchCancelFn);
	self._onTouchEndFn = function () {
		if (self._moved) {
			Hooks.doAction("translateend");
			if (self._opening && Math.abs(self._currentOffsetX) > self._tolerance) {
				self.open();
			}
			else {
				self.close();
			}
		}
		self._moved = false;
	};
	self.panel.on(touch.end, self._onTouchEndFn);
	self._onTouchMoveFn = function (eve) {
		if (scrolling || (self._preventOpen || (typeof eve.touches === "undefined" || hasIgnoredElements(eve.target)))) {
			return;
		}
		var dif_x = eve.touches[0].clientX - self._startOffsetX;
		var translateX = self._currentOffsetX = dif_x;
		if (Math.abs(translateX) > self._padding) {
			return;
		}
		if (Math.abs(dif_x) > 20) {
			self._opening = true;
			var oriented_dif_x = dif_x * self._orientation;
			if (self._opened && oriented_dif_x > 0 || !self._opened && oriented_dif_x < 0) {
				return;
			}
			if (!self._moved) {
				Hooks.doAction("translatestart");
			}
			if (oriented_dif_x <= 0) {
				translateX = dif_x + self._padding * self._orientation;
				self._opening = false;
			}
			if (!(self._moved && html.classList.contains("slideout-open"))) {
				html.classList.add("slideout-open");
			}
//			self.panel.style[prefix + "transform"] = self.panel.style.transform = "translateX(" + translateX + "px)";
			var css = {
				'transform': "translateX(" + translateX + "px)"
			};
			
			css[prefix + "transform"] = css['transform'];
			
			self.panel.css(css);
			Hooks.doAction("translate", translateX);
			self._moved = true;
		}
	};
	self.panel.on(touch.move, self._onTouchMoveFn);
	return self;
};
Slideout.prototype.enableTouch = function () {
	this._touch = true;
	return this;
};
Slideout.prototype.disableTouch = function () {
	this._touch = false;
	return this;
};
Slideout.prototype.destroy = function () {
	var self = this;
	self.close();
	doc.removeEventListener(touch.move, self._preventMove);
	self.panel.off(touch.start, self._resetTouchFn);
	self.panel.off("touchcancel", self._onTouchCancelFn);
	self.panel.off(touch.end, self._onTouchEndFn);
	self.panel.off(touch.move, self._onTouchMoveFn);
	doc.removeEventListener("scroll", self._onScrollFn);
	self.open = self.close = function () {};
	return self;
};
var slideout = new Slideout({
	'panel':     "#page-navbar",
	'menu':      "#slide-out",
	'padding':   256,
	'tolerance': 70
});
offCanvasToggle.on("click", function () {
	slideout.toggle();
});

