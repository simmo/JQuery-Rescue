# JQuery Rescue - Mike Simmonds - https://github.com/MikeSimmonds/JQuery-Rescue
$ = jQuery
$.fn.rescue = (method) ->
  supported = ->
    try
      a = 'a'
      localStorage.setItem(a, a)
      localStorage.removeItem(a)
      a = JSON.stringify(a)
      JSON.parse(a)
      true
    catch e
      false
  settings =
    timer: 1000
    exclude: ''
    saving: ->
    saved: ->
    load: ->
    delete: ->
    error: (code, message) -> console.log 'Error (' + code + '): ' + message if typeof console.log is 'function'
  methods =
    init: (options) ->
      $.extend(settings, options) if options
      settings.error('1', 'Insufficient browser support') unless supported()
      if typeof localStorage.setObject is 'undefined'
        Storage.prototype.setObject = (key, value) ->
          try 
            @[key] = JSON.stringify(value)
          catch e
            settings.error('2', 'Storage quota exceeded') if e.name == 'QUOTA_EXCEEDED_ERR'
      if typeof localStorage.getObject is 'undefined'
        Storage.prototype.getObject = (key) -> JSON.parse(@[key]) 
      @each (i) ->
        $this = $(@)
        $.error('Form (#' + $this.index() + ') does not have an ID. An ID is required for jQuery.rescue.') unless $this.prop('id')
        unless $this.data('rescue')
          $this.data('rescue', {}).bind
            'submit.rescue': ->
              methods.stop.apply($this)
              methods.delete.apply($this)
            'reset.rescue': ->
              methods.stop.apply($this)
              methods.delete.apply($this)
              methods.start.apply($this)
          methods.update.apply($this)
          methods.load.apply($this) if localStorage[$this.prop('id')]
          $this.data('rescue').initial_data = JSON.stringify($this.data('rescue').fields.serializeArray())
          methods.start.apply($this)
    update: ->
      @each (i) ->
        $this = $(@)
        $this.data('rescue').fields = $this.find('select[name], input[name]:not([type=submit], [type=reset], [type=button]), textarea[name]')
        $this.data('rescue').fields.not(settings.exclude) if settings.exclude
        $this.data('rescue').fields.bind 'change.rescue keyup.rescue', -> methods.save.apply($this)
    start: ->
      @each (i) ->
        $this = $(@)
        $this.data('rescue').timer = setInterval((-> methods.save.apply($this)), settings.timer) if settings.timer
    stop: ->
      @each (i) ->
        $this = $(@)
        clearInterval $this.data('rescue').timer
    save: ->
      @each ->
        $this = $(@)
        $form_data = $this.data('rescue').fields.serializeArray()
        $timestamp = new Date()
        return false if !localStorage[$this.prop('id')] and $this.data('rescue').initial_data is JSON.stringify($form_data)
        settings.saving()
        settings.saved($timestamp) if (localStorage.setObject $this.prop('id'),
          form:
            saved: Math.ceil($timestamp.getTime())
            url: $this.prop('action')
            method: $this.prop('method')
            id: $this.prop('id')
          data: $form_data)
    load: ->
      @each ->
        $this = $(@)
        autosave = {}
        return false unless localStorage[$this.prop('id')]
        $.each localStorage.getObject($this.prop('id')).data, (i, field) -> autosave[field.name] = field.value
        $this.data('rescue').fields.each (i, field) ->
          $field = $(field)
          value = autosave[$field.prop('name')]
          if value isnt false
            if $field.is(':radio')
              $field.filter('[value="' + value + '"]').prop('checked', true)
            else if $field.is(':checkbox')
              $field.prop 'checked', $field.val() is value
            else if $field.is('select')
              $field.find('option[value="' + value + '"]').prop('selected', true)
            else
              $field.val(value)
            $field.trigger('change')
        methods.delete.apply($this)
        settings.load()
    delete: ->
      @each ->
        $this = $(@)
        localStorage.removeItem($this.prop('id'))
        settings.delete()
    destroy: ->
      @each ->
        $this = $(@)
        methods.stop.apply($this)
        $this.unbind('.rescue').removeData('rescue')
  if methods[method]
    methods[method].apply(@, Array.prototype.slice.call(arguments, 1))
  else if typeof method is 'object' or !method
    methods.init.apply(@, arguments)
  else
    $.error('Method ' + method + ' does not exist on jQuery.rescue')