/* JQuery Rescue - Mike Simmonds - https://github.com/MikeSimmonds/JQuery-Rescue */
(function($) {
  $.fn.rescue = function(method) {
    var supported = function() {
      try {
        var a = 'a';
        localStorage.setItem(a, a);
        localStorage.removeItem(a);
        a = JSON.stringify(a);
        JSON.parse(a);
        return true;
      } catch(e) {
        return false;
      }
    };
    
    var settings = {
      timer: 1000,
      exclude: '',
      saving: function() {},
      saved: function(timestamp) {},
      load: function() {},
      delete: function() {},
      error: function(code, message) {
        if (typeof console.log == 'function') console.log('Error (' + code + '): ' + message);
      }
    };
    
    var methods = {
      init: function(options) {
        if (options) $.extend(settings, options);

        // Check for dependancies
        if (!supported()) {
          settings.error('1', 'Insufficient browser support');
          return;
        }
        if (typeof localStorage.setObject == 'undefined') Storage.prototype.setObject = function(key, value) { return this[key] = JSON.stringify(value); };
        if (typeof localStorage.getObject == 'undefined') Storage.prototype.getObject = function(key) { return JSON.parse(this[key]); };
        
        return this.each(function(i) {
          var $this = $(this);

          // ID is required
          if (!$this.prop('id')) $.error('Form (#' + $this.index() + ') does not have an ID. An ID is required for jQuery.rescue.');

          // Initalise if not loaded
          if (!$this.data('rescue')) {
            // Create data object and add form events
            $this.data('rescue', {}).bind('submit.rescue', function() {
              methods.stop.apply($this);
              methods.delete.apply($this);
            });

            methods.update.apply($this);
            
            // Autosave found?
            if (localStorage[$this.prop('id')]) methods.load.apply($this);

            $this.data('rescue').initial_data = JSON.stringify($this.data('rescue').fields.serializeArray());

            // Start autosave
            methods.start.apply($this);
          }
        });
      },
      update: function() {
        return this.each(function(i) {
          var $this = $(this);
          $this.data('rescue').fields = $this.find('select[name], input[name], textarea[name]');
          if (settings.exclude) $this.data('rescue').fields.not(settings.exclude);
          $this.data('rescue').fields.bind('change.rescue keyup.rescue', function() { methods.save.apply($this); });
        });
      },
      start: function() {
        return this.each(function(i) {
          var $this = $(this);
          
          // Start autosave timer
          if (settings.timer) $this.data('rescue').timer = setInterval(function() { methods.save.apply($this); }, settings.timer);
        });
      },
      stop: function() {
        return this.each(function(i) {
          var $this = $(this);
          
          // Stop timer
          clearInterval($this.data('rescue').timer);
        });
      },
      save: function() {
        return this.each(function() {
          var $this = $(this), $form_data = $this.data('rescue').fields.serializeArray(), $timestamp = new Date();
          
          // Only continue if the form data is different to the initial data
          if (!localStorage[$this.prop('id')] && $this.data('rescue').initial_data === JSON.stringify($form_data)) return;
          
          // Callback
          settings.saving();

          // Save form
          localStorage.setObject($this.prop('id'), {
            form: {
              saved: Math.ceil($timestamp.getTime()),
              url: $this.prop('action'),
              method: $this.prop('method'),
              id: $this.prop('id')
            },
            data: $form_data
          });

          // Callback
          settings.saved($timestamp);
        });
      },
      load: function() {
        return this.each(function() {
          var $this = $(this), autosave = {};

          // Exit if no save found
          if (!localStorage[$this.prop('id')]) return;

          // Format data
          $.each(localStorage.getObject($this.prop('id')).data, function(i, field) { autosave[field.name] = field.value; });

          // For each field in form
          $this.data('rescue').fields.each(function(i, field) {
            var $field = $(field), value = autosave[$field.prop('name')];

            // Saved value found
            if (value !== false) {
              // What type of field are we dealing with?
              if ($field.is(':radio')) {
                $field.filter('[value="' + value + '"]').prop('checked', true);
              } else if ($field.is(':checkbox')) {
                $field.prop('checked', $field.val() === value ? true : false);
              } else if ($field.is('select')) {
                $field.find('option[value="' + value + '"]').prop('selected', true);
              } else {
                $field.val(value);
              }

              // Makes sure element knows its been updated
              $field.trigger('change');
            }
          });
          
          // Remove save
          methods.delete.apply($this);
          
          // Callback
          settings.load();
        });
      },
      delete: function() {
        return this.each(function() {
          var $this = $(this);

          // Remove save
          localStorage.removeItem($this.prop('id'));

          // Callback
          settings.delete();
        });
      },
      destroy: function() {
        return this.each(function() {
          var $this = $(this);

          // Stop autosaving
          methods.stop.apply($this);

          // Remove autosave events and data
          $this.unbind('.rescue').removeData('rescue');
        });
      }
    };
    
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.rescue');
    }
  };
})(jQuery);