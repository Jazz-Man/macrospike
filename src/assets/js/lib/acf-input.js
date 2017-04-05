var Hooks = require("../module/hooks");
var doc = $(document);
var win = $(window);

$.fn.exists = function() {
  return $(this).length > 0;
};
$.fn.outerHTML = function() {
  return $(this).get(0).outerHTML;
};

var acf = {
  l10n : {},
  o : {},
  update : function(k, v) {
    this.o[k] = v;
  },
  get : function(k) {
    if (typeof this.o[k] !== "undefined") {
      return this.o[k];
    }
    return null;
  },
  _e : function(k1, k2) {
    k2 = k2 || false;
    var string = this.l10n[k1] || "";
    if (k2) {
      string = string[k2] || "";
    }
    return string;
  },
  add_action : function() {
    var a = arguments[0].split(" ");
    var l = a.length;
    var i = 0;
    for (;i < l;i++) {
      arguments[0] = "acf/" + a[i];
      Hooks.addAction.apply(this, arguments);
    }
    return this;
  },
  remove_action : function() {
    arguments[0] = "acf/" + arguments[0];
    Hooks.removeAction.apply(this, arguments);
    return this;
  },
  do_action : function() {
    arguments[0] = "acf/" + arguments[0];
    Hooks.doAction.apply(this, arguments);
    return this;
  },
  add_filter : function() {
    arguments[0] = "acf/" + arguments[0];
    Hooks.addFilter.apply(this, arguments);
    return this;
  },
  remove_filter : function() {
    arguments[0] = "acf/" + arguments[0];
    Hooks.removeFilter.apply(this, arguments);
    return this;
  },
  apply_filters : function() {
    arguments[0] = "acf/" + arguments[0];
    return Hooks.applyFilters.apply(this, arguments);
  },
  get_selector : function(s) {
    s = s || "";
    var selector = ".acf-field";
    if ($.isPlainObject(s)) {
      if ($.isEmptyObject(s)) {
        s = "";
      } else {
        for (k in s) {
          s = s[k];
          break;
        }
      }
    }
    if (s) {
      selector += "-" + s;
      selector = selector.split("_").join("-");
      selector = selector.split("field-field-").join("field-");
    }
    return selector;
  },
  get_fields : function(s, $el, all) {
    s = s || "";
    $el = $el || false;
    all = all || false;
    var selector = this.get_selector(s);
    var $fields = $(selector, $el);
    if ($el !== false) {
      $el.each(function() {
        if ($(this).is(selector)) {
          $fields = $fields.add($(this));
        }
      });
    }
    if (!all) {
      $fields = acf.apply_filters("get_fields", $fields);
    }
    return $fields;
  },
  get_field : function(s, $el) {
    s = s || "";
    $el = $el || false;
    var $fields = this.get_fields(s, $el, true);
    if ($fields.exists()) {
      return $fields.first();
    }
    return false;
  },
  get_closest_field : function($el, s) {
    s = s || "";
    return $el.closest(this.get_selector(s));
  },
  get_field_wrap : function($el) {
    return $el.closest(this.get_selector());
  },
  get_field_key : function($field) {
    return $field.data("key");
  },
  get_field_type : function($field) {
    return $field.data("type");
  },
  get_data : function($el, name) {
    if (typeof name === "undefined") {
      return $el.data();
    }
    return $el.data(name);
  },
  get_uniqid : function(prefix, more_entropy) {
    if (typeof prefix === "undefined") {
      prefix = "";
    }
    var retId;
    var formatSeed = function(seed, reqWidth) {
      seed = parseInt(seed, 10).toString(16);
      if (reqWidth < seed.length) {
        return seed.slice(seed.length - reqWidth);
      }
      if (reqWidth > seed.length) {
        return Array(1 + (reqWidth - seed.length)).join("0") + seed;
      }
      return seed;
    };
    if (!this.php_js) {
      this.php_js = {};
    }
    if (!this.php_js.uniqidSeed) {
      this.php_js.uniqidSeed = Math.floor(Math.random() * 123456789);
    }
    this.php_js.uniqidSeed++;
    retId = prefix;
    retId += formatSeed(parseInt((new Date).getTime() / 1E3, 10), 8);
    retId += formatSeed(this.php_js.uniqidSeed, 5);
    if (more_entropy) {
      retId += (Math.random() * 10).toFixed(8).toString();
    }
    return retId;
  },
  serialize_form : function($el) {
    var data = {};
    var names = {};
    var $selector = $el.find("select, textarea, input");
    $.each($selector.serializeArray(), function(i, pair) {
      if (pair.name.slice(-2) === "[]") {
        pair.name = pair.name.replace("[]", "");
        if (typeof names[pair.name] === "undefined") {
          names[pair.name] = -1;
        }
        names[pair.name]++;
        pair.name += "[" + names[pair.name] + "]";
      }
      data[pair.name] = pair.value;
    });
    return data;
  },
  serialize : function($el) {
    return this.serialize_form($el);
  },
  remove_tr : function($tr, callback) {
    var height = $tr.height();
    var children = $tr.children().length;
    $tr.addClass("acf-remove-element");
    setTimeout(function() {
      $tr.removeClass("acf-remove-element");
      $tr.html('<td style="padding:0; height:' + height + 'px;" colspan="' + children + '"></td>');
      $tr.children("td").animate({
        height : 0
      }, 250, function() {
        $tr.remove();
        if (typeof callback == "function") {
          callback();
        }
      });
    }, 250);
  },
  remove_el : function($el, callback, end_height) {
    end_height = end_height || 0;
    $el.css({
      height : $el.height(),
      width : $el.width(),
      position : "absolute"
    });
    $el.wrap('<div class="acf-temp-wrap" style="height:' + $el.outerHeight(true) + 'px;"></div>');
    $el.animate({
      opacity : 0
    }, 250);
    $el.parent(".acf-temp-wrap").animate({
      height : end_height
    }, 250, function() {
      $(this).remove();
      if (typeof callback == "function") {
        callback();
      }
    });
  },
  isset : function() {
    var a = arguments;
    var l = a.length;
    var c = null;
    var undef;
    if (l === 0) {
      throw new Error("Empty isset");
    }
    c = a[0];
    i = 1;
    for (;i < l;i++) {
      if (a[i] === undef || c[a[i]] === undef) {
        return false;
      }
      c = c[a[i]];
    }
    return true;
  },
  maybe_get : function(obj, key, value) {
    if (typeof value == "undefined") {
      value = null;
    }
    keys = String(key).split(".");
    var i;
    for (i in keys) {
      key = keys[i];
      if (typeof obj[key] === "undefined") {
        return value;
      }
      obj = obj[key];
    }
    return obj;
  },
  open_popup : function(args) {
    var $popup = $("body > #acf-popup");
    if ($popup.exists()) {
      return update_popup(args);
    }
    var tmpl = ['<div id="acf-popup">', '<div class="acf-popup-box acf-box">', '<div class="title"><h3></h3><a href="#" class="acf-icon -cancel grey acf-close-popup"></a></div>', '<div class="inner"></div>', '<div class="loading"><i class="acf-loading"></i></div>', "</div>", '<div class="bg"></div>', "</div>"].join("");
    $("body").append(tmpl);
    $("#acf-popup").on("click", ".bg, .acf-close-popup", function(e) {
      e.preventDefault();
      acf.close_popup();
    });
    return this.update_popup(args);
  },
  update_popup : function(args) {
    var $popup = $("#acf-popup");
    if (!$popup.exists()) {
      return false;
    }
    args = $.extend({}, {
      title : "",
      content : "",
      width : 0,
      height : 0,
      loading : false
    }, args);
    if (args.title) {
      $popup.find(".title h3").html(args.title);
    }
    var $inner;
    if (args.content) {
      $inner = $popup.find(".inner:first");
      $inner.html(args.content);
      acf.do_action("append", $inner);
      $inner.attr("style", "position: relative;");
      args.height = $inner.outerHeight();
      $inner.removeAttr("style");
    }
    if (args.width) {
      $popup.find(".acf-popup-box").css({
        "width" : args.width,
        "margin-left" : 0 - args.width / 2
      });
    }
    if (args.height) {
      args.height += 44;
      $popup.find(".acf-popup-box").css({
        "height" : args.height,
        "margin-top" : 0 - args.height / 2
      });
    }
    if (args.loading) {
      $popup.find(".loading").show();
    } else {
      $popup.find(".loading").hide();
    }
    return $popup;
  },
  close_popup : function() {
    var $popup = $("#acf-popup");
    if ($popup.exists()) {
      $popup.remove();
    }
  },
  update_user_setting : function(name, value) {
    $.ajax({
      url : acf.get("ajaxurl"),
      dataType : "html",
      type : "post",
      data : acf.prepare_for_ajax({
        "action" : "acf/update_user_setting",
        "name" : name,
        "value" : value
      })
    });
  },
  prepare_for_ajax : function(args) {
    args.nonce = acf.get("nonce");
    args = acf.apply_filters("prepare_for_ajax", args);
    return args;
  },
  is_ajax_success : function(json) {
    if (json && json.success) {
      return true;
    }
    return false;
  },
  get_ajax_message : function(json) {
    var message = {
      text : "",
      type : "error"
    };
    if (!json) {
      return message;
    }
    if (json.success) {
      message.type = "success";
    }
    if (json.data && json.data.message) {
      message.text = json.data.message;
    }
    if (json.data && json.data.error) {
      message.text = json.data.error;
    }
    return message;
  },
  is_in_view : function($el) {
    var elemTop = $el.offset().top;
    var elemBottom = elemTop + $el.height();
    if (elemTop === elemBottom) {
      return false;
    }
    var docViewTop = win.scrollTop();
    var docViewBottom = docViewTop + win.height();
    return elemBottom <= docViewBottom && elemTop >= docViewTop;
  },
  val : function($el, val) {
    var orig = $el.val();
    $el.val(val);
    if (val != orig) {
      $el.trigger("change");
    }
  },
  str_replace : function(search, replace, subject) {
    return subject.split(search).join(replace);
  },
  str_sanitize : function(string) {
    var string2 = "";
    var replace = ruTranslitChars;
    string = string.toLowerCase();
    i = 0;
    for (;i < string.length;i++) {
      var c = string.charAt(i);
      if (typeof replace[c] !== "undefined") {
        c = replace[c];
      }
      string2 += c;
    }
    return string2;
  },
  render_select : function($select, choices) {
    var value = $select.val();
    $select.html("");
    if (!choices) {
      return;
    }
    $.each(choices, function(i, item) {
      var $optgroup = $select;
      if (item.group) {
        $optgroup = $select.find('optgroup[label="' + item.group + '"]');
        if (!$optgroup.exists()) {
          $optgroup = $('<optgroup label="' + item.group + '"></optgroup>');
          $select.append($optgroup);
        }
      }
      $optgroup.append('<option value="' + item.value + '">' + item.label + "</option>");
      if (value == item.value) {
        $select.prop("selectedIndex", i);
      }
    });
  },
  duplicate : function($el, attr) {
    attr = attr || "data-id";
    //noinspection JSAnnotator
    find = $el.attr(attr);
    replace = acf.get_uniqid();
    acf.do_action("before_duplicate", $el);
    var $el2 = $el.clone();
    $el2.removeClass("acf-clone");
    acf.do_action("remove", $el2);
    if (typeof find !== "undefined") {
      $el2.attr(attr, replace);
      $el2.find('[id*="' + find + '"]').each(function() {
        $(this).attr("id", $(this).attr("id").replace(find, replace));
      });
      $el2.find('[name*="' + find + '"]').each(function() {
        $(this).attr("name", $(this).attr("name").replace(find, replace));
      });
      $el2.find('label[for*="' + find + '"]').each(function() {
        $(this).attr("for", $(this).attr("for").replace(find, replace));
      });
    }
    $el2.find(".ui-sortable").removeClass("ui-sortable");
    acf.do_action("after_duplicate", $el, $el2);
    $el.after($el2);
    setTimeout(function() {
      acf.do_action("append", $el2);
    }, 1);
    return $el2;
  },
  decode : function(string) {
    return $("<div/>").html(string).text();
  },
  parse_args : function(args, defaults) {
    return $.extend({}, defaults, args);
  }
};
acf.model = {
  actions : {},
  filters : {},
  events : {},
  extend : function(args) {
    var model = $.extend({}, this, args);
    $.each(model.actions, function(name, callback) {
      model._add_action(name, callback);
    });
    $.each(model.filters, function(name, callback) {
      model._add_filter(name, callback);
    });
    $.each(model.events, function(name, callback) {
      model._add_event(name, callback);
    });
    return model;
  },
  _add_action : function(name, callback) {
    var model = this;
    var data = name.split(" ");
    name = data[0] || "";
    var priority = data[1] || 10;
    acf.add_action(name, model[callback], priority, model);
  },
  _add_filter : function(name, callback) {
    var model = this;
    var data = name.split(" ");
    name = data[0] || "";
    var priority = data[1] || 10;
    acf.add_filter(name, model[callback], priority, model);
  },
  _add_event : function(name, callback) {
    var model = this;
    var event = name.substr(0, name.indexOf(" "));
    var selector = name.substr(name.indexOf(" ") + 1);
    doc.on(event, selector, function(e) {
      e.$el = $(this);
      if (typeof model.event === "function") {
        e = model.event(e);
      }
      model[callback].apply(model, [e]);
    });
  },
  get : function(name, value) {
    value = value || null;
    if (typeof this[name] !== "undefined") {
      value = this[name];
    }
    return value;
  },
  set : function(name, value) {
    this[name] = value;
    if (typeof this["_set_" + name] === "function") {
      this["_set_" + name].apply(this);
    }
    return this;
  }
};
acf.field = acf.model.extend({
  type : "",
  o : {},
  $field : null,
  _add_action : function(name, callback) {
    var model = this;
    name = name + "_field/type=" + model.type;
    acf.add_action(name, function($field) {
      model.set("$field", $field);
      model[callback].apply(model, arguments);
    });
  },
  _add_filter : function(name, callback) {
    var model = this;
    name = name + "_field/type=" + model.type;
    acf.add_filter(name, function($field) {
      model.set("$field", $field);
      model[callback].apply(model, arguments);
    });
  },
  _add_event : function(name, callback) {
    var model = this;
    var event = name.substr(0, name.indexOf(" "));
    var selector = name.substr(name.indexOf(" ") + 1);
    var context = acf.get_selector(model.type);
    doc.on(event, context + " " + selector, function(e) {
      e.$el = $(this);
      e.$field = acf.get_closest_field(e.$el, model.type);
      model.set("$field", e.$field);
      model[callback].apply(model, [e]);
    });
  },
  _set_$field : function() {
    if (typeof this.focus === "function") {
      this.focus();
    }
  },
  doFocus : function($field) {
    return this.set("$field", $field);
  }
});
acf.fields = acf.model.extend({
  actions : {
    "prepare" : "_prepare",
    "prepare_field" : "_prepare_field",
    "ready" : "_ready",
    "ready_field" : "_ready_field",
    "append" : "_append",
    "append_field" : "_append_field",
    "load" : "_load",
    "load_field" : "_load_field",
    "remove" : "_remove",
    "remove_field" : "_remove_field",
    "sortstart" : "_sortstart",
    "sortstart_field" : "_sortstart_field",
    "sortstop" : "_sortstop",
    "sortstop_field" : "_sortstop_field",
    "show" : "_show",
    "show_field" : "_show_field",
    "hide" : "_hide",
    "hide_field" : "_hide_field"
  },
  _prepare : function($el) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("prepare_field", $(this));
    });
  },
  _prepare_field : function($el) {
    acf.do_action("prepare_field/type=" + $el.data("type"), $el);
  },
  _ready : function($el) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("ready_field", $(this));
    });
  },
  _ready_field : function($el) {
    acf.do_action("ready_field/type=" + $el.data("type"), $el);
  },
  _append : function($el) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("append_field", $(this));
    });
  },
  _append_field : function($el) {
    acf.do_action("append_field/type=" + $el.data("type"), $el);
  },
  _load : function($el) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("load_field", $(this));
    });
  },
  _load_field : function($el) {
    acf.do_action("load_field/type=" + $el.data("type"), $el);
  },
  _remove : function($el) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("remove_field", $(this));
    });
  },
  _remove_field : function($el) {
    acf.do_action("remove_field/type=" + $el.data("type"), $el);
  },
  _sortstart : function($el, $placeholder) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("sortstart_field", $(this), $placeholder);
    });
  },
  _sortstart_field : function($el, $placeholder) {
    acf.do_action("sortstart_field/type=" + $el.data("type"), $el, $placeholder);
  },
  _sortstop : function($el, $placeholder) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("sortstop_field", $(this), $placeholder);
    });
  },
  _sortstop_field : function($el, $placeholder) {
    acf.do_action("sortstop_field/type=" + $el.data("type"), $el, $placeholder);
  },
  _hide : function($el, context) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("hide_field", $(this), context);
    });
  },
  _hide_field : function($el, context) {
    acf.do_action("hide_field/type=" + $el.data("type"), $el, context);
  },
  _show : function($el, context) {
    acf.get_fields("", $el).each(function() {
      acf.do_action("show_field", $(this), context);
    });
  },
  _show_field : function($el, context) {
    acf.do_action("show_field/type=" + $el.data("type"), $el, context);
  }
});
doc.ready(function() {
  acf.do_action("ready", $("body"));
});
win.on("load", function() {
  acf.do_action("load", $("body"));
});
acf.layout = acf.model.extend({
  active : 0,
  actions : {
    "refresh" : "refresh"
  },
  refresh : function($el$$0) {
    $el$$0 = $el$$0 || false;
    $(".acf-fields:visible", $el$$0).each(function() {
      var $els = $();
      var top = 0;
      var height = 0;
      var cell = -1;
      var $fields = $(this).children(".acf-field[data-width]:visible");
      if (!$fields.exists()) {
        return;
      }
      $fields.removeClass("acf-r0 acf-c0").css({
        "min-height" : 0
      });
      $fields.each(function(i) {
        var $el = $(this);
        var this_top = $el.position().top;
        if (i == 0) {
          top = this_top;
        }
        if (this_top != top) {
          $els.css({
            "min-height" : height + 1 + "px"
          });
          $els = $();
          top = $el.position().top;
          height = 0;
          cell = -1;
        }
        cell++;
        height = $el.outerHeight() > height ? $el.outerHeight() : height;
        $els = $els.add($el);
        if (this_top == 0) {
          $el.addClass("acf-r0");
        } else {
          if (cell == 0) {
            $el.addClass("acf-c0");
          }
        }
      });
      if ($els.exists()) {
        $els.css({
          "min-height" : height + 1 + "px"
        });
      }
    });
  }
});
doc.on("change", ".acf-field input, .acf-field textarea, .acf-field select", function() {
  if ($('#acf-form-data input[name="_acfchanged"]').exists()) {
    $('#acf-form-data input[name="_acfchanged"]').val(1);
  }
  acf.do_action("change", $(this));
});
doc.on("click", '.acf-field a[href="#"]', function(e) {
  e.preventDefault();
});
acf.unload = acf.model.extend({
  active : 1,
  changed : 0,
  filters : {
    "validation_complete" : "validation_complete"
  },
  actions : {
    "change" : "on",
    "submit" : "off"
  },
  events : {
    "submit form" : "off"
  },
  validation_complete : function(json, $form) {
    if (json && json.errors) {
      this.on();
    }
    return json;
  },
  on : function() {
    if (this.changed || !this.active) {
      return;
    }
    this.changed = 1;
    win.on("beforeunload", this.unload);
  },
  off : function() {
    this.changed = 0;
    win.off("beforeunload", this.unload);
  },
  unload : function() {
    return acf._e("unload");
  }
});
acf.tooltip = acf.model.extend({
  $el : null,
  events : {
    "mouseenter .acf-js-tooltip" : "on",
    "mouseleave .acf-js-tooltip" : "off"
  },
  on : function(e) {
    var title = e.$el.attr("title");
    if (!title) {
      return;
    }
    this.$el = $('<div class="acf-tooltip">' + title + "</div>");
    $("body").append(this.$el);
    var tolerance = 10;
    var target_w = e.$el.outerWidth();
    var target_h = e.$el.outerHeight();
    var target_t = e.$el.offset().top;
    var target_l = e.$el.offset().left;
    var tooltip_w = this.$el.outerWidth();
    var tooltip_h = this.$el.outerHeight();
    var top = target_t - tooltip_h;
    var left = target_l + target_w / 2 - tooltip_w / 2;
    if (left < tolerance) {
      this.$el.addClass("right");
      left = target_l + target_w;
      top = target_t + target_h / 2 - tooltip_h / 2;
    } else {
      if (left + tooltip_w + tolerance > win.width()) {
        this.$el.addClass("left");
        left = target_l - tooltip_w;
        top = target_t + target_h / 2 - tooltip_h / 2;
      } else {
        if (top - win.scrollTop() < tolerance) {
          this.$el.addClass("bottom");
          top = target_t + target_h;
        } else {
          this.$el.addClass("top");
        }
      }
    }
    this.$el.css({
      "top" : top,
      "left" : left
    });
    e.$el.data("title", title);
    e.$el.attr("title", "");
  },
  off : function(e) {
    if (!this.$el) {
      return;
    }
    e.$el.attr("title", e.$el.data("title"));
    this.$el.remove();
  }
});
acf.postbox = acf.model.extend({
  events : {
    "mouseenter .acf-postbox .handlediv" : "on",
    "mouseleave .acf-postbox .handlediv" : "off"
  },
  on : function(e) {
    e.$el.siblings(".hndle").addClass("hover");
  },
  off : function(e) {
    e.$el.siblings(".hndle").removeClass("hover");
  },
  render : function(args) {
    args = $.extend({}, {
      id : "",
      key : "",
      style : "default",
      label : "top",
      edit_url : "",
      edit_title : "",
      visibility : true
    }, args);
    var $postbox = $("#" + args.id);
    var $toggle = $("#" + args.id + "-hide");
    var $label = $toggle.parent();
    $postbox.addClass("acf-postbox");
    $label.addClass("acf-postbox-toggle");
    $postbox.removeClass("hide-if-js");
    $label.removeClass("hide-if-js");
    if (args.style !== "default") {
      $postbox.addClass(args.style);
    }
    $postbox.children(".inside").addClass("acf-fields").addClass("-" + args.label);
    if (args.visibility) {
      $toggle.prop("checked", true);
    } else {
      $postbox.addClass("acf-hidden");
      $label.addClass("acf-hidden");
    }
    if (args.edit_url) {
      $postbox.children(".hndle").append('<a href="' + args.edit_url + '" class="dashicons dashicons-admin-generic acf-hndle-cog acf-js-tooltip" title="' + args.edit_title + '"></a>');
    }
  }
});
acf.add_action("sortstart", function($item, $placeholder) {
  if ($item.is("tr")) {
    $item.css("position", "relative");
    $item.children().each(function() {
      $(this).width($(this).width());
    });
    $item.css("position", "absolute");
    $placeholder.html('<td style="height:' + $item.height() + 'px; padding:0;" colspan="' + $item.children("td").length + '"></td>');
  }
});
acf.add_action("before_duplicate", function($orig) {
  $orig.find("select option:selected").addClass("selected");
});
acf.add_action("after_duplicate", function($orig, $duplicate) {
  $duplicate.find("select").each(function() {
    var $select = $(this);
    var val = [];
    $select.find("option.selected").each(function() {
      val.push($(this).val());
    });
    $select.val(val);
  });
  $orig.find("select option.selected").removeClass("selected");
  $duplicate.find("select option.selected").removeClass("selected");
});

acf.ajax = acf.model.extend({
  actions : {
    "ready" : "ready"
  },
  events : {
    "change #page_template" : "_change_template",
    "change #parent_id" : "_change_parent",
    "change #post-formats-select input" : "_change_format",
    "change .categorychecklist input" : "_change_term",
    'change .acf-taxonomy-field[data-save="1"] input' : "_change_term",
    'change .acf-taxonomy-field[data-save="1"] select' : "_change_term"
  },
  o : {},
  xhr : null,
  update : function(k, v) {
    this.o[k] = v;
    return this;
  },
  get : function(k) {
    return this.o[k] || null;
  },
  ready : function() {
    this.update("post_id", acf.get("post_id"));
  },
  fetch : function() {
    if (!acf.get("ajax")) {
      return;
    }
    if (this.xhr) {
      this.xhr.abort();
    }
    var self = this;
    var data = this.o;
    data.action = "acf/post/get_field_groups";
    data.exists = [];
    $(".acf-postbox").not(".acf-hidden").each(function() {
      data.exists.push($(this).attr("id").substr(4));
    });
    this.xhr = $.ajax({
      url : acf.get("ajaxurl"),
      data : acf.prepare_for_ajax(data),
      type : "post",
      dataType : "json",
      success : function(json) {
        if (acf.is_ajax_success(json)) {
          self.render(json.data);
        }
      }
    });
  },
  render : function(json) {
    $(".acf-postbox").addClass("acf-hidden");
    $(".acf-postbox-toggle").addClass("acf-hidden");
    $("#acf-style").html("");
    $.each(json, function(k, field_group) {
      var $postbox = $("#acf-" + field_group.key);
      var $toggle = $("#acf-" + field_group.key + "-hide");
      var $label = $toggle.parent();
      $postbox.removeClass("acf-hidden hide-if-js").show();
      $label.removeClass("acf-hidden hide-if-js").show();
      $toggle.prop("checked", true);
      var $replace = $postbox.find(".acf-replace-with-fields");
      if ($replace.exists()) {
        $replace.replaceWith(field_group.html);
        acf.do_action("append", $postbox);
      }
      if (k === 0) {
        $("#acf-style").html(field_group.style);
      }
      $postbox.find(".acf-hidden-by-postbox").prop("disabled", false);
    });
    $(".acf-postbox.acf-hidden").find("select, textarea, input").not(":disabled").each(function() {
      $(this).addClass("acf-hidden-by-postbox").prop("disabled", true);
    });
  },
  sync_taxonomy_terms : function() {
    var values = [""];
    $(".categorychecklist, .acf-taxonomy-field").each(function() {
      var $el = $(this);
      var $checkbox = $el.find('input[type="checkbox"]').not(":disabled");
      var $radio = $el.find('input[type="radio"]').not(":disabled");
      var $select = $el.find("select").not(":disabled");
      var $hidden = $el.find('input[type="hidden"]').not(":disabled");
      if ($el.is(".acf-taxonomy-field") && $el.attr("data-save") != "1") {
        return;
      }
      if ($el.closest(".media-frame").exists()) {
        return;
      }
      if ($checkbox.exists()) {
        $checkbox.filter(":checked").each(function() {
          values.push($(this).val());
        });
      } else {
        if ($radio.exists()) {
          $radio.filter(":checked").each(function() {
            values.push($(this).val());
          });
        } else {
          if ($select.exists()) {
            $select.find("option:selected").each(function() {
              values.push($(this).val());
            });
          } else {
            if ($hidden.exists()) {
              $hidden.each(function() {
                if (!$(this).val()) {
                  return;
                }
                values.push($(this).val());
              });
            }
          }
        }
      }
    });
    values = values.filter(function(v, i, a) {
      return a.indexOf(v) == i;
    });
    this.update("post_taxonomy", values).fetch();
  },
  _change_template : function(e) {
    var page_template = e.$el.val();
    this.update("page_template", page_template).fetch();
  },
  _change_parent : function(e) {
    var page_type = "parent";
    var page_parent = 0;
    if (e.$el.val() != "") {
      page_type = "child";
      page_parent = e.$el.val();
    }
    this.update("page_type", page_type).update("page_parent", page_parent).fetch();
  },
  _change_format : function(e) {
    var post_format = e.$el.val();
    if (post_format == "0") {
      post_format = "standard";
    }
    this.update("post_format", post_format).fetch();
  },
  _change_term : function(e) {
    var self = this;
    if (e.$el.closest(".media-frame").exists()) {
      return;
    }
    setTimeout(function() {
      self.sync_taxonomy_terms();
    }, 1);
  }
});

acf.datepicker = acf.model.extend({
  actions : {
    "ready 1" : "ready"
  },
  ready : function() {
    var locale = acf.get("locale");
    var rtl = acf.get("rtl");
    var l10n = acf._e("date_picker");
    if (!l10n) {
      return;
    }
    l10n.isRTL = rtl;
    $.datepicker.regional[locale] = l10n;
    $.datepicker.setDefaults(l10n);
  },
  init : function($input, args) {
    args = args || {};
    $input.datepicker(args);
    if ($("body > #ui-datepicker-div").exists()) {
      $("body > #ui-datepicker-div").wrap('<div class="acf-ui-datepicker" />');
    }
  },
  destroy : function($input) {
  }
});
acf.fields.date_picker = acf.field.extend({
  type : "date_picker",
  $el : null,
  $input : null,
  $hidden : null,
  o : {},
  actions : {
    "ready" : "initialize",
    "append" : "initialize"
  },
  events : {
    'blur input[type="text"]' : "blur"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-date-picker");
    this.$input = this.$el.find('input[type="text"]');
    this.$hidden = this.$el.find('input[type="hidden"]');
    this.o = acf.get_data(this.$el);
  },
  initialize : function() {
    var args = {
      dateFormat : this.o.date_format,
      altField : this.$hidden,
      altFormat : "yymmdd",
      changeYear : true,
      yearRange : "-100:+100",
      changeMonth : true,
      showButtonPanel : true,
      firstDay : this.o.first_day
    };
    args = acf.apply_filters("date_picker_args", args, this.$field);
    acf.datepicker.init(this.$input, args);
  },
  blur : function() {
    if (!this.$input.val()) {
      this.$hidden.val("");
    }
  }
});

acf.datetimepicker = acf.model.extend({
  actions : {
    "ready 1" : "ready"
  },
  filters : {
    "date_time_picker_args" : "customize_onClose",
    "time_picker_args" : "customize_onClose"
  },
  ready : function() {
    var locale = acf.get("locale");
    var rtl = acf.get("rtl");
    var l10n = acf._e("date_time_picker");
    if (!l10n) {
      return;
    }
    l10n.isRTL = rtl;
    $.timepicker.regional[locale] = l10n;
    $.timepicker.setDefaults(l10n);
  },
  init : function($input, args) {
    args = args || {};
    $input.datetimepicker(args);
    if ($("body > #ui-datepicker-div").exists()) {
      $("body > #ui-datepicker-div").wrap('<div class="acf-ui-datepicker" />');
    }
  },
  destroy : function($input) {
  },
  customize_onClose : function(args) {
    args.closeText = acf._e("date_time_picker", "selectText");
    args.onClose = function(value, instance) {
      var $div = instance.dpDiv;
      var $close = $div.find(".ui-datepicker-close");
      if (!value && $close.is(":hover")) {
        value = acf.maybe_get(instance, "settings.timepicker.formattedTime");
        if (!value) {
          return;
        }
        acf.val(instance.input, value);
      }
    };
    return args;
  }
});
acf.fields.date_time_picker = acf.field.extend({
  type : "date_time_picker",
  $el : null,
  $input : null,
  $hidden : null,
  o : {},
  actions : {
    "ready" : "initialize",
    "append" : "initialize"
  },
  events : {
    'blur input[type="text"]' : "blur"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-date-time-picker");
    this.$input = this.$el.find('input[type="text"]');
    this.$hidden = this.$el.find('input[type="hidden"]');
    this.o = acf.get_data(this.$el);
  },
  initialize : function() {
    var args = {
      dateFormat : this.o.date_format,
      timeFormat : this.o.time_format,
      altField : this.$hidden,
      altFieldTimeOnly : false,
      altFormat : "yy-mm-dd",
      altTimeFormat : "HH:mm:ss",
      changeYear : true,
      yearRange : "-100:+100",
      changeMonth : true,
      showButtonPanel : true,
      firstDay : this.o.first_day,
      controlType : "select",
      oneLine : true
    };
    args = acf.apply_filters("date_time_picker_args", args, this.$field);
    acf.datetimepicker.init(this.$input, args);
  },
  blur : function() {
    if (!this.$input.val()) {
      this.$hidden.val("");
    }
  }
});

acf.fields.file = acf.field.extend({
  type : "file",
  $el : null,
  $input : null,
  actions : {
    "ready" : "initialize",
    "append" : "initialize"
  },
  events : {
    'click a[data-name="add"]' : "add",
    'click a[data-name="edit"]' : "edit",
    'click a[data-name="remove"]' : "remove",
    'change input[type="file"]' : "change"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-file-uploader");
    this.$input = this.$el.find('input[type="hidden"]');
    this.o = acf.get_data(this.$el);
  },
  initialize : function() {
    if (this.o.uploader == "basic") {
      this.$el.closest("form").attr("enctype", "multipart/form-data");
    }
  },
  prepare : function(attachment) {
    attachment = attachment || {};
    if (attachment._valid) {
      return attachment;
    }
    var data = {
      url : "",
      alt : "",
      title : "",
      filename : "",
      filesize : "",
      icon : "/wp-includes/images/media/default.png"
    };
    if (attachment.id) {
      data = attachment.attributes;
    }
    data._valid = true;
    return data;
  },
  render : function(data) {
    data = this.prepare(data);
    this.$el.find("img").attr({
      src : data.icon,
      alt : data.alt,
      title : data.title
    });
    this.$el.find('[data-name="title"]').text(data.title);
    this.$el.find('[data-name="filename"]').text(data.filename).attr("href", data.url);
    this.$el.find('[data-name="filesize"]').text(data.filesize);
    var val = "";
    if (data.id) {
      val = data.id;
    }
    acf.val(this.$input, val);
    if (val) {
      this.$el.addClass("has-value");
    } else {
      this.$el.removeClass("has-value");
    }
  },
  add : function() {
    var self = this;
    var $field = this.$field;
    var $repeater = acf.get_closest_field($field, "repeater");
    var frame = acf.media.popup({
      title : acf._e("file", "select"),
      mode : "select",
      type : "",
      field : $field.data("key"),
      multiple : $repeater.exists(),
      library : this.o.library,
      mime_types : this.o.mime_types,
      select : function(attachment, i) {
        if (i > 0) {
          var key = $field.data("key");
          var $tr = $field.closest(".acf-row");
          $field = false;
          $tr.nextAll(".acf-row:visible").each(function() {
            $field = acf.get_field(key, $(this));
            if (!$field) {
              return;
            }
            if ($field.find(".acf-file-uploader.has-value").exists()) {
              $field = false;
              return;
            }
            return false;
          });
          if (!$field) {
            $tr = acf.fields.repeater.doFocus($repeater).add();
            if (!$tr) {
              return false;
            }
            $field = acf.get_field(key, $tr);
          }
        }
        self.set("$field", $field).render(attachment);
      }
    });
  },
  edit : function() {
    var self = this;
    var $field = this.$field;
    var val = this.$input.val();
    if (!val) {
      return;
    }
    var frame = acf.media.popup({
      title : acf._e("file", "edit"),
      button : acf._e("file", "update"),
      mode : "edit",
      attachment : val,
      select : function(attachment, i) {
        self.set("$field", $field).render(attachment);
      }
    });
  },
  remove : function() {
    var attachment = {};
    this.render(attachment);
  },
  change : function(e) {
    this.$input.val(e.$el.val());
  }
});

acf.fields.image = acf.field.extend({
  type : "image",
  $el : null,
  $input : null,
  $img : null,
  actions : {
    "ready" : "initialize",
    "append" : "initialize"
  },
  events : {
    'click a[data-name="add"]' : "add",
    'click a[data-name="edit"]' : "edit",
    'click a[data-name="remove"]' : "remove",
    'change input[type="file"]' : "change"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-image-uploader");
    this.$input = this.$el.find('input[type="hidden"]');
    this.$img = this.$el.find("img");
    this.o = acf.get_data(this.$el);
  },
  initialize : function() {
    if (this.o.uploader == "basic") {
      this.$el.closest("form").attr("enctype", "multipart/form-data");
    }
  },
  prepare : function(attachment) {
    attachment = attachment || {};
    if (attachment._valid) {
      return attachment;
    }
    var data = {
      url : "",
      alt : "",
      title : "",
      caption : "",
      description : "",
      width : 0,
      height : 0
    };
    if (attachment.id) {
      data = attachment.attributes;
      data.url = acf.maybe_get(data, "sizes." + this.o.preview_size + ".url", data.url);
    }
    data._valid = true;
    return data;
  },
  render : function(data) {
    data = this.prepare(data);
    this.$img.attr({
      src : data.url,
      alt : data.alt,
      title : data.title
    });
    var val = "";
    if (data.id) {
      val = data.id;
    }
    acf.val(this.$input, val);
    if (val) {
      this.$el.addClass("has-value");
    } else {
      this.$el.removeClass("has-value");
    }
  },
  add : function() {
    var self = this;
    var $field = this.$field;
    var $repeater = acf.get_closest_field(this.$field, "repeater");
    var frame = acf.media.popup({
      title : acf._e("image", "select"),
      mode : "select",
      type : "image",
      field : $field.data("key"),
      multiple : $repeater.exists(),
      library : this.o.library,
      mime_types : this.o.mime_types,
      select : function(attachment, i) {
        if (i > 0) {
          var key = $field.data("key");
          var $tr = $field.closest(".acf-row");
          $field = false;
          $tr.nextAll(".acf-row:visible").each(function() {
            $field = acf.get_field(key, $(this));
            if (!$field) {
              return;
            }
            if ($field.find(".acf-image-uploader.has-value").exists()) {
              $field = false;
              return;
            }
            return false;
          });
          if (!$field) {
            $tr = acf.fields.repeater.doFocus($repeater).add();
            if (!$tr) {
              return false;
            }
            $field = acf.get_field(key, $tr);
          }
        }
        self.set("$field", $field).render(attachment);
      }
    });
  },
  edit : function() {
    var self = this;
    var $field = this.$field;
    var val = this.$input.val();
    if (!val) {
      return;
    }
    var frame = acf.media.popup({
      title : acf._e("image", "edit"),
      button : acf._e("image", "update"),
      mode : "edit",
      attachment : val,
      select : function(attachment, i) {
        self.set("$field", $field).render(attachment);
      }
    });
  },
  remove : function() {
    var attachment = {};
    this.render(attachment);
  },
  change : function(e) {
    this.$input.val(e.$el.val());
  }
});

acf.media = acf.model.extend({
  frames : [],
  mime_types : {},
  actions : {
    "ready" : "ready"
  },
  frame : function() {
    var i = this.frames.length - 1;
    if (i < 0) {
      return false;
    }
    return this.frames[i];
  },
  destroy : function(frame) {
    frame.detach();
    frame.dispose();
    frame = null;
    this.frames.pop();
  },
  popup : function(args) {
    var post_id = acf.get("post_id");
    var frame = false;
    if (!$.isNumeric(post_id)) {
      post_id = 0;
    }
    var settings = acf.parse_args(args, {
      mode : "select",
      title : "",
      button : "",
      type : "",
      field : "",
      mime_types : "",
      library : "all",
      multiple : false,
      attachment : 0,
      post_id : post_id,
      select : function() {
      }
    });
    if (settings.id) {
      settings.attachment = settings.id;
    }
    frame = this.new_media_frame(settings);
    this.frames.push(frame);
    setTimeout(function() {
      frame.open();
    }, 1);
    return frame;
  },
  _get_media_frame_settings : function(frame, settings) {
    if (settings.mode === "select") {
      frame = this._get_select_frame_settings(frame, settings);
    } else {
      if (settings.mode === "edit") {
        frame = this._get_edit_frame_settings(frame, settings);
      }
    }
    return frame;
  },
  _get_select_frame_settings : function(frame, settings) {
    if (settings.type) {
      frame.library.type = settings.type;
    }
    if (settings.library === "uploadedTo") {
      frame.library.uploadedTo = settings.post_id;
    }
    frame._button = acf._e("media", "select");
    return frame;
  },
  _get_edit_frame_settings : function(frame, settings) {
    frame.library.post__in = [settings.attachment];
    frame._button = acf._e("media", "update");
    return frame;
  },
  _add_media_frame_events : function(frame, settings) {
    frame.on("open", function() {
      this.$el.closest(".media-modal").addClass("acf-media-modal -" + settings.mode);
    }, frame);
    frame.on("content:render:edit-image", function() {
      var image = this.state().get("image");
      var view = (new wp.media.view.EditImage({
        model : image,
        controller : this
      })).render();
      this.content.set(view);
      view.loadEditor();
    }, frame);
    frame.on("toolbar:create:select", function(toolbar) {
      toolbar.view = new wp.media.view.Toolbar.Select({
        text : frame.options._button,
        controller : this
      });
    }, frame);
    frame.on("select", function() {
      var state = frame.state();
      var image = state.get("image");
      var selection = state.get("selection");
      if (image) {
        settings.select.apply(frame, [image, 0]);
        return;
      }
      if (selection) {
        var i = 0;
        selection.each(function(attachment) {
          settings.select.apply(frame, [attachment, i]);
          i++;
        });
        
      }
    });
    frame.on("close", function() {
      setTimeout(function() {
        acf.media.destroy(frame);
      }, 500);
    });
    if (settings.mode === "select") {
      frame = this._add_select_frame_events(frame, settings);
    } else {
      if (settings.mode === "edit") {
        frame = this._add_edit_frame_events(frame, settings);
      }
    }
    return frame;
  },
  _add_select_frame_events : function(frame, settings) {
    var self = this;
    if (acf.isset(_wpPluploadSettings, "defaults", "multipart_params")) {
      _wpPluploadSettings.defaults.multipart_params._acfuploader = settings.field;
      frame.on("open", function() {
        delete _wpPluploadSettings.defaults.multipart_params._acfuploader;
      });
    }
    frame.on("content:activate:browse", function() {
      try {
        var toolbar = frame.content.get().toolbar;
        var filters = toolbar.get("filters");
        var search = toolbar.get("search");
      } catch (e) {
        return;
      }
      if (settings.type == "image") {
        filters.filters.all.text = acf._e("image", "all");
        delete filters.filters.audio;
        delete filters.filters.video;
        $.each(filters.filters, function(k, filter) {
          if (filter.props.type === null) {
            filter.props.type = "image";
          }
        });
      }
      if (settings.mime_types) {
        var extra_types = settings.mime_types.split(" ").join("").split(".").join("").split(",");
        $.each(extra_types, function(i, type) {
          $.each(self.mime_types, function(t, mime) {
            if (t.indexOf(type) === -1) {
              return;
            }
            var filter = {
              text : type,
              props : {
                status : null,
                type : mime,
                uploadedTo : null,
                orderby : "date",
                order : "DESC"
              },
              priority : 20
            };
            filters.filters[mime] = filter;
          });
        });
      }
      if (settings.library == "uploadedTo") {
        delete filters.filters.unattached;
        delete filters.filters.uploaded;
        filters.$el.parent().append('<span class="acf-uploadedTo">' + acf._e("image", "uploadedTo") + "</span>");
        $.each(filters.filters, function(k, filter) {
          filter.props.uploadedTo = settings.post_id;
        });
      }
      $.each(filters.filters, function(k, filter) {
        filter.props._acfuploader = settings.field;
      });
      search.model.attributes._acfuploader = settings.field;
      if (typeof filters.refresh === "function") {
        filters.refresh();
      }
    });
    return frame;
  },
  _add_edit_frame_events : function(frame, settings) {
    frame.on("open", function() {
      this.$el.closest(".media-modal").addClass("acf-expanded");
      if (this.content.mode() != "browse") {
        this.content.mode("browse");
      }
      var state = this.state();
      var selection = state.get("selection");
      var attachment = wp.media.attachment(settings.attachment);
      selection.add(attachment);
    }, frame);
    return frame;
  },
  new_media_frame : function(settings) {
    var attributes = {
      title : settings.title,
      multiple : settings.multiple,
      library : {},
      states : []
    };
    attributes = this._get_media_frame_settings(attributes, settings);
    var Query = wp.media.query(attributes.library);
    if (acf.isset(Query, "mirroring", "args")) {
      Query.mirroring.args._acfuploader = settings.field;
    }
    attributes.states = [new wp.media.controller.Library({
      library : Query,
      multiple : attributes.multiple,
      title : attributes.title,
      priority : 20,
      filterable : "all",
      editable : true,
      allowLocalEdits : true
    })];
    if (acf.isset(wp, "media", "controller", "EditImage")) {
      attributes.states.push(new wp.media.controller.EditImage);
    }
    var frame = wp.media(attributes);
    frame.acf = settings;
    frame = this._add_media_frame_events(frame, settings);
    return frame;
  },
  ready : function() {
    var version = acf.get("wp_version");
    var browser = acf.get("browser");
    var post_id = acf.get("post_id");
    if (acf.isset(window, "wp", "media", "view", "settings", "post") && $.isNumeric(post_id)) {
      wp.media.view.settings.post.id = post_id;
    }
    if (browser) {
      $("body").addClass("browser-" + browser);
    }
    var major;
    if (version) {
      version = version + "";
      major = version.substr(0, 1);
      $("body").addClass("major-" + major);
    }
    if (acf.isset(window, "wp", "media", "view")) {
      this.customize_Attachment();
      this.customize_AttachmentFiltersAll();
      this.customize_AttachmentCompat();
    }
  },
  customize_Attachment : function() {
    var AttachmentLibrary = wp.media.view.Attachment.Library;
    wp.media.view.Attachment.Library = AttachmentLibrary.extend({
      render : function() {
        var frame = acf.media.frame();
        var errors = acf.maybe_get(this, "model.attributes.acf_errors");
        if (frame && errors) {
          this.$el.addClass("acf-disabled");
        }
        return AttachmentLibrary.prototype.render.apply(this, arguments);
      },
      toggleSelection : function(options) {
        var frame = acf.media.frame();
        var errors = acf.maybe_get(this, "model.attributes.acf_errors");
        var $sidebar = this.controller.$el.find(".media-frame-content .media-sidebar");
        $sidebar.children(".acf-selection-error").remove();
        $sidebar.children().removeClass("acf-hidden");
        if (frame && errors) {
          var filename = acf.maybe_get(this, "model.attributes.filename", "");
          $sidebar.children().addClass("acf-hidden");
          $sidebar.prepend(['<div class="acf-selection-error">', '<span class="selection-error-label">' + acf._e("restricted") + "</span>", '<span class="selection-error-filename">' + filename + "</span>", '<span class="selection-error-message">' + errors + "</span>", "</div>"].join(""));
        }
        AttachmentLibrary.prototype.toggleSelection.apply(this, arguments);
      },
      select : function(model, collection) {
        var frame = acf.media.frame();
        var state = this.controller.state();
        var selection = state.get("selection");
        var errors = acf.maybe_get(this, "model.attributes.acf_errors");
        if (frame && errors) {
          return selection.remove(model);
        }
        return AttachmentLibrary.prototype.select.apply(this, arguments);
      }
    });
  },
  customize_AttachmentFiltersAll : function() {
    wp.media.view.AttachmentFilters.All.prototype.refresh = function() {
      this.$el.html(_.chain(this.filters).map(function(filter, value) {
        return{
          el : $("<option></option>").val(value).html(filter.text)[0],
          priority : filter.priority || 50
        };
      }, this).sortBy("priority").pluck("el").value());
    };
  },
  customize_AttachmentCompat : function() {
    var AttachmentCompat = wp.media.view.AttachmentCompat;
    wp.media.view.AttachmentCompat = AttachmentCompat.extend({
      render : function() {
        var self = this;
        if (this.ignore_render) {
          return this;
        }
        setTimeout(function() {
          var $media_model = self.$el.closest(".media-modal");
          if ($media_model.find(".media-frame-router .acf-expand-details").exists()) {
            return;
          }
          var $a = $(['<a href="#" class="acf-expand-details">', '<span class="is-closed"><span class="acf-icon -left small grey"></span>' + acf._e("expand_details") + "</span>", '<span class="is-open"><span class="acf-icon -right small grey"></span>' + acf._e("collapse_details") + "</span>", "</a>"].join(""));
          $a.on("click", function(e) {
            e.preventDefault();
            if ($media_model.hasClass("acf-expanded")) {
              $media_model.removeClass("acf-expanded");
            } else {
              $media_model.addClass("acf-expanded");
            }
          });
          $media_model.find(".media-frame-router").append($a);
        }, 0);
        clearTimeout(acf.media.render_timout);
        acf.media.render_timout = setTimeout(function() {
          acf.do_action("append", self.$el);
        }, 50);
        return AttachmentCompat.prototype.render.apply(this, arguments);
      },
      dispose : function() {
        acf.do_action("remove", this.$el);
        return AttachmentCompat.prototype.dispose.apply(this, arguments);
      },
      save : function(e) {
        if (e) {
          e.preventDefault();
        }
        var data = acf.serialize_form(this.$el);
        this.ignore_render = true;
        this.model.saveCompat(data);
      }
    });
  }
});

acf.fields.oembed = {
  search : function($el) {
    var s = $el.find('[data-name="search-input"]').val();
    if (s.substr(0, 4) != "http") {
      s = "http://" + s;
      $el.find('[data-name="search-input"]').val(s);
    }
    $el.addClass("is-loading");
    var ajax_data = {
      "action" : "acf/fields/oembed/search",
      "nonce" : acf.get("nonce"),
      "s" : s,
      "width" : acf.get_data($el, "width"),
      "height" : acf.get_data($el, "height")
    };
    if ($el.data("xhr")) {
      $el.data("xhr").abort();
    }
    var xhr = $.ajax({
      url : acf.get("ajaxurl"),
      data : ajax_data,
      type : "post",
      dataType : "html",
      success : function(html) {
        $el.removeClass("is-loading");
        acf.fields.oembed.search_success($el, s, html);
        if (!html) {
          acf.fields.oembed.search_error($el);
        }
      }
    });
    $el.data("xhr", xhr);
  },
  search_success : function($el, s, html) {
    $el.removeClass("has-error").addClass("has-value");
    $el.find('[data-name="value-input"]').val(s);
    $el.find('[data-name="value-title"]').html(s);
    $el.find('[data-name="value-embed"]').html(html);
  },
  search_error : function($el) {
    $el.removeClass("has-value").addClass("has-error");
  },
  clear : function($el) {
    $el.removeClass("has-error has-value");
    $el.find('[data-name="search-input"]').val("");
    $el.find('[data-name="value-input"]').val("");
    $el.find('[data-name="value-title"]').html("");
    $el.find('[data-name="value-embed"]').html("");
  },
  edit : function($el) {
    $el.addClass("is-editing");
    var url = $el.find('[data-name="value-title"]').text();
    $el.find('[data-name="search-input"]').val(url).focus();
  },
  blur : function($el) {
    $el.removeClass("is-editing");
    var old_url = $el.find('[data-name="value-title"]').text();
    var new_url = $el.find('[data-name="search-input"]').val();
    var embed = $el.find('[data-name="value-embed"]').html();
    if (!new_url) {
      this.clear($el);
      return;
    }
    if (new_url == old_url) {
      return;
    }
    this.search($el);
  }
};
doc.on("click", '.acf-oembed [data-name="search-button"]', function(e) {
  e.preventDefault();
  acf.fields.oembed.search($(this).closest(".acf-oembed"));
  $(this).blur();
});
doc.on("click", '.acf-oembed [data-name="clear-button"]', function(e) {
  e.preventDefault();
  acf.fields.oembed.clear($(this).closest(".acf-oembed"));
  $(this).blur();
});
doc.on("click", '.acf-oembed [data-name="value-title"]', function(e) {
  e.preventDefault();
  acf.fields.oembed.edit($(this).closest(".acf-oembed"));
});
doc.on("keypress", '.acf-oembed [data-name="search-input"]', function(e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});
doc.on("keyup", '.acf-oembed [data-name="search-input"]', function(e) {
  if (!$(this).val()) {
    return;
  }
  if (!e.which) {
    return;
  }
  acf.fields.oembed.search($(this).closest(".acf-oembed"));
});
doc.on("blur", '.acf-oembed [data-name="search-input"]', function(e) {
  acf.fields.oembed.blur($(this).closest(".acf-oembed"));
});

acf.fields.radio = acf.field.extend({
  type : "radio",
  $ul : null,
  events : {
    'click input[type="radio"]' : "click"
  },
  focus : function() {
    this.$ul = this.$field.find(".acf-radio-list");
    this.o = acf.get_data(this.$ul);
  },
  click : function(e) {
    var $radio = e.$el;
    var $label = $radio.parent("label");
    var selected = $label.hasClass("selected");
    var val = $radio.val();
    this.$ul.find(".selected").removeClass("selected");
    $label.addClass("selected");
    if (this.o.allow_null && selected) {
      e.$el.prop("checked", false);
      $label.removeClass("selected");
      val = false;
      e.$el.trigger("change");
    }
    if (this.o.other_choice) {
      var $other = this.$ul.find('input[type="text"]');
      if (val === "other") {
        $other.prop("disabled", false).attr("name", $radio.attr("name"));
      } else {
        $other.prop("disabled", true).attr("name", "");
      }
    }
  }
});

acf.select2 = acf.model.extend({
  version : 0,
  actions : {
    "ready 1" : "ready"
  },
  ready : function() {
    if (acf.maybe_get(window, "Select2")) {
      this.version = 3;
      this.l10n_v3();
    } else {
      if (acf.maybe_get(window, "jQuery.fn.select2.amd")) {
        this.version = 4;
      }
    }
  },
  l10n_v3 : function() {
    var locale = acf.get("locale");
    var rtl = acf.get("rtl");
    var l10n = acf._e("select");
    if (!l10n) {
      return;
    }
    var l10n_functions = {
      formatMatches : function(matches) {
        if (1 === matches) {
          return l10n.matches_1;
        }
        return l10n.matches_n.replace("%d", matches);
      },
      formatNoMatches : function() {
        return l10n.matches_0;
      },
      formatAjaxError : function() {
        return l10n.load_fail;
      },
      formatInputTooShort : function(input, min) {
        var number = min - input.length;
        if (1 === number) {
          return l10n.input_too_short_1;
        }
        return l10n.input_too_short_n.replace("%d", number);
      },
      formatInputTooLong : function(input, max) {
        var number = input.length - max;
        if (1 === number) {
          return l10n.input_too_long_1;
        }
        return l10n.input_too_long_n.replace("%d", number);
      },
      formatSelectionTooBig : function(limit) {
        if (1 === limit) {
          return l10n.selection_too_long_1;
        }
        return l10n.selection_too_long_n.replace("%d", limit);
      },
      formatLoadMore : function() {
        return l10n.load_more;
      },
      formatSearching : function() {
        return l10n.searching;
      }
    };
    $.fn.select2.locales = acf.maybe_get(window, "jQuery.fn.select2.locales", {});
    $.fn.select2.locales[locale] = l10n_functions;
    $.extend($.fn.select2.defaults, l10n_functions);
  },
  init : function($select, args) {
    if (!this.version) {
      return;
    }
    args = $.extend({
      allow_null : false,
      placeholder : "",
      multiple : false,
      ajax : false,
      ajax_action : ""
    }, args);
    if (this.version == 3) {
      return this.init_v3($select, args);
    } else {
      if (this.version == 4) {
        return this.init_v4($select, args);
      }
    }
    return false;
  },
  get_data : function($select, data) {
    var self = this;
    data = data || [];
    $select.children().each(function() {
      var $el = $(this);
      if ($el.is("optgroup")) {
        data.push({
          "text" : $el.attr("label"),
          "children" : self.get_data($el)
        });
      } else {
        data.push({
          "id" : $el.attr("value"),
          "text" : $el.text()
        });
      }
    });
    return data;
  },
  decode_data : function(data) {
    if (!data) {
      return[];
    }
    $.each(data, function(k, v) {
      data[k].text = acf.decode(v.text);
      if (typeof v.children !== "undefined") {
        data[k].children = acf.select2.decode_data(v.children);
      }
    });
    return data;
  },
  count_data : function(data) {
    var i = 0;
    if (!data) {
      return i;
    }
    $.each(data, function(k, v) {
      i++;
      if (typeof v.children !== "undefined") {
        i += v.children.length;
      }
    });
    return i;
  },
  get_ajax_data : function(args, params) {
    var data = acf.prepare_for_ajax({
      action : args.ajax_action,
      field_key : args.key,
      post_id : acf.get("post_id"),
      s : params.term,
      paged : params.page
    });
    data = acf.apply_filters("select2_ajax_data", data, args, params);
    return data;
  },
  get_ajax_results : function(data, params) {
    var valid = {
      results : []
    };
    if (!data) {
      data = valid;
    }
    if (typeof data.results == "undefined") {
      valid.results = data;
      data = valid;
    }
    data.results = this.decode_data(data.results);
    data = acf.apply_filters("select2_ajax_results", data, params);
    return data;
  },
  get_value : function($select) {
    var val = [];
    var $selected = $select.find("option:selected");
    if (!$selected.exists()) {
      return val;
    }
    $selected = $selected.sort(function(a, b) {
      return+a.getAttribute("data-i") - +b.getAttribute("data-i");
    });
    $selected.each(function() {
      var $el = $(this);
      val.push({
        "id" : $el.attr("value"),
        "text" : $el.text()
      });
    });
    return val;
  },
  init_v3 : function($select, args) {
    var $input = $select.siblings("input");
    if (!$input.exists()) {
      return;
    }
    var select2_args = {
      width : "100%",
      containerCssClass : "-acf",
      allowClear : args.allow_null,
      placeholder : args.placeholder,
      multiple : args.multiple,
      separator : "||",
      data : [],
      escapeMarkup : function(m) {
        return m;
      },
      formatResult : function(result, container, query, escapeMarkup) {
        var text = $.fn.select2.defaults.formatResult(result, container, query, escapeMarkup);
        if (result.description) {
          text += ' <span class="select2-result-description">' + result.description + "</span>";
        }
        return text;
      }
    };
    var value = this.get_value($select);
    if (args.multiple) {
      var name = $select.attr("name");
      select2_args.formatSelection = function(object, $div) {
        $div.parent().append('<input type="hidden" class="select2-search-choice-hidden" name="' + name + '" value="' + object.id + '" />');
        return object.text;
      };
    } else {
      value = acf.maybe_get(value, 0, "");
    }
    if (args.allow_null) {
      $select.find('option[value=""]').remove();
    }
    select2_args.data = this.get_data($select);
    select2_args.initSelection = function(element, callback) {
      callback(value);
    };
    if (args.ajax) {
      select2_args.ajax = {
        url : acf.get("ajaxurl"),
        dataType : "json",
        type : "post",
        cache : false,
        quietMillis : 250,
        data : function(term, page) {
          var params = {
            "term" : term,
            "page" : page
          };
          return acf.select2.get_ajax_data(args, params);
        },
        results : function(data, page) {
          var params = {
            "page" : page
          };
          setTimeout(function() {
            acf.select2.merge_results_v3();
          }, 1);
          return acf.select2.get_ajax_results(data, params);
        }
      };
    }
    select2_args.dropdownCss = {
      "z-index" : "999999999"
    };
    select2_args.acf = args;
    select2_args = acf.apply_filters("select2_args", select2_args, $select, args);
    $input.select2(select2_args);
    var $container = $input.select2("container");
    $container.before($select);
    $container.before($input);
    if (args.multiple) {
      $container.find("ul.select2-choices").sortable({
        start : function() {
          $input.select2("onSortStart");
        },
        stop : function() {
          $input.select2("onSortEnd");
        }
      });
    }
    $select.prop("disabled", true).addClass("acf-disabled acf-hidden");
    $input.on("change", function(e) {
      if (e.added) {
        $select.append('<option value="' + e.added.id + '">' + e.added.text + "</option>");
      }
      $select.val(e.val);
    });
  },
  merge_results_v3 : function() {
    var label = "";
    var $list = null;
    $("#select2-drop .select2-result-with-children").each(function() {
      var $label = $(this).children(".select2-result-label");
      var $ul = $(this).children(".select2-result-sub");
      if ($label.text() == label) {
        $list.append($ul.children());
        $(this).remove();
        return;
      }
      label = $label.text();
      $list = $ul;
    });
  },
  init_v4 : function($select, args) {
    var $input = $select.siblings("input");
    if (!$input.exists()) {
      return;
    }
    var select2_args = {
      width : "100%",
      allowClear : args.allow_null,
      placeholder : args.placeholder,
      multiple : args.multiple,
      separator : "||",
      data : [],
      escapeMarkup : function(m) {
        return m;
      }
    };
    var value = this.get_value($select);
    if (args.multiple) {
    } else {
      value = acf.maybe_get(value, 0, "");
    }
    if (args.allow_null) {
      $select.find('option[value=""]').remove();
    }
    select2_args.data = this.get_data($select);
    if (!args.ajax) {
      $select.removeData("ajax");
      $select.removeAttr("data-ajax");
    } else {
      select2_args.ajax = {
        url : acf.get("ajaxurl"),
        delay : 250,
        dataType : "json",
        type : "post",
        cache : false,
        data : function(params) {
          return acf.select2.get_ajax_data(args, params);
        },
        processResults : function(data, params) {
          var results = acf.select2.get_ajax_results(data, params);
          if (results.more) {
            results.pagination = {
              more : true
            };
          }
          setTimeout(function() {
            acf.select2.merge_results_v4();
          }, 1);
          return results;
        }
      };
    }
    select2_args = acf.apply_filters("select2_args", select2_args, $select, args);
    var $container = $select.select2(select2_args);
    $container.addClass("-acf");
  },
  merge_results_v4 : function() {
    var $prev_options = null;
    var $prev_group = null;
    $('.select2-results__option[role="group"]').each(function() {
      var $options = $(this).children("ul");
      var $group = $(this).children("strong");
      if ($prev_group !== null && $group.text() == $prev_group.text()) {
        $prev_options.append($options.children());
        $(this).remove();
        return;
      }
      $prev_options = $options;
      $prev_group = $group;
    });
  },
  destroy : function($select) {
    $select.siblings(".select2-container").remove();
    $select.siblings("input").show();
    $select.prop("disabled", false).removeClass("acf-disabled acf-hidden");
  }
});
acf.add_select2 = function($select, args) {
  acf.select2.init($select, args);
};
acf.remove_select2 = function($select) {
  acf.select2.destroy($select);
};
acf.fields.select = acf.field.extend({
  type : "select",
  $select : null,
  actions : {
    "ready" : "render",
    "append" : "render",
    "remove" : "remove"
  },
  focus : function() {
    this.$select = this.$field.find("select");
    if (!this.$select.exists()) {
      return;
    }
    this.o = acf.get_data(this.$select);
    this.o = acf.parse_args(this.o, {
      "ajax_action" : "acf/fields/" + this.type + "/query",
      "key" : this.$field.data("key")
    });
  },
  render : function() {
    if (!this.$select.exists() || !this.o.ui) {
      return false;
    }
    acf.select2.init(this.$select, this.o);
  },
  remove : function() {
    if (!this.$select.exists() || !this.o.ui) {
      return false;
    }
    acf.select2.destroy(this.$select);
  }
});
acf.fields.user = acf.fields.select.extend({
  type : "user"
});
acf.fields.post_object = acf.fields.select.extend({
  type : "post_object"
});
acf.fields.page_link = acf.fields.select.extend({
  type : "page_link"
});

acf.fields.time_picker = acf.field.extend({
  type : "time_picker",
  $el : null,
  $input : null,
  $hidden : null,
  o : {},
  actions : {
    "ready" : "initialize",
    "append" : "initialize"
  },
  events : {
    'blur input[type="text"]' : "blur"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-time-picker");
    this.$input = this.$el.find('input[type="text"]');
    this.$hidden = this.$el.find('input[type="hidden"]');
    this.o = acf.get_data(this.$el);
  },
  initialize : function() {
    var args = {
      timeFormat : this.o.time_format,
      altField : this.$hidden,
      altFieldTimeOnly : false,
      altTimeFormat : "HH:mm:ss",
      showButtonPanel : true,
      controlType : "select",
      oneLine : true
    };
    args = acf.apply_filters("time_picker_args", args, this.$field);
    this.$input.addClass("active").timepicker(args);
    if ($("body > #ui-datepicker-div").exists()) {
      $("body > #ui-datepicker-div").wrap('<div class="acf-ui-datepicker" />');
    }
  },
  blur : function() {
    if (!this.$input.val()) {
      this.$hidden.val("");
    }
  }
});

acf.fields.taxonomy = acf.field.extend({
  type : "taxonomy",
  $el : null,
  actions : {
    "ready" : "render",
    "append" : "render",
    "remove" : "remove"
  },
  events : {
    'click a[data-name="add"]' : "add_term"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-taxonomy-field");
    this.o = acf.get_data(this.$el);
    this.o.key = this.$field.data("key");
  },
  render : function() {
    var $select = this.$field.find("select");
    if (!$select.exists()) {
      return;
    }
    var args = acf.get_data($select);
    args = acf.parse_args(args, {
      "pagination" : true,
      "ajax_action" : "acf/fields/taxonomy/query",
      "key" : this.o.key
    });
    acf.select2.init($select, args);
  },
  remove : function() {
    var $select = this.$field.find("select");
    if (!$select.exists()) {
      return false;
    }
    acf.select2.destroy($select);
  },
  add_term : function(e) {
    var self = this;
    acf.open_popup({
      title : e.$el.attr("title") || e.$el.data("title"),
      loading : true,
      height : 220
    });
    var ajax_data = acf.prepare_for_ajax({
      action : "acf/fields/taxonomy/add_term",
      field_key : this.o.key
    });
    $.ajax({
      url : acf.get("ajaxurl"),
      data : ajax_data,
      type : "post",
      dataType : "html",
      success : function(html) {
        self.add_term_confirm(html);
      }
    });
  },
  add_term_confirm : function(html) {
    var self = this;
    acf.update_popup({
      content : html
    });
    $('#acf-popup input[name="term_name"]').focus();
    $("#acf-popup form").on("submit", function(e) {
      e.preventDefault();
      self.add_term_submit($(this));
    });
  },
  add_term_submit : function($form) {
    var self = this;
    var $submit = $form.find(".acf-submit");
    var $name = $form.find('input[name="term_name"]');
    var $parent = $form.find('select[name="term_parent"]');
    if ($name.val() === "") {
      $name.focus();
      return false;
    }
    $submit.find("button").attr("disabled", "disabled");
    $submit.find(".acf-spinner").addClass("is-active");
    var ajax_data = acf.prepare_for_ajax({
      action : "acf/fields/taxonomy/add_term",
      field_key : this.o.key,
      term_name : $name.val(),
      term_parent : $parent.exists() ? $parent.val() : 0
    });
    $.ajax({
      url : acf.get("ajaxurl"),
      data : ajax_data,
      type : "post",
      dataType : "json",
      success : function(json) {
        var message = acf.get_ajax_message(json);
        if (acf.is_ajax_success(json)) {
          $name.val("");
          self.append_new_term(json.data);
        }
        if (message.text) {
          $submit.find("span").html(message.text);
        }
      },
      complete : function() {
        $submit.find("button").removeAttr("disabled");
        $submit.find(".acf-spinner").removeClass("is-active");
        $submit.find("span").delay(1500).fadeOut(250, function() {
          $(this).html("");
          $(this).show();
        });
        $name.focus();
      }
    });
  },
  append_new_term : function(term) {
    var item = {
      id : term.term_id,
      text : term.term_label
    };
    $('.acf-taxonomy-field[data-taxonomy="' + this.o.taxonomy + '"]').each(function() {
      var type = $(this).data("type");
      if (type == "radio" || type == "checkbox") {
      } else {
        return;
      }
      var $hidden = $(this).children('input[type="hidden"]');
      var $ul = $(this).find("ul:first");
      var name = $hidden.attr("name");
      if (type == "checkbox") {
        name += "[]";
      }
      var $li = $(['<li data-id="' + term.term_id + '">', "<label>", '<input type="' + type + '" value="' + term.term_id + '" name="' + name + '" /> ', "<span>" + term.term_label + "</span>", "</label>", "</li>"].join(""));
      if (term.term_parent) {
        var $parent = $ul.find('li[data-id="' + term.term_parent + '"]');
        $ul = $parent.children("ul");
        if (!$ul.exists()) {
          $ul = $('<ul class="children acf-bl"></ul>');
          $parent.append($ul);
        }
      }
      $ul.append($li);
    });
    $("#acf-popup #term_parent").each(function() {
      var $option = $('<option value="' + term.term_id + '">' + term.term_label + "</option>");
      if (term.term_parent) {
        $(this).children('option[value="' + term.term_parent + '"]').after($option);
      } else {
        $(this).append($option);
      }
    });
    switch(this.o.type) {
      case "select":
        this.$el.children("input").select2("data", item);
        break;
      case "multi_select":
        var $input = this.$el.children("input");
        var value = $input.select2("data") || [];
        value.push(item);
        $input.select2("data", value);
        break;
      case "checkbox":
      case "radio":
        var $holder = this.$el.find(".categorychecklist-holder");
        var $li$$0 = $holder.find('li[data-id="' + term.term_id + '"]');
        var offet = $holder.get(0).scrollTop + ($li$$0.offset().top - $holder.offset().top);
        $li$$0.find("input").prop("checked", true);
        $holder.animate({
          scrollTop : offet
        }, "250");
        break;
    }
  }
});

acf.validation = acf.model.extend({
  actions : {
    "ready" : "ready",
    "append" : "ready"
  },
  filters : {
    "validation_complete" : "validation_complete"
  },
  events : {
    "click #save-post" : "click_ignore",
    'click [type="submit"]' : "click_publish",
    "submit form" : "submit_form",
    "click .acf-error-message a" : "click_message"
  },
  active : 1,
  ignore : 0,
  busy : 0,
  valid : true,
  errors : [],
  error_class : "acf-error",
  message_class : "acf-error-message",
  $trigger : null,
  ready : function($el) {
    $el.find(".acf-field input").filter('[type="number"], [type="email"], [type="url"]').on("invalid", function(e) {
      e.preventDefault();
      acf.validation.errors.push({
        input : $(this).attr("name"),
        message : e.target.validationMessage
      });
      acf.validation.fetch($(this).closest("form"));
    });
  },
  validation_complete : function(json, $form) {
    if (!this.errors.length) {
      return json;
    }
    json.valid = 0;
    json.errors = json.errors || [];
    var inputs = [];
    if (json.errors.length) {
      for (i in json.errors) {
        inputs.push(json.errors[i].input);
      }
    }
    if (this.errors.length) {
      for (i in this.errors) {
        var error = this.errors[i];
        if ($.inArray(error.input, inputs) !== -1) {
          continue;
        }
        json.errors.push(error);
      }
    }
    this.errors = [];
    return json;
  },
  click_message : function(e) {
    e.preventDefault();
    acf.remove_el(e.$el.parent());
  },
  click_ignore : function(e) {
    this.ignore = 1;
    this.$trigger = e.$el;
  },
  click_publish : function(e) {
    this.$trigger = e.$el;
  },
  submit_form : function(e) {
    if (!this.active) {
      return true;
    }
    if (this.ignore) {
      this.ignore = 0;
      return true;
    }
    if (!e.$el.find("#acf-form-data").exists()) {
      return true;
    }
    var $preview = e.$el.find("#wp-preview");
    if ($preview.exists() && $preview.val()) {
      this.toggle(e.$el, "unlock");
      return true;
    }
    e.preventDefault();
    this.fetch(e.$el);
  },
  toggle : function($form, state) {
    state = state || "unlock";
    var $submit = null;
    var $spinner = null;
    var $parent = $("#submitdiv");
    if (!$parent.exists()) {
      $parent = $("#submitpost");
    }
    if (!$parent.exists()) {
      $parent = $form.find("p.submit").last();
    }
    if (!$parent.exists()) {
      $parent = $form.find(".acf-form-submit");
    }
    if (!$parent.exists()) {
      $parent = $form;
    }
    $submit = $parent.find('input[type="submit"], .button');
    $spinner = $parent.find(".spinner, .acf-spinner");
    this.hide_spinner($spinner);
    if (state == "unlock") {
      this.enable_submit($submit);
    } else {
      if (state == "lock") {
        this.disable_submit($submit);
        this.show_spinner($spinner.last());
      }
    }
  },
  fetch : function($form) {
    if (this.busy) {
      return false;
    }
    var self = this;
    var data = acf.serialize_form($form);
    data.action = "acf/validate_save_post";
    this.busy = 1;
    this.toggle($form, "lock");
    $.ajax({
      url : acf.get("ajaxurl"),
      data : data,
      type : "post",
      dataType : "json",
      success : function(json) {
        if (!acf.is_ajax_success(json)) {
          return;
        }
        self.fetch_success($form, json.data);
      },
      complete : function() {
        self.fetch_complete($form);
      }
    });
  },
  fetch_complete : function($form) {
    this.busy = 0;
    this.toggle($form, "unlock");
    if (!this.valid) {
      return;
    }
    this.ignore = 1;
    var $message = $form.children(".acf-error-message");
    if ($message.exists()) {
      $message.addClass("-success");
      $message.children("p").html(acf._e("validation_successful"));
      setTimeout(function() {
        acf.remove_el($message);
      }, 2E3);
    }
    $form.find(".acf-postbox.acf-hidden").remove();
    acf.do_action("submit", $form);
    if (this.$trigger) {
      this.$trigger.click();
    } else {
      $form.submit();
    }
    this.toggle($form, "lock");
  },
  fetch_success : function($form, json) {
    json = acf.apply_filters("validation_complete", json, $form);
    if (!json || (json.valid || !json.errors)) {
      this.valid = true;
      return;
    }
    this.valid = false;
    this.$trigger = null;
    var $scrollTo = null;
    var count = 0;
    var message = acf._e("validation_failed");
    if (json.errors && json.errors.length > 0) {
      var i;
      for (i in json.errors) {
        var error = json.errors[i];
        if (!error.input) {
          message += ". " + error.message;
          continue;
        }
        var $input = $form.find('[name="' + error.input + '"]').first();
        if (!$input.exists()) {
          $input = $form.find('[name^="' + error.input + '"]').first();
        }
        if (!$input.exists()) {
          continue;
        }
        count++;
        var $field = acf.get_field_wrap($input);
        this.add_error($field, error.message);
        if ($scrollTo === null) {
          $scrollTo = $field;
        }
      }
      if (count == 1) {
        message += ". " + acf._e("validation_failed_1");
      } else {
        if (count > 1) {
          message += ". " + acf._e("validation_failed_2").replace("%d", count);
        }
      }
    }
    var $message = $form.children(".acf-error-message");
    if (!$message.exists()) {
      $message = $('<div class="acf-error-message"><p></p><a href="#" class="acf-icon -cancel small"></a></div>');
      $form.prepend($message);
    }
    $message.children("p").html(message);
    if ($scrollTo === null) {
      $scrollTo = $message;
    }
    setTimeout(function() {
      $("html, body").animate({
        scrollTop : $scrollTo.offset().top - win.height() / 2
      }, 500);
    }, 1);
  },
  add_error : function($field, message) {
    var self = this;
    $field.addClass(this.error_class);
    if (message !== undefined) {
      $field.children(".acf-input").children("." + this.message_class).remove();
      $field.children(".acf-input").prepend('<div class="' + this.message_class + '"><p>' + message + "</p></div>");
    }
    var event = function() {
      self.remove_error($field);
      $field.off("focus change", "input, textarea, select", event);
    };
    $field.on("focus change", "input, textarea, select", event);
    acf.do_action("add_field_error", $field);
  },
  remove_error : function($field) {
    var $message = $field.children(".acf-input").children("." + this.message_class);
    $field.removeClass(this.error_class);
    setTimeout(function() {
      acf.remove_el($message);
    }, 250);
    acf.do_action("remove_field_error", $field);
  },
  add_warning : function($field, message) {
    this.add_error($field, message);
    setTimeout(function() {
      acf.validation.remove_error($field);
    }, 1E3);
  },
  show_spinner : function($spinner) {
    if (!$spinner.exists()) {
      return;
    }
    var wp_version = acf.get("wp_version");
    if (parseFloat(wp_version) >= 4.2) {
      $spinner.addClass("is-active");
    } else {
      $spinner.css("display", "inline-block");
    }
  },
  hide_spinner : function($spinner) {
    if (!$spinner.exists()) {
      return;
    }
    var wp_version = acf.get("wp_version");
    if (parseFloat(wp_version) >= 4.2) {
      $spinner.removeClass("is-active");
    } else {
      $spinner.css("display", "none");
    }
  },
  disable_submit : function($submit) {
    if (!$submit.exists()) {
      return;
    }
    $submit.addClass("disabled button-disabled button-primary-disabled");
  },
  enable_submit : function($submit) {
    if (!$submit.exists()) {
      return;
    }
    $submit.removeClass("disabled button-disabled button-primary-disabled");
  }
});

acf.fields.gallery = acf.field.extend({
  type : "gallery",
  $el : null,
  $main : null,
  $side : null,
  $attachments : null,
  $input : null,
  actions : {
    "ready" : "initialize",
    "append" : "initialize",
    "submit" : "close_sidebar",
    "show" : "resize"
  },
  events : {
    "click .acf-gallery-attachment" : "_select",
    "click .acf-gallery-add" : "_add",
    "click .acf-gallery-remove" : "_remove",
    "click .acf-gallery-close" : "_close",
    "change .acf-gallery-sort" : "_sort",
    "click .acf-gallery-edit" : "_edit",
    "click .acf-gallery-update" : "_update",
    "change .acf-gallery-side input" : "_update",
    "change .acf-gallery-side textarea" : "_update",
    "change .acf-gallery-side select" : "_update"
  },
  focus : function() {
    this.$el = this.$field.find(".acf-gallery:first");
    this.$main = this.$el.children(".acf-gallery-main");
    this.$side = this.$el.children(".acf-gallery-side");
    this.$attachments = this.$main.children(".file-uploaded-images");
    this.$input = this.$el.find("input:first");
    this.o = acf.get_data(this.$el);
    this.o.min = this.o.min || 0;
    this.o.max = this.o.max || 0;
  },
  initialize : function() {
    var self = this;
    var $field = this.$field;
    this.$attachments.unbind("sortable").sortable({
      items : ".acf-gallery-attachment",
      forceHelperSize : true,
      forcePlaceholderSize : true,
      scroll : true,
      start : function(event, ui) {
        ui.placeholder.html(ui.item.html());
        ui.placeholder.removeAttr("style");
        acf.do_action("sortstart", ui.item, ui.placeholder);
      },
      stop : function(event, ui) {
        acf.do_action("sortstop", ui.item, ui.placeholder);
      }
    });
    this.$el.unbind("resizable").resizable({
      handles : "s",
      minHeight : 200,
      stop : function(event, ui) {
        acf.update_user_setting("gallery_height", ui.size.height);
      }
    });
    win.on("resize", function() {
      self.set("$field", $field).resize();
    });
    this.render();
    this.resize();
  },
  resize : function() {
    var min = 100;
    var max = 175;
    var columns = 4;
    var width = this.$el.width();
    var i = 4;
    for (;i < 20;i++) {
      var w = width / i;
      if (min < w && w < max) {
        columns = i;
        break;
      }
    }
    columns = Math.min(columns, 8);
    this.$el.attr("data-columns", columns);
  },
  render : function() {
    var $select = this.$main.find(".acf-gallery-sort");
    var $a = this.$main.find(".acf-gallery-add");
    if (this.o.max > 0 && this.count() >= this.o.max) {
      $a.addClass("disabled");
    } else {
      $a.removeClass("disabled");
    }
    if (!this.count()) {
      $select.addClass("disabled");
    } else {
      $select.removeClass("disabled");
    }
  },
  open_sidebar : function() {
    this.$el.addClass("sidebar-open");
    this.$main.find(".acf-gallery-sort").hide();
    var width = this.$el.width() / 3;
    width = parseInt(width);
    width = Math.max(width, 350);
    this.$side.children(".acf-gallery-side-inner").css({
      "width" : width - 1
    });
    this.$side.animate({
      "width" : width - 1
    }, 250);
    this.$main.animate({
      "right" : width
    }, 250);
  },
  _close : function(e) {
    this.close_sidebar();
  },
  close_sidebar : function() {
    this.$el.removeClass("sidebar-open");
    var $select = this.$el.find(".acf-gallery-sort");
    this.get_attachment("active").removeClass("active");
    this.$side.find("input, textarea, select").attr("disabled", "disabled");
    this.$main.animate({
      right : 0
    }, 250);
    this.$side.animate({
      width : 0
    }, 250, function() {
      $select.show();
      $(this).find(".acf-gallery-side-data").html("");
    });
  },
  count : function() {
    return this.get_attachments().length;
  },
  get_attachments : function() {
    return this.$attachments.children(".acf-gallery-attachment");
  },
  get_attachment : function(s) {
    s = s || 0;
    if (s === "active") {
      s = ".active";
    } else {
      s = '[data-id="' + s + '"]';
    }
    return this.$attachments.children(".acf-gallery-attachment" + s);
  },
  render_attachment : function(data) {
    data = this.prepare(data);
    var $attachment = this.get_attachment(data.id);
    var $margin = $attachment.find(".margin");
    var $img = $attachment.find("img");
    var $filename = $attachment.find(".filename");
    var $input = $attachment.find('input[type="hidden"]');
    var thumbnail = data.url;
    if (data.type == "image") {
      $filename.remove();
    } else {
      thumbnail = acf.maybe_get(data, "thumb.src");
      $filename.text(data.filename);
    }
    if (!thumbnail) {
      thumbnail = acf._e("media", "default_icon");
      $attachment.addClass("-icon");
    }
    $img.attr({
      "src" : thumbnail,
      "alt" : data.alt,
      "title" : data.title
    });
    acf.val($input, data.id);
  },
  _add : function(e) {
    if (this.o.max > 0 && this.count() >= this.o.max) {
      acf.validation.add_warning(this.$field, acf._e("gallery", "max"));
      return;
    }
    var self = this;
    var $field = this.$field;
    var frame = acf.media.popup({
      title : acf._e("gallery", "select"),
      mode : "select",
      type : "",
      field : this.$field.data("key"),
      multiple : "add",
      library : this.o.library,
      mime_types : this.o.mime_types,
      select : function(attachment, i) {
        self.set("$field", $field).add_attachment(attachment, i);
      }
    });
    frame.on("content:activate:browse", function() {
      self.render_collection(frame);
      frame.content.get().collection.on("reset add", function() {
        self.render_collection(frame);
      });
    });
  },
  add_attachment : function(data, i) {
    i = i || 0;
    data = this.prepare(data);
    if (this.o.max > 0 && this.count() >= this.o.max) {
      return;
    }
    if (this.get_attachment(data.id).exists()) {
      return;
    }
    var name = this.$el.find('input[type="hidden"]:first').attr("name");
    var html = [
      '<div class="acf-gallery-attachment image" data-id="' + data.id + '">',
      '<input type="hidden" value="' + data.id + '" name="' + name + '[]">',
      '<figure>',
      '<a href="#" class="acf-gallery-remove" data-id="' + data.id + '"><i class="fa fa-close"></i></a>',
      "</figure>",
      '<img src="" alt="">',
      "</div>"].join("");
    var $html = $(html);
    this.$attachments.append($html);
    if (this.o.insert === "prepend") {
      var $before = this.$attachments.children(":eq(" + i + ")");
      if ($before.exists()) {
        $before.before($html);
      }
    }
    this.render_attachment(data);
    this.render();
    this.$input.trigger("change");
  },
  _select : function(e) {
    var id = e.$el.data("id");
    this.select_attachment(id);
  },
  select_attachment : function(id) {
    var $attachment = this.get_attachment(id);
    if ($attachment.hasClass("active")) {
      return;
    }
    this.get_attachment("active").removeClass("active");
    $attachment.addClass("active");
    this.fetch(id);
    this.open_sidebar();
  },
  prepare : function(attachment) {
    attachment = attachment || {};
    if (attachment._valid) {
      return attachment;
    }
    var data = {
      id : "",
      url : "",
      alt : "",
      title : "",
      filename : ""
    };
    if (attachment.id) {
      data = attachment.attributes;
      data.url = acf.maybe_get(data, "sizes.medium.url", data.url);
    }
    data._valid = true;
    return data;
  },
  fetch : function(id) {
    var data = acf.prepare_for_ajax({
      action : "acf/fields/gallery/get_attachment",
      field_key : this.$field.data("key"),
      nonce : acf.get("nonce"),
      post_id : acf.get("post_id"),
      id : id
    });
    if (this.$el.data("xhr")) {
      this.$el.data("xhr").abort();
    }
    if (typeof id === "string" && id.indexOf("_") === 0) {
      var val = this.get_attachment(id).find('input[type="hidden"]').val();
      val = $.parseJSON(val);
      data.attachment = val;
    }
    var xhr = $.ajax({
      url : acf.get("ajaxurl"),
      dataType : "html",
      type : "post",
      cache : false,
      data : data,
      context : this,
      success : this.fetch_success
    });
    this.$el.data("xhr", xhr);
  },
  fetch_success : function(html) {
    if (!html) {
      return;
    }
    var $side = this.$side.find(".acf-gallery-side-data");
    $side.html(html);
    $side.find(".compat-field-acf-form-data").remove();
    var $tr = $side.find("> .compat-attachment-fields > tbody > tr").detach();
    $side.find("> table.form-table > tbody").append($tr);
    $side.find("> .compat-attachment-fields").remove();
    acf.do_action("append", $side);
  },
  _sort : function(e) {
    var sort = e.$el.val();
    if (!sort) {
      return;
    }
    var data = acf.prepare_for_ajax({
      action : "acf/fields/gallery/get_sort_order",
      field_key : this.$field.data("key"),
      post_id : acf.get("post_id"),
      ids : [],
      sort : sort
    });
    this.get_attachments().each(function() {
      var id = $(this).attr("data-id");
      if (!id) {
        return;
      }
      data.ids.push(id);
    });
    var xhr = $.ajax({
      url : acf.get("ajaxurl"),
      dataType : "json",
      type : "post",
      cache : false,
      data : data,
      context : this,
      success : this._sort_success
    });
  },
  _sort_success : function(json) {
    if (!acf.is_ajax_success(json)) {
      return;
    }
    json.data.reverse();
    for (i in json.data) {
      var id = json.data[i];
      var $attachment = this.get_attachment(id);
      this.$attachments.prepend($attachment);
    }
  },
  _update : function() {
    var $submit = this.$side.find(".acf-gallery-update");
    var $edit = this.$side.find(".acf-gallery-edit");
    var $form = this.$side.find(".acf-gallery-side-data");
    var id = $edit.data("id");
    var data = acf.serialize_form($form);
    if ($submit.attr("disabled")) {
      return false;
    }
    $submit.attr("disabled", "disabled");
    $submit.before('<i class="acf-loading"></i>');
    data.action = "acf/fields/gallery/update_attachment";
    acf.prepare_for_ajax(data);
    $.ajax({
      url : acf.get("ajaxurl"),
      data : data,
      type : "post",
      dataType : "json",
      complete : function(json) {
        $submit.removeAttr("disabled");
        $submit.prev(".acf-loading").remove();
      }
    });
  },
  _remove : function(e) {
    e.stopPropagation();
    var id = e.$el.data("id");
    this.remove_attachment(id);
  },
  remove_attachment : function(id) {
    this.close_sidebar();
    this.get_attachment(id).remove();
    this.render();
    this.$input.trigger("change");
  },
  _edit : function(e) {
    var id = e.$el.data("id");
    this.edit_attachment(id);
  },
  edit_attachment : function(id) {
    var self = this;
    var $field = this.$field;
    var frame = acf.media.popup({
      mode : "edit",
      title : acf._e("image", "edit"),
      button : acf._e("image", "update"),
      attachment : id,
      select : function(attachment) {
        self.set("$field", $field).render_attachment(attachment);
        self.fetch(id);
      }
    });
  },
  render_collection : function(frame) {
    var self = this;
    setTimeout(function() {
      var $content = frame.content.get().$el;
      collection = frame.content.get().collection || null;
      if (collection) {
        var i = -1;
        collection.each(function(item) {
          i++;
          var $li = $content.find(".attachments > .attachment:eq(" + i + ")");
          if (self.get_attachment(item.id).exists()) {
            item.off("selection:single");
            $li.addClass("acf-selected");
          }
        });
      }
    }, 10);
  }
});

module.exports = acf;

function non_anon_action(value, options) {
  console.info("This init 'non_anon_action'");
}
Hooks.addAction("init", non_anon_action);