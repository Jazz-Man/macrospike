var EventEmitter = require('events').EventEmitter;

var Hooks = function() {
  
  this.e = new EventEmitter;
  // this.e.setMaxListeners(10);
  var _this = this;
  
  function addAction(action, callback) {
    if (typeof action === "string" && typeof callback === "function") {
      _this.e.on(action, callback);
    }
    return MethodsAvailable;
  }
  function doAction() {
    var args = Array.prototype.slice.call(arguments);
    var action = args.shift();
    if (typeof action === "string") {
      _this.e.emit(action, args);
    }
    return MethodsAvailable;
  }
  function removeAction(action, callback) {
    if (typeof action === "string") {
      _this.e.removeListener(action, callback);
    }
    return MethodsAvailable;
  }
  
  function removeAllAction() {
    _this.e.removeAllListeners();
    return MethodsAvailable;
  }
  
  var MethodsAvailable = {
    removeAction : removeAction,
    removeAllAction : removeAllAction,
    doAction : doAction,
    addAction : addAction
  };
  
  return MethodsAvailable;
};

module.exports = new Hooks();