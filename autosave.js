// Allow objects to be read and written to local storage
Storage.prototype.setObject = function(key, value) { return this[key] = JSON.stringify(value); };
Storage.prototype.getObject = function(key) { return JSON.parse(this[key]); };

var methods = {
  init: function(options) {
    var $timer = [], settings = {
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
    
    if (options) $.extend(settings, options);
    
    return this.each(function(i) {
      var $this = $(this), data = $this.data('autosave-config');
      
      // ID is required
      if (!$this.prop('id')) $.error('Form (#' + $this.index() + ') does not have an ID. An ID is required for jQuery.autosave.');
      
      // If form has data-autosave set overwrite duration
      if ($this.attr('data-autosave')) settings.duration = $this.attr('data-autosave');
      
      // Initalise if not loaded
      if (!data) {
        // Callback
        settings.init();
        
        // Add events to form
        $this.bind({
          'submit.autosave': function() {
            $this.trigger('stop.autosave').trigger('delete.autosave');
          },
          'start.autosave': function() {
            // Start autosave timer
            $timer[i] = setInterval(function() { $this.trigger('save.autosave'); }, settings.duration);
            
            // Callback
            settings.start();
          },
          'stop.autosave': function() {
            // Stop timer
            clearInterval($timer[i]);
            
            // Callback
            settings.stop();
          },
          'save.autosave': function() {
            var $form_data = $this.find('select, input'), $timestamp = new Date();
            
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
          },
          'load.autosave': function() {
            // Exit if no save found
            if (!localStorage[$this.attr('id')]) return;
            
            // Get autosave
            var save = localStorage.getObject($this.attr('id'));
            
            // For each bit of saved data
            $.each(save.data, function(i, field) {
              // Find element
              var $element = $this.find('[name="' + field.name + '"]');
              
              // If element found update it
              if ($element.length) {
                if ($element.is(':radio')) {
                  $element.filter('[value="' + field.value + '"]').prop('checked', true);
                } else if ($element.last().is(':checkbox')) {
                  $element.last().prop('checked', $element.last().val() === field.value ? true : false);
                } else if ($element.is('select')) {
                  $element.find('option[value="' + field.value + '"]').prop('selected', true);
                } else {
                  $element.val(field.value);
                }
                
                // Makes sure element knows its been updated
                $element.trigger('change');
              }
            });
            
            // Callback
            settings.load();
            
            // Now we have loaded it, remove it
            $this.trigger('delete.autosave');
          },
          'delete.autosave': function() {
            // Remove save
            localStorage.removeItem($this.attr('id'));
            
            // Callback
            settings.delete();
          }
        });
        
        // If form has a save
        if (localStorage[$this.attr('id')]) {
          var saved_on = new Date(localStorage.getObject($this.attr('id')).form.saved), year = saved_on.getFullYear(), month = saved_on.getMonth(), day = saved_on.getDate(), hours = saved_on.getHours(), mins = saved_on.getMinutes();
          
          var confirm_message = settings.messages.found.replace('%time%', year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day) + ' @ ' + (hours < 10 ? '0' + hours : hours) + ':' + (mins < 10 ? '0' + mins : mins));
          
          // Check if user want to load autosave
          confirm(confirm_message) ? $this.trigger('load.autosave') : $this.trigger('delete.autosave');
        }
        
        $this.data('autosave-config', {
          target: $this,
          initial_data: JSON.stringify($this.not(settings.exclude).serializeArray())
        });
        
        // Start autosave
        $this.trigger('start.autosave');
      }
    });
  },
  start: function() {
    return this.each(function() {
      return $(this).trigger('start.autosave');
    });
  },
  stop: function() {
    return this.each(function() {
      return $(this).trigger('stop.autosave');
    });
  },
  save: function() {
    return this.each(function() {
      return $(this).trigger('save.autosave');
    });
  },
  delete: function() {
    return this.each(function() {
      return $(this).trigger('delete.autosave');
    });
  },
  destroy: function() {
    return this.each(function() {
      var $this = $(this);
      
      // Stop autosaving
      $this.trigger('stop.autosave');
      
      // Remove autosave events
      $(window).unbind('.autosave');
      
      // Remove data and return
      return $this.removeData('autosave-config');
    });
  }
};

// Add autosave method to JQuery
$.fn.autosave = function(method) {
  if (methods[method]) {
    return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
  } else if (typeof method === 'object' || !method) {
    return methods.init.apply(this, arguments);
  } else {
    return $.error('Method ' + method + ' does not exist on jQuery.autosave');
  }
};