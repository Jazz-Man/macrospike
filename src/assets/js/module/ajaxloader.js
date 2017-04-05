var isElement = require('lodash/isElement');
var isPlainObject = require('lodash/isPlainObject');
var clone = require('lodash/clone');
var map = require('lodash/map');
var $$ = require('domtastic');
var Hooks = require('./hooks');

var win = window;

var _response = null;
var _promises = {
  beforeLoad: [],
  whileLoad: [],
  afterLoad: [],
  beforeReplace: [],
  afterReplace: []
};
var _cache = {};
var _support = [
  !!(
  win.history && win.history.pushState),
  !!win.addEventListener,
  !!win.DOMParser,
  !!win.fetch
];

function PageLoaderModule(params) {

  this.config = params || {
        ignoreClass: 'page-loader-ignore',
        preloadClass: 'nav-link',
        ignoreBlank: true, // ignore links with blank target attribute
        ignoreHref: [/^\#/],
        cacheActive: true,
        cacheTimeout: 1000 * 60 * 5,
        contentSelector:'#page-content',
        fetchParams: {
          method: 'GET'
        },
        cleanHtml: false,
        evalJs: true
      };
  this.setup();
}

PageLoaderModule.prototype.hook = function (hookName, promiseId, callback) {

  if (Object.keys(_promises).indexOf(hookName) < 0) {
    return false;
  }
  
  if (typeof callback === "function") {
    _promises[hookName].push({
      id: promiseId,
      callback: callback
    });
    
    return true;
  }
  
  if (null === callback) {
    _promises[hookName].forEach(function (hook, i) {
      if (hook.id === promiseId) {
        _promises[hookName].splice(i, 1);
      }
    });
    
    return true;
  }
  
};

PageLoaderModule.prototype.available = function () {
  return _support.every(function(element){
    return element === true
  });
};

PageLoaderModule.prototype.setup = function () {
  var _this = this;
  
  if (!_this.available()) {
    return;
  }
  
  // load page hook
  _this.hook('whileLoad', 'pageLoaderLoad', function () {
    return _this.load();
  });
  
  // clear html hook
  _this.hook('afterLoad', 'pageLoaderClean', function () {
    if (_this.config.cleanHtml) {
      _response.html = _this.clean(_response.html);
    }
  });
  
  // parse html hook
  _this.hook('afterLoad', 'pageLoaderParse', function () {
    _response.document = _this.parse();
    _response.title = _response.document.querySelector('title').innerHTML.trim();
    _response.bodyClasses = _response.document.querySelector('body').className;
    delete _response.html;
  });
  
  // set cache
  _this.hook('afterReplace', 'pageLoaderSetCache', function () {
    // set cache, skip if is already cache response
    if (_this.config.cacheActive && !_response.fromCache) {

      var cacheResponse = clone(_response);
      cacheResponse.time = Date.now();
      cacheResponse.fromCache = true;
      _cache[cacheResponse.url] = cacheResponse;
    }
  });
  
  // preload links
  _this.hook('afterReplace', 'pageLoaderSetCache', function () {
    return _this.parsePreload();
  });
  
  // update url & page title
  this.hook('afterReplace', 'pagerLoaderUpdateUrl', function () {
    // update url & page title
    if (!_response.isPopState) {
      win.history.pushState({
        url: _response.url,
        pageLoader: true
      }, _response.title, _response.url);
    }
    
    document.title = _response.title;
    document.body.className = _response.bodyClasses;
  });
  
  // replace current state
  win.history.replaceState({
    url: win.location.href,
    pageLoader: true
  }, document.title, win.location.href);
  
  // popstate event
  setTimeout(function () {
    win.addEventListener('popstate', function (e) {
      if (history.state && history.state.pageLoader) {
        _this.process({
          url: history.state.url,
          isPopState: true
        });
      }
      else {
        history.back();
      }
    }, false);
  }, 500);
  
  // click event
  win.document.addEventListener('click', function (e) {
    var el = $$(e.target);
    if (isElement(el[0])) {
      if (el.prop('tagName') === 'A') {
        var _ret = function () {
          var a = $$(document.createElement('a'));
          var href = el.attr('href');
          var valid = true;
          
          a.attr('href', href);
          
          // test ignore class
          if (el.hasClass(_this.config.ignoreClass)) {
            valid = false;
          }
          
          // test blank target attribute
          if (_this.config.ignoreBlank && el.attr('target') === '_blank') {
            valid = false;
          }
          
          // test host
          if (a.prop('host') !== win.location.host) {
            valid = false;
          }
          
          // test href regexp
          if (_this.config.ignoreHref) {
            _this.config.ignoreHref.forEach(function (regexp) {
              if (href.match(regexp)) {
                valid = false;
              }
            });
          }
          
          if (valid) {
            Hooks.doAction('pageLoader.click', a.attr('href'), el);
            _this.process({url: a.attr('href')});
            e.preventDefault();
            return {
              v: false
            };
          }
          
          el = null;
        }();
        if ((typeof _ret === 'undefined' ? 'undefined' : typeof _ret) === "object") {
          return _ret.v;
        }
      }
      else {
        el = el[0].parentNode;
      }
    }
  }, false);
};

PageLoaderModule.prototype.preload = function (url, force) {
  var _this = this;
  
  if (!force) {
    force = false;
  }
  if (!force && _cache[url]) {
    return;
  }
  var response = {
    url: url,
    isPopState: false
  };
  
  return Promise.resolve().then(function () {
    return _this.load(url);
  }).then(function (text) {
    return new Promise(function (resolve, reject) {
      if (_this.config.cleanHtml) {
        if (typeof text === 'string') {
          response.html = _this.clean(text);
          resolve();
        }
        else {
          reject("Can't clean Html");
        }
      }
      else {
        if (typeof text === 'string') {
          response.html = text;
          resolve();
        }
        else {
          reject("Html text not provided");
        }
      }
    });
  }).then(function () {
    response.document = _this.parse(response.html);
    response.title = response.document.querySelector('title').innerHTML.trim();
    response.bodyClasses = response.document.querySelector('body').className;
  }).then(function () {
    if (_this.config.cacheActive) {
      response.time = Date.now();
      response.fromCache = true;
      _cache[response.url] = response;
    }
  }).catch(function (err) {
    return console.log(err);
  });
};

PageLoaderModule.prototype.process = function (params) {
  var _this = this;
  
  if (!this.available()) {
    return;
  }
  
  // only one request at a time
  if (null !== _response) {
    return;
  }
  
  if (!(
    params && params.url)) {
    return;
  }
  
  _response = params;
  
  Hooks.doAction('pageLoader.processStart');
  
  return Promise.resolve().then(function () {
    return Promise.all(map(_promises.beforeLoad, function (hook) {
      return hook.callback();
    }));
  }).then(function () {
    return Promise.all(map(_promises.whileLoad, function (hook) {
      return hook.callback();
    }));
  }).then(function () {
    return Promise.all(map(_promises.afterLoad, function (hook) {
      return hook.callback();
    }));
  }).then(function () {
    return Promise.all(map(_promises.beforeReplace, function (hook) {
      return hook.callback();
    }));
  }).then(function () {
    return _this.replace();
  }).then(function () {
    return Promise.all(map(_promises.afterReplace, function (hook) {
      return hook.callback();
    }));
  }).then(function () {
    _response = null;
    Hooks.doAction('pageLoader.processEnd');
  }).catch(function (err) {
    return console.log(err);
  });
};

PageLoaderModule.prototype.initialize = function () {
  this.parsePreload();
};

PageLoaderModule.prototype.load = function (url, forceLoad) {
  
  var isProcess = false;
  
  if (!forceLoad) {
    forceLoad = false;
  }

  if (!url) {
    isProcess = true;
    url = _response.url || '';
  }

  // set cache response
  var cacheResponse = _cache[url];
  if (isProcess && cacheResponse && !forceLoad && cacheResponse.time + this.config.cacheTimeout > Date.now()) {
    cacheResponse.isPopState = !!_response.isPopState; // set current _response isPopState property to cache response.
    _response = cacheResponse;
    return Promise.resolve();
  }
  
  Hooks.doAction('pageLoader.beforeLoad', url);
  
  // fetch url
  
  return fetch(url, this.config.fetchParams).then(function (response) {
    
    return new Promise(function (resolve, reject) {
      Hooks.doAction('pageLoader.afterLoad', response);
      
      if (!response.ok) {
        reject('Fetch request failed');
        return;
      }
      
      if (response.headers.get('Content-Type').substr(0, 9) !== 'text/html') {
        Hooks.doAction('pageLoader.loadedOtherMedia', response);
        reject('Wrong Content-Type');
        return;
      }
      
      resolve(response.text());
    });
  }).then(function (text) {
    if (isProcess) {
      _response.html = text;
    }
    else {
      return text;
    }
  }).catch(function (err) {
    return console.log(err);
  });
  
};

PageLoaderModule.prototype.clean = function (html) {
  // skip if cache
  if (html === undefined && _response && _response.fromCache) {
    return;
  }
  
  html = typeof html === 'string' ? html : _response.html;
  
  if (!html) {
    return;
  }
  
  // remove newlines
  html = html.replace(/(\r\n|\n|\r)/gm, '');
  
  // remove multiple whitespaces
  html = html.replace(/\s+/g, ' ');
  
  // remove hidden chars
  html = html.replace(/[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g, '');
  
  return html;
};

PageLoaderModule.prototype.parsePreload = function () {
  var _this = this;
  
  if (!this.config.cacheActive) {
    return;
  }
  $$("a." + this.config.preloadClass).forEach(function (a) {
    var url = a.href;
    if('' !== url){
      setTimeout(function () {
        return _this.preload(url);
      }, 1);
    }
    
  });
};

PageLoaderModule.prototype.parse = function (html) {
  // skip if cache
  if (html === undefined && _response && _response.fromCache) {
    return _response.document;
  }
  
  html = typeof html === 'string' ? html : _response.html;
  
  if (!html) {
    return;
  }
  
  var parser = new DOMParser();
  var doc = parser.parseFromString(html, 'text/html');
  
  Hooks.doAction('pageLoader.loadedPage', doc);
  
  return doc;
};

PageLoaderModule.prototype.replace = function (content) {
  if (!_response) {
    return;
  }
  
  var newContent = isElement(content) ? content : $$(_response.document).find(this.config.contentSelector).clone()[0];
  var oldContent = $$(this.config.contentSelector)[0];
  
  if (isElement(newContent) && isElement(oldContent)) {
    Hooks.doAction('pageLoader.beforeReplace', newContent, oldContent);
    oldContent.parentNode.replaceChild(newContent, oldContent);
    Hooks.doAction('pageLoader.afterReplace');
    return true;
  }
  else {
    return false;
  }
};

PageLoaderModule.prototype.cacheClean = function () {
  _cache = {};
};

module.exports = function (params) {
  new PageLoaderModule(params);
};