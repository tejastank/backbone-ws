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
* **retries** - The number of consecutive times the WS instance will attempt to reopen the connection once it closes. This counter is reset once a connection is successfully opened. Default: `3`.
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

Helper options for ensuring proper communication between client and server, or simply
for enforcing a strict state in the client:

* **expect** - A default expectation to use once an expectation is requested. Can be either a `string`, a `function` or an `Object`. Defaults `null`.
* **expectSeconds** - A default minimal number of seconds to use when waiting before triggering the `timeout` event. This can be override once as an argument to `expect()` or `send()`.

Example:

    var ws = new Backbone.WS(
        'ws://example.com/',
        {
            expect: 'update'
        });
    var model = new Backbone.Model();

    ws.bind(model, { 'ws:message:update': model.set });

    var expectation = ws.expect();
    expectation.promise.then(
        function (data, type) {
            console.log(data, type);
        },
        function () {
            console.error('timeout for response to `some_topic` reached');
        });

    // server sends message: '{"type": "update", "data": {"answer": 42} }'
    // { answer: 42 } 'update'

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

#### `expect([expectation] [, seconds])`

Creates and returns an expectation for receiving a message from the server.

If called without arguments then `expectation` defaults to the `expect` option and
`seconds` defaults to the `expectSeconds` option. If `expectation` is `true` then
it behaves as if no `expectation` argument was provided.

Otherwise, any `expectation` given will be used for assertion. If `false`/`null` are used then any
incoming message will resolve the expectation.

An Expectation object has a `promise` property which is a Promise object. You can set
handlers for fulfilled/rejected cases according to the Promises API.

This promise will be rejected when the timeout set in `seconds` ends.

You can dispose of the expectation before that by calling the `.kill()` method of the expectation object. 

This mechanism can be used for creating a lightweight request/response like API, or a heartbeat mechanism, or
validating that a client can send and receive data.

### Events:

__Note__: All events are prefixed by the `prefix` option + (defaults to `'ws'`) `':'` as separator.

#### `open`

Triggered once a connection is open.

#### `message:<route>` :: `(data {*})`

Triggered when a message is accepted via WebSocket,
and __only__ if the `typeAttribute` option has a value and that value is
found in the original message event's data.

Handler takes a single argument, the event's data. If the `dataAttribute` option has a value
and that value is found in the original event's data, that value is passed to the handler instead.

__Note__: Data is assumed to be in JSON format and is parsed as so.

#### `message` :: `(data {*}, type {string})`

Triggered when a message is accepted via WebSocket, after the above custom route event.

Handler takes 2 arguments, the event's data and its type. If the `dataAttribute` option has a value
and that value is found in the original event's data, that value is passed to the handler instead.
Same goes for the type argument and the `typeAttribute` option.

__Note__: Data is assumed to be in JSON format and is parsed as so.

#### `error` :: `(event {Object}, isOpen {boolean})`

Triggered when an error event is accepted via WebSocket.

Handler takes 2 arguments, the original event object and a boolean representing the connection's
state at the moment the event is triggered.

Usually an `error` event that occurs while a connection is closed means a failure to establish connection.

#### `close` :: `(event {Object})`

Triggered when a [`CloseEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) is accepted via WebSocket.

Handler takes a single argument, the CloseEvent's original event object.

#### `noretries` :: `(event {Object})`

Triggered once a `CloseEvent` occurs, and the `reopen` option is set to `true`, and the limit of
of `retries` counter is exhausted.

Handler takes a single argument, the last CloseEvent's original event object.

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
