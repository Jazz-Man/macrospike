// Velocity has conflicts when loaded with jQuery, this will check for it
var Vel;
if ($) {
  Vel = $.Velocity;
} else if (jQuery) {
  Vel = jQuery.Velocity;
} else {
  Vel = Velocity;
}

(function (core) {
  if (typeof define == 'function' && define.amd) { // AMD

    define('mdb', function () {

      var mdb = window.MDB || core(window, window.jQuery, window.document);
  
      mdb.load = function (res, req, onload, config) {

        var resources = res.split(','),
          load = [],
          i, base = (config.config && config.config.mdb && config.config.mdb.base ? config.config.mdb.base : '')
          .replace(/\/+$/g, '');

        if (!base) {
          throw new Error('Please define base path to MDB in the requirejs config.');
        }

        for (i = 0; i < resources.length; i += 1) {
          var resource = resources[i].replace(/\./g, '/');
          load.push(base + '/components/' + resource);
        }

        req(load, function () {
          onload(mdb);
        });
      };

      return mdb;
    });
  }

  if (!window.jQuery) {
    throw new Error('MDB requires jQuery');
  }

  if (window && window.jQuery) {
    core(window, window.jQuery, window.document);
  }


})(function (global, $, doc) {

  "use strict";

  var MDB = {},
    _MDB = global.MDB ? Object.create(global.MDB) : undefined;
  
  MDB.noConflict = function () {
    // restore MDB version
    if (_MDB) {
      global.MDB = _MDB;
      $.MDB = _MDB;
      $.fn.mdb = _MDB.fn;
    }

    return MDB;
  };

  MDB.prefix = function (str) {
    return str;
  };

  // cache jQuery
  MDB.$ = $;

  MDB.$doc = MDB.$(document);
  MDB.$win = MDB.$(window);
  MDB.$html = MDB.$('html');

  MDB.support = {};
  MDB.support.transition = (function () {

    var transitionEnd = (function () {

      var element = doc.body || doc.documentElement,
        transEndEventNames = {
          WebkitTransition: 'webkitTransitionEnd',
          MozTransition: 'transitionend',
          OTransition: 'oTransitionEnd otransitionend',
          transition: 'transitionend'
        },
        name;

      for (name in transEndEventNames) {
        if (element.style[name] !== undefined) return transEndEventNames[name];
      }
    }());

    return transitionEnd && {
      end: transitionEnd
    };
  })();

  MDB.support.animation = (function () {

    var animationEnd = (function () {

      var element = doc.body || doc.documentElement,
        animEndEventNames = {
          WebkitAnimation: 'webkitAnimationEnd',
          MozAnimation: 'animationend',
          OAnimation: 'oAnimationEnd oanimationend',
          animation: 'animationend'
        },
        name;

      for (name in animEndEventNames) {
        if (element.style[name] !== undefined) return animEndEventNames[name];
      }
    }());

    return animationEnd && {
      end: animationEnd
    };
  })();

  // requestAnimationFrame polyfill
  //https://github.com/darius/requestAnimationFrame
  (function () {

    Date.now = Date.now || function () {
      return new Date()
        .getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = (window[vp + 'CancelAnimationFrame'] ||
        window[vp + 'CancelRequestAnimationFrame']);
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) // iOS6 is buggy
      ||
      !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
            callback(lastTime = nextTime);
          },
          nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
  }());

  MDB.support.touch = (
    ('ontouchstart' in document) ||
    (global.DocumentTouch && document instanceof global.DocumentTouch) ||
    (global.navigator.msPointerEnabled && global.navigator.msMaxTouchPoints > 0) || //IE 10
    (global.navigator.pointerEnabled && global.navigator.maxTouchPoints > 0) || //IE >=11
    false
  );

  MDB.support.mutationobserver = (global.MutationObserver || global.WebKitMutationObserver || null);

  MDB.Utils = {};

  MDB.Utils.isFullscreen = function () {
    return document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.fullscreenElement || false;
  };

  MDB.Utils.str2json = function (str, notevil) {
    try {
      if (notevil) {
        return JSON.parse(str
          // wrap keys without quote with valid double quote
          .replace(/([\$\w]+)\s*:/g, function (_, $1) {
            return '"' + $1 + '":';
          })
          // replacing single quote wrapped ones to double quote
          .replace(/'([^']+)'/g, function (_, $1) {
            return '"' + $1 + '"';
          })
        );
      } else {
        return (new Function('', 'var json = ' + str + '; return JSON.parse(JSON.stringify(json));'))();
      }
    } catch (e) {
      return false;
    }
  };

  MDB.Utils.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this,
        args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  MDB.Utils.throttle = function (func, limit) {
    var wait = false;
    return function () {
      if (!wait) {
        func.call();
        wait = true;
        setTimeout(function () {
          wait = false;
        }, limit);
      }
    }
  };

  MDB.Utils.removeCssRules = function (selectorRegEx) {
    var idx, idxs, stylesheet, _i, _j, _k, _len, _len1, _len2, _ref;

    if (!selectorRegEx) return;

    setTimeout(function () {
      try {
        _ref = document.styleSheets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          stylesheet = _ref[_i];
          idxs = [];
          stylesheet.cssRules = stylesheet.cssRules;
          for (idx = _j = 0, _len1 = stylesheet.cssRules.length; _j < _len1; idx = ++_j) {
            if (stylesheet.cssRules[idx].type === CSSRule.STYLE_RULE && selectorRegEx.test(stylesheet.cssRules[idx].selectorText)) {
              idxs.unshift(idx);
            }
          }
          for (_k = 0, _len2 = idxs.length; _k < _len2; _k++) {
            stylesheet.deleteRule(idxs[_k]);
          }
        }
      } catch (_error) {}
    }, 0);
  };

  MDB.Utils.isInView = function (element, options) {

    var $element = $(element);

    if (!$element.is(':visible')) {
      return false;
    }

    var window_left = MDB.$win.scrollLeft(),
      window_top = MDB.$win.scrollTop(),
      offset = $element.offset(),
      left = offset.left,
      top = offset.top;

    options = $.extend({
      topoffset: 0,
      leftoffset: 0
    }, options);

    if (top + $element.height() >= window_top && top - options.topoffset <= window_top + MDB.$win.height() &&
      left + $element.width() >= window_left && left - options.leftoffset <= window_left + MDB.$win.width()) {
      return true;
    } else {
      return false;
    }
  };

  MDB.Utils.checkDisplay = function (context, initanimation) {

    var elements = MDB.$('[data-mdb-margin], [data-mdb-grid-match], [data-mdb-grid-margin], [data-mdb-check-display]', context || document),
      animated;

    if (context && !elements.length) {
      elements = $(context);
    }

    elements.trigger('display.mdb.check');

    // fix firefox / IE animations
    if (initanimation) {

      if (typeof (initanimation) != 'string') {
        initanimation = '[class*="mdb-animation-"]';
      }

      elements.find(initanimation)
        .each(function () {

          var ele = MDB.$(this),
            cls = ele.attr('class'),
            anim = cls.match(/mdb-animation-(.+)/);

          ele.removeClass(anim[0])
            .width();

          ele.addClass(anim[0]);
        });
    }

    return elements;
  };

  MDB.Utils.options = function (string) {

    if ($.type(string) != 'string') return string;

    if (string.indexOf(':') != -1 && string.trim()
      .substr(-1) != '}') {
      string = '{' + string + '}';
    }

    var start = (string ? string.indexOf("{") : -1),
      options = {};

    if (start != -1) {
      try {
        options = MDB.Utils.str2json(string.substr(start));
      } catch (e) {}
    }

    return options;
  };

  MDB.Utils.animate = function (element, cls) {

    var d = $.Deferred();

    element = MDB.$(element);

    element.css('display', 'none')
      .addClass(cls)
      .one(MDB.support.animation.end, function () {
        element.removeClass(cls);
        d.resolve();
      });

    element.css('display', '');

    return d.promise();
  };

  MDB.Utils.uid = function (prefix) {
    return (prefix || 'id') + (new Date()
      .getTime()) + "RAND" + (Math.ceil(Math.random() * 100000));
  };

  MDB.Utils.template = function (str, data) {

    var tokens = str.replace(/\n/g, '\\n')
      .replace(/\{\{\{\s*(.+?)\s*\}\}\}/g, "{{!$1}}")
      .split(/(\{\{\s*(.+?)\s*\}\})/g),
      i = 0,
      toc, cmd, prop, val, fn, output = [],
      openblocks = 0;

    while (i < tokens.length) {

      toc = tokens[i];

      if (toc.match(/\{\{\s*(.+?)\s*\}\}/)) {
        i = i + 1;
        toc = tokens[i];
        cmd = toc[0];
        prop = toc.substring(toc.match(/^(\^|\#|\!|\~|\:)/) ? 1 : 0);

        switch (cmd) {
        case '~':
          output.push('for(var $i=0;$i<' + prop + '.length;$i++) { var $item = ' + prop + '[$i];');
          openblocks++;
          break;
        case ':':
          output.push('for(var $key in ' + prop + ') { var $val = ' + prop + '[$key];');
          openblocks++;
          break;
        case '#':
          output.push('if(' + prop + ') {');
          openblocks++;
          break;
        case '^':
          output.push('if(!' + prop + ') {');
          openblocks++;
          break;
        case '/':
          output.push('}');
          openblocks--;
          break;
        case '!':
          output.push('__ret.push(' + prop + ');');
          break;
        default:
          output.push('__ret.push(escape(' + prop + '));');
          break;
        }
      } else {
        output.push("__ret.push('" + toc.replace(/\'/g, "\\'") + "');");
      }
      i = i + 1;
    }

    fn = new Function('$data', [
      'var __ret = [];',
      'try {',
      'with($data){', (!openblocks ? output.join('') : '__ret = ["Not all blocks are closed correctly."]'), '};',
      '}catch(e){__ret = [e.message];}',
      'return __ret.join("").replace(/\\n\\n/g, "\\n");',
      "function escape(html) { return String(html).replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');}"
    ].join("\n"));

    return data ? fn(data) : fn;
  };

  MDB.Utils.focus = function (element, extra) {

    element = $(element);

    if (!element.length) {
      return element;
    }

    var autofocus = element.find('[autofocus]:first'),
      tabidx;

    if (autofocus.length) {
      return autofocus.focus();
    }

    autofocus = element.find(':input' + (extra && (',' + extra) || ''))
      .first();

    if (autofocus.length) {
      return autofocus.focus();
    }

    if (!element.attr('tabindex')) {
      tabidx = 1000;
      element.attr('tabindex', tabidx);
    }

    element[0].focus();

    if (tabidx) {
      element.attr('tabindex', '');
    }

    return element;
  };

  MDB.Utils.events = {};
  MDB.Utils.events.click = MDB.support.touch ? 'tap' : 'click';

  global.MDB = MDB;

  // deprecated

  MDB.fn = function (command, options) {

    var args = arguments,
      cmd = command.match(/^([a-z\-]+)(?:\.([a-z]+))?/i),
      component = cmd[1],
      method = cmd[2];

    if (!MDB[component]) {
      $.error('MDB component [' + component + '] does not exist.');
      return this;
    }

    return this.each(function () {
      var $this = $(this),
        data = $this.data(component);
      if (!data) $this.data(component, (data = MDB[component](this, method ? undefined : options)));
      if (method) data[method].apply(data, Array.prototype.slice.call(args, 1));
    });
  };

  $.MDB = MDB;
  $.fn.mdb = MDB.fn;

  MDB.langdirection = MDB.$html.attr("dir") == "rtl" ? "right" : "left";

  MDB.components = {};

  MDB.component = function (name, def) {
    

    var fn = function (element, options) {
      

      var $this = this;

      this.MDB = MDB;
      this.element = element ? MDB.$(element) : null;
      this.options = $.extend(true, {}, this.defaults, options);
      this.plugins = {};

      if (this.element) {
        this.element.data(name, this);
      }

      this.init();

      (this.options.plugins.length ? this.options.plugins : Object.keys(fn.plugins))
      .forEach(function (plugin) {

        if (fn.plugins[plugin].init) {
          fn.plugins[plugin].init($this);
          $this.plugins[plugin] = true;
        }

      });

      this.trigger('init.mdb.component', [name, this]);

      return this;
    };

    fn.plugins = {};

    $.extend(true, fn.prototype, {

      defaults: {
        plugins: []
      },

      boot: function () {},
      init: function () {},

      on: function (a1, a2, a3) {
        return MDB.$(this.element || this)
          .on(a1, a2, a3);
      },

      one: function (a1, a2, a3) {
        return MDB.$(this.element || this)
          .one(a1, a2, a3);
      },

      off: function (evt) {
        return MDB.$(this.element || this)
          .off(evt);
      },

      trigger: function (evt, params) {
        return MDB.$(this.element || this)
          .trigger(evt, params);
      },

      find: function (selector) {
        return MDB.$(this.element ? this.element : [])
          .find(selector);
      },

      proxy: function (obj, methods) {

        var $this = this;

        methods.split(' ')
          .forEach(function (method) {
            if (!$this[method]) $this[method] = function () {
              return obj[method].apply(obj, arguments);
            };
          });
      },

      mixin: function (obj, methods) {

        var $this = this;

        methods.split(' ')
          .forEach(function (method) {
            if (!$this[method]) $this[method] = obj[method].bind($this);
          });
      },

      option: function () {

        if (arguments.length == 1) {
          return this.options[arguments[0]] || undefined;
        } else if (arguments.length == 2) {
          this.options[arguments[0]] = arguments[1];
        }
      }

    }, def);

    this.components[name] = fn;

    this[name] = function () {

      var element, options;

      if (arguments.length) {

        switch (arguments.length) {
        case 1:

          if (typeof arguments[0] === 'string' || arguments[0].nodeType || arguments[0] instanceof jQuery) {
            element = $(arguments[0]);
          } else {
            options = arguments[0];
          }

          break;
        case 2:

          element = $(arguments[0]);
          options = arguments[1];
          break;
        }
      }

      if (element && element.data(name)) {
        return element.data(name);
      }

      return (new MDB.components[name](element, options));
    };

    if (MDB.domready) {
      MDB.component.boot(name);
    }

    return fn;
  };

  MDB.plugin = function (component, name, def) {
    this.components[component].plugins[name] = def;
  };

  MDB.component.boot = function (name) {

    if (MDB.components[name].prototype && MDB.components[name].prototype.boot && !MDB.components[name].booted) {
      MDB.components[name].prototype.boot.apply(MDB, []);
      MDB.components[name].booted = true;
    }
  };

  MDB.component.bootComponents = function () {

    for (var component in MDB.components) {
      MDB.component.boot(component);
    }
  };


  // DOM mutation save ready helper function

  MDB.domObservers = [];
  MDB.domready = false;

  MDB.ready = function (fn) {

    MDB.domObservers.push(fn);

    if (MDB.domready) {
      fn(document);
    }
  };

  MDB.on = function (a1, a2, a3) {

    if (a1 && a1.indexOf('ready.mdb.dom') > -1 && MDB.domready) {
      a2.apply(MDB.$doc);
    }

    return MDB.$doc.on(a1, a2, a3);
  };

  MDB.one = function (a1, a2, a3) {

    if (a1 && a1.indexOf('ready.mdb.dom') > -1 && MDB.domready) {
      a2.apply(MDB.$doc);
      return MDB.$doc;
    }

    return MDB.$doc.one(a1, a2, a3);
  };

  MDB.trigger = function (evt, params) {
    return MDB.$doc.trigger(evt, params);
  };

  MDB.domObserve = function (selector, fn) {

    if (!MDB.support.mutationobserver) return;

    fn = fn || function () {};

    MDB.$(selector)
      .each(function () {

        var element = this,
          $element = MDB.$(element);

        if ($element.data('observer')) {
          return;
        }

        try {

          var observer = new MDB.support.mutationobserver(MDB.Utils.debounce(function (mutations) {
            fn.apply(element, [$element]);
            $element.trigger('changed.mdb.dom');
          }, 50), {
            childList: true,
            subtree: true
          });

          // pass in the target node, as well as the observer options
          observer.observe(element, {
            childList: true,
            subtree: true
          });

          $element.data('observer', observer);

        } catch (e) {}
      });
  };

  MDB.init = function (root) {

    root = root || document;

    MDB.domObservers.forEach(function (fn) {
      fn(root);
    });
  };

  MDB.on('domready.mdb.dom', function () {

    MDB.init();

    if (MDB.domready) {
      MDB.Utils.checkDisplay();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {

    var domReady = function () {

      MDB.$body = MDB.$('body');

      MDB.trigger('beforeready.mdb.dom');

      MDB.component.bootComponents();

      // custom scroll observer
      var rafToken = requestAnimationFrame((function () {

        var memory = {
          dir: {
            x: 0,
            y: 0
          },
          x: window.pageXOffset,
          y: window.pageYOffset
        };

        var fn = function () {
          // reading this (window.page[X|Y]Offset) causes a full page recalc of the layout in Chrome,
          // so we only want to do this once
          var wpxo = window.pageXOffset;
          var wpyo = window.pageYOffset;

          // Did the scroll position change since the last time we were here?
          if (memory.x != wpxo || memory.y != wpyo) {

            // Set the direction of the scroll and store the new position
            if (wpxo != memory.x) {
              memory.dir.x = wpxo > memory.x ? 1 : -1;
            } else {
              memory.dir.x = 0;
            }
            if (wpyo != memory.y) {
              memory.dir.y = wpyo > memory.y ? 1 : -1;
            } else {
              memory.dir.y = 0;
            }

            memory.x = wpxo;
            memory.y = wpyo;

            // Trigger the scroll event, this could probably be sent using memory.clone() but this is
            // more explicit and easier to see exactly what is being sent in the event.
            MDB.$doc.trigger('scrolling.mdb.document', [{
              dir: {
                x: memory.dir.x,
                y: memory.dir.y
              },
              x: wpxo,
              y: wpyo
            }]);
          }

          cancelAnimationFrame(rafToken);
          rafToken = requestAnimationFrame(fn);
        };

        if (MDB.support.touch) {
          MDB.$html.on('touchmove touchend MSPointerMove MSPointerUp pointermove pointerup', fn);
        }

        if (memory.x || memory.y) fn();

        return fn;

      })());

      // run component init functions on dom
      MDB.trigger('domready.mdb.dom');

      if (MDB.support.touch) {

        // remove css hover rules for touch devices
        // UI.Utils.removeCssRules(/\.mdb-(?!navbar).*:hover/);

        // viewport unit fix for mdb-height-viewport - should be fixed in iOS 8
        if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {

          MDB.$win.on('load orientationchange resize', MDB.Utils.debounce((function () {

            var fn = function () {
              $('.mdb-height-viewport')
                .css('height', window.innerHeight);
              return fn;
            };

            return fn();

          })(), 100));
        }
      }

      MDB.trigger('afterready.mdb.dom');

      // mark that domready is left behind
      MDB.domready = true;

      // auto init js components
      if (MDB.support.mutationobserver) {

        var initFn = MDB.Utils.debounce(function () {
          requestAnimationFrame(function () {
            MDB.init(document.body);
          });
        }, 10);

        (new MDB.support.mutationobserver(function (mutations) {

          var init = false;

          mutations.every(function (mutation) {

            if (mutation.type != 'childList') return true;

            for (var i = 0, node; i < mutation.addedNodes.length; ++i) {

              node = mutation.addedNodes[i];

              if (node.outerHTML && node.outerHTML.indexOf('data-mdb-') !== -1) {
                return (init = true) && false;
              }
            }
            return true;
          });

          if (init) initFn();

        }))
        .observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    };

    if (document.readyState == 'complete' || document.readyState == 'interactive') {
      setTimeout(domReady);
    }

    return domReady;

  }());

  // add touch identifier class
  MDB.$html.addClass(MDB.support.touch ? 'mdb-touch' : 'mdb-notouch');

  // add mdb-hover class on tap to support overlays on touch devices
  if (MDB.support.touch) {

    var hoverset = false,
      exclude,
      hovercls = 'mdb-hover',
      selector = '.mdb-overlay, .mdb-overlay-hover, .mdb-overlay-toggle, .mdb-animation-hover, .mdb-has-hover';

    MDB.$html.on('mouseenter touchstart MSPointerDown pointerdown', selector, function () {

        if (hoverset) $('.' + hovercls)
          .removeClass(hovercls);

        hoverset = $(this)
          .addClass(hovercls);

      })
      .on('mouseleave touchend MSPointerUp pointerup', function (e) {

        exclude = $(e.target)
          .parents(selector);

        if (hoverset) {
          hoverset.not(exclude)
            .removeClass(hovercls);
        }
      });
  }

  return MDB;
});