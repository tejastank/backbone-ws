Backbone.WS
===========

Backbone on native WebSockets.

## What is Backbone.WS

A simple and robust facade for Backbone's Models and Collections for using WebSocket as a transport.

## Features

* Gorgeous API.
* Single WebSocket can serve multiple resources.
* Routing of messages to specific resources.
* Handles initial connection and reconnect.
* Can replace the default XHR transport (`sync`) - and allows opting out back to XHR.
* Easy debugging of messages and events.
* Built on top of `Backbone.Event`.

## Usage

### Create a WS instance

```
var ws = new Backbone.WS('ws://example.com/');
```

Or with options:

```
var ws = new Backbone.WS('ws://example.com/', { sync: true, keepOpen: true });
```

### Bind a resource

    var model = new Backbone.Model();

    model.on('ws:message', function (data) {
        console.log(data.name);
    });

    ws.bind(model);

    // server sends message: '{"name": "Robert Paulson"}'

    // "Robert Paulson"


### Unbind a resource

    ws.unbind(model);

## API Reference

### Constructor Options:

* **routes** - An `Object` mapping message event types generated by WS to event type that should be triggered on the resources. By default looks for a `'*'` key. A value can also be a `function` that takes `topic` and  `data` arguments. 
* **resources** - An `Array` of resources to bind to this WS instance. Can be either nested `Array`'s of the form `[<resource>, <events>]` or nester `Object`'s of the form `{ resource: <resource>, events: <events> }`.
* **sendAttribute** - The name of the property to use for setting the `.send()` method on resources. Default: `'send'`. Set this when your resources have a `send` method/property.
* **protocol** - If provided will be used as the protocol argument for creating the `WebSocket` instance.
* **prefix** - The prefix for the messages triggered by the WS instance. Default: `'ws'`. As is the custom in Backbone, `':'` is added as a delimiter.
* **keepOpen** - If `true` the WS instance will not destroy itself automatically when its last bound resource `.unbind()`s. Default: `false`.
* **sync** - If `true` the base `.sync()` method will be replaced to use `.send()` for transport. Can be opted out by providing `{ xhr: true }` in options. Default: `false`.
* **reopen** - If `true` the instance will attempt to reconnect automatically on `close`. Default: `true`.
* **reopenTimeout** - The timeout in milliseconds to use before reconnecting. Default: `3000`.
* **debug** - If `true` will log to console all events and in/out-going data (`open`/`message`/`close`/`error`/`send`). Default: `false`.

Helper options for creating custom API integrations, you can set these options for attributes that
will be looked up in the message's data:

* **typeAttribute** - The message `type` attribute. Default: `'type'`.
* **dataAttribute** - The message `data` attribute. Default: `'data'`. 

To disable them set those to `false`/`null`.

Example:

    var ws = new Backbone.WS('ws://example.com/');
    var model = new Backbone.Model();

    ws.bind(model, { 'ws:message:update': model.set });

    // server sends message: '{"type": "update", "data": {"answer": 42} }'

    console.log(model.get('answer'));

    // 42

### Methods:

#### `bind(resource, [events])`

Binds a resource to the WS instance for receiving messages and sending data.

`events` argument is optional and will default to triggering `<prefix>:<action>` on the resource.
Where `<prefix>` is the `prefix` options and `<action>` is one of `open`/`message`/`close`/`error`.

#### `unbind(resource)`

Unbinds a bound resource from the WS instance.

#### `send(data)`

Sends the data. JSON stringifying is done internally.

#### `destroy()`

Destroys the WS instance. If `keepOpen` option is set to `false` will be called automatically when last bound resource is calls `.unbind()`.

## Installing

* Download the source
* Or install via [npm](https://www.npmjs.com/):

```
> npm install backbone.ws
```

* Or install via [Bower](http://bower.io/):

```
> bower install backbone.ws
```

## Supported Browsers

Wherever the native WebSocket is supported, or [see here](http://caniuse.com/#feat=websockets).

## Testing

Backbone.WS uses Intern as test runner and Chai for assertions.

To run tests do:

```
> npm test
```

## Contributing

For any question, issue, complaint or praise please **open an issue**. Of course, **pull requests are welcome!**

If you'd really like to help out you can start with one of the following and send a pull request:

* Improve/add unit tests.
* Add integration tests.
* Improve documentation in the README file.
* Add CI integration (Travis?).
* Add coverage integration (Coveralls?).
* Add lovely badges to the README (:
* Write up a nice demo with live code editor using [mock-socket](https://github.com/thoov/mock-socket).

## License

Backbone.WS is licensed under the BSD 2-Clause License. Please see the LICENSE file for the full license.

Copyright (c) 2015 Yehonatan Daniv.
