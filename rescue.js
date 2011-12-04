// Allow objects to be read and written to local storage
Storage.prototype.setObject = function(key, value) { return this[key] = JSON.stringify(value); };
Storage.prototype.getObject = function(key) { return JSON.parse(this[key]); };

(function($) {
  var $timer = [];
  
  var settings = {
    duration: 1000,
    exclude: '',
    messages: {
      found: 'We found an autosave from %time%. Would you like to recover it?'
    },
    init: function() {},
    start: function() {},
    stop: function() {},
    saving: function() {},
    saved: function(timestamp) {},
    load: function() {},
    delete: function() {}
  };
  
  var methods = {
    init: function(options) {
      if (options) $.extend(settings, options);
    
      return this.each(function(i) {
        var $this = $(this), data = $this.data('autosave-config');
      
        // ID is required
        if (!$this.prop('id')) $.error('Form (#' + $this.index() + ') does not have an ID. An ID is required for jQuery.rescue.');
      
        // Initalise if not loaded
        if (!data) {
          // Callback
          settings.init();
        
          // Remove autosave when form submitted
          $this.bind('submit.autosave', function() {
            methods.stop.apply($this);
            methods.delete.apply($this);
          });
        
          methods.check.apply($this);
        
          $this.data('autosave-config', {
            target: $this,
            initial_data: JSON.stringify($this.not(settings.exclude).serializeArray())
          });
        
          // Start autosave
          methods.start.apply($this);
        }
      });
    },
    start: function() {
      return this.each(function(i) {
        var $this = $(this);
        
        // Start autosave timer
        $timer[i] = setInterval(function() { methods.save.apply($this); }, settings.duration);
      
        // Callback
        settings.start();
      });
    },
    stop: function() {
      return this.each(function(i) {
        // Stop timer
        clearInterval($timer[i]);
      
        // Callback
        settings.stop();
      });
    },
    check: function() {
      return this.each(function() {
        var $this = $(this);
        
        // If form has a save
        if (localStorage[$this.attr('id')]) {
          var saved_on = new Date(localStorage.getObject($this.attr('id')).form.saved), year = saved_on.getFullYear(), month = saved_on.getMonth(), day = saved_on.getDate(), hours = saved_on.getHours(), mins = saved_on.getMinutes();
      
          var confirm_message = settings.messages.found.replace('%time%', year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day) + ' @ ' + (hours < 10 ? '0' + hours : hours) + ':' + (mins < 10 ? '0' + mins : mins));
      
          // Check if user want to load autosave
          confirm(confirm_message) ? methods.load.apply($this) : methods.delete.apply($this);
        }
      });
    },
    save: function() {
      return this.each(function() {
        var $this = $(this), $form_data = $this.find('select, input'), $timestamp = new Date();
      
        // Remove any exluded fields
        if (settings.exclude !== '') $form_data = $form_data.not(settings.exclude);
      
        // Serialise form data
        $form_data = $form_data.serializeArray();
      
        // Only continue if the form data is different to the initial data
        if (!localStorage[$this.attr('id')] && $this.data('autosave-config').initial_data === JSON.stringify($form_data)) return;
      
        // Callback
        settings.saving();
      
        // Save form
        localStorage.setObject($this.attr('id'), {
          form: {
            saved: Math.ceil($timestamp.getTime()),
            url: $this.attr('action'),
            method: $this.attr('method'),
            id: $this.attr('id')
          },
          data: $form_data
        });
      
        // Callback
        settings.saved($timestamp);
      });
    },
    load: function() {
      return this.each(function() {
        var $this = $(this);
        
        // Exit if no save found
        if (!localStorage[$this.attr('id')]) return;
      
        var autosave = {}, $fields = $this.find('select, input:not([type=submit]):not([type=reset])');
      
        // Remove any exluded fields
        if (settings.exclude !== '') $fields = $fields.not(settings.exclude);
      
        // Format data
        $.each(localStorage.getObject($this.attr('id')).data, function(i, field) { autosave[field.name] = field.value; });
      
        // For each field in form
        $fields.each(function(i, field) {
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
      
        // Callback
        settings.load();
      
        // Now we have loaded it, remove it
        methods.delete.apply($this);
      });
    },
    delete: function() {
      return this.each(function() {
        var $this = $(this);
        
        // Remove save
        localStorage.removeItem($this.attr('id'));
      
        // Callback
        settings.delete();
      });
    },
    destroy: function() {
      return this.each(function() {
        var $this = $(this);
      
        // Stop autosaving
        methods.stop.apply($this);
      
        // Remove autosave events
        $(window).unbind('.autosave');
      
        // Remove data
        $this.removeData('autosave-config');
      });
    }
  };
  
  // Add autosave method to JQuery
  $.fn.rescue = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      return $.error('Method ' + method + ' does not exist on jQuery.autosave');
    }
  };
})(jQuery);