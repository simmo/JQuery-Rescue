JQuery Rescue
=============

Welcome
-------
JQuery Rescue is a simple, lightweight plugin (**3.1KB** - Minified) that allows a user to autosave and recover the contents of a form, on the client-side, using HTML5 local storage.
The main goal of Rescue is to reduce the risk of losing data and act as a safety net.

Requirements
------------
Rescue only requires you to load JQuery 1.6 +.
However, Rescue relies on the client browser to support JSON and localStorage. You can use the error callback to identify client support.

**localStorage & JSON support:**

* Internet Explorer 8 +
* Firefox 5 +
* Chrome 12 +
* Safari 4 +
* Opera 10.6 +

Usage
-----
This will allow all forms to be rescued.

    $('form').rescue();

Or if your feeling brave, you can specify a data attribute on your form tag(s).

**HTML:**

    <form data-rescue="true">...</form>

**JavaScript:**

    $('[data-rescue=true]').rescue();

The local storage entry for a form will be deleted when the contents are recovered, when a form is submitted or reset.

### Settings
The following options can be set:

    $('form').rescue({
      timer: 1000,
      exclude: '',
      saving: function() {},
      saved: function(timestamp) {},
      load: function() {},
      delete: function() {},
      error: function(code, message) {}
    });

`timer` Sets an interval to save the data as well as on interaction with the form's fields. Set this to **0** to disable the timer.

`exclude` If there are fields you don't wish to Rescue. Example: `exclude: 'input[type=password], input[name=secret]'`

`saving` This function is fired when the form is saving.

`saved(timestamp)` Once the form has saved this function is fired. A timestamp is also provided.

`load` When the form recovers data, this function is called.

`delete` This function is fired when recovered data is removed.

`error(code, message)` Fired when something goes wrong. An error code and message is provided.

Possible values:

* **1**: Insufficient browser support
* **2**: Storage quota exceeded
