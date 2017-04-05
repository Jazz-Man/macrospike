(function (M) {
  
  var active;
  
  M.component('autocomplete', {
    
    defaults: {
      minLength: 1,
      param: 'search',
      method: 'get',
      delay: 300,
      loadingClass: 'uk-loading',
      skipClass: 'disabled',
      source: null,
      renderer: null,
      
      template: '{{~items}}<a class="dropdown-item" data-value="{{$item.value}}">{{$item.value}}</a>{{/items}}'
    },
    
    visible  : false,
    value    : null,
    selected : null,
    
    boot: function() {
      
      // init code
      M.$html.on('focus.autocomplete.mdb keyup.autocomplete.mdb', '[data-mdb-autocomplete]', function(e) {
        
        var ele = M.$(this);
        
        if (!ele.data('autocomplete')) {
          M.autocomplete(ele, M.Utils.options(ele.attr('data-mdb-autocomplete')));
        }
      });
      
      // register outer click for autocompletes
      M.$html.on('click.autocomplete.mdb', function(e) {
        if (active && e.target!=active.input[0]) {
          active.hide();
        }
      });
    },
    
    init: function() {
      
      var $this   = this,
        select  = false,
        trigger = M.Utils.debounce(function(e) {
          
          if (select) {
            return (select = false);
          }
          
          $this.handle();
        }, this.options.delay);
      
      
      this.dropdown = this.find('.dropdown-menu');
      this.template = this.find('script[type="text/autocomplete"]').html();
      this.template = M.Utils.template(this.template || this.options.template);
      this.input    = this.find("input:first").attr("autocomplete", "off");
      
      if (!this.dropdown.length) {
        this.dropdown = M.$('<div class="dropdown-menu"></div>').appendTo(this.element);
      }
      
      
      this.input.on({
        
        keydown: function(e) {
          if (e && e.which && !e.shiftKey && $this.visible) {
            
            switch (e.which) {
              case 13: // enter
                select = true;
                
                if ($this.selected) {
                  e.preventDefault();
                  $this.select();
                }
                break;
              case 38: // up
                e.preventDefault();
                $this.pick('prev', true);
                break;
              case 40: // down
                e.preventDefault();
                $this.pick('next', true);
                break;
              case 27:
              case 9: // esc, tab
                $this.hide();
                break;
              default:
                break;
            }
          }
          
        },
        
        keyup: trigger
      });
      
      this.dropdown.on('click', '.dropdown-item', function(e){
        $this.select();
      });
      
      this.dropdown.on('mouseover', '.dropdown-item', function(){
        $this.pick(M.$(this));
      });
      
      this.triggercomplete = trigger;
    },
    
    handle: function() {
      
      var $this = this, old = this.value;
      
      this.value = this.input.val();
      
      if (this.value.length < this.options.minLength) {
        return this.hide();
      }
      
      if (this.value != old) {
        $this.request();
      }
      
      return this;
    },
    
    pick: function(item, scrollinview) {
      
      var $this    = this,
        items    = M.$(this.dropdown.find('.dropdown-item')),
        selected = false;
      
      if (typeof item !== "string" && !item.hasClass(this.options.skipClass)) {
        selected = item;
      } else if (item == 'next' || item == 'prev') {
        
        if (this.selected) {
          var index = items.index(this.selected);
          
          if (item == 'next') {
            selected = items.eq(index + 1 < items.length ? index + 1 : 0);
          } else {
            selected = items.eq(index - 1 < 0 ? items.length - 1 : index - 1);
          }
          
        } else {
          selected = items[(item == 'next') ? 'first' : 'last']();
        }
        
        selected = M.$(selected);
      }
      if (selected && selected.length) {
        this.selected = selected;
        
        // jump to selected if not in view
        if (scrollinview) {
          
          var top       = selected.position().top,
            scrollTop = $this.dropdown.scrollTop(),
            dpheight  = $this.dropdown.height();
          
          if (top > dpheight ||  top < 0) {
            $this.dropdown.scrollTop(scrollTop + top);
          }
        }
      }
    },
    
    select: function() {
      
      if(!this.selected) {
        return;
      }
      
      var data = this.selected.data();
      
      this.trigger('selectitem.mdb.autocomplete', [data, this]);
      
      if (data.value) {
        this.input.val(data.value).trigger('change');
      }
      
      this.hide();
    },
    
    show: function() {
      
      if (this.visible) {
        return;
      }
      
      this.visible = true;
      this.element.addClass('show');
      
      if (active && active!==this) {
        active.hide();
      }
      
      active = this;
      
      // Update aria
      this.dropdown.attr('aria-expanded', 'true');
      
      return this;
    },
    
    hide: function() {
      if (!this.visible) {
        return;
      }
      this.visible = false;
      this.element.removeClass('show');
      
      if (active === this) {
        active = false;
      }
      
      // Update aria
      this.dropdown.attr('aria-expanded', 'false');
      
      return this;
    },
    
    request: function() {
      
      var $this   = this,
        release = function(data) {
          
          if(data) {
            $this.render(data);
          }
          
          $this.element.removeClass($this.options.loadingClass);
        };
      
      this.element.addClass(this.options.loadingClass);
      
      if (this.options.source) {
        
        var source = this.options.source;
        
        switch(typeof(this.options.source)) {
          case 'function':
            
            this.options.source.apply(this, [release]);
            
            break;
          
          case 'object':
            
            if(source.length) {
              
              var items = [];
              
              source.forEach(function(item){
                if(item.value && item.value.toLowerCase().indexOf($this.value.toLowerCase())!=-1) {
                  items.push(item);
                }
              });
              
              release(items);
            }
            
            break;
          
          case 'string':
            
            var params ={};
            
            params[this.options.param] = this.value;
            
            M.$.ajax({
              url: this.options.source,
              data: params,
              type: this.options.method,
              dataType: 'json'
            }).done(function(json) {
              release(json || []);
            });
            
            break;
          
          default:
            release(null);
        }
        
      } else {
        this.element.removeClass($this.options.loadingClass);
      }
    },
    
    render: function(data) {
      
      this.dropdown.empty();
      
      this.selected = false;
      
      if (this.options.renderer) {
        
        this.options.renderer.apply(this, [data]);
        
      } else if(data && data.length) {
        
        this.dropdown.append(this.template({items:data}));
        this.show();
        
        this.trigger('show.mdb.autocomplete');
      }
      
      return this;
    }
  });
  
})(MDB);