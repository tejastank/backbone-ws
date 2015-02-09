(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD
        define(['backbone', 'underscore'], function (Backbone, underscore) {
            return factory(root, Backbone, underscore);
        });
    }
    else if ( typeof exports === 'object' ) {
        // CommonJS
        return factory(root, require('backbone'), require('underscore'));
    }
    else {
        // Browser globals
        factory(root, root.Backbone, root._);
    }
}(this, function (root, Backbone, _) {

    var ajaxSync = Backbone.sync;

    function WS (resources, url, options) {
        if ( ! resources ) {
            throw new Error('Resources not provided.');
        }
        if ( ! url ) {
            throw new Error('URL not provided.');
        }
        if ( ! (this instanceof WS) ) {
            return new WS(resources, url, options);
        }

        this.options = options = options || {};
        this.routes = options.routes || {};
        this.url = url;
        this.isOpen = false;

        this.typeAttribute = options.typeAttribute || 'type';
        this.dataAttribute = options.dataAttribute || 'data';
        this.sync = !! options.sync;
        this.reopen = 'reopen' in options ? options.reopen : true;
        this.resources = Array.isArray(resources) ? resources : [resources];

        this.resources.forEach(this.addResource, this);

        this.open();
    }

    _.extend(WS.prototype, Backbone.Events, {
        open          : function () {
            this.socket = this.options.protocol ?
                          new root.WebSocket(this.url, this.options.protocol) :
                          new root.WebSocket(this.url);
            this.socket.onopen = this.onopen.bind(this);
            this.socket.onmessage = this.onmessage.bind(this);
            this.socket.onerror = this.onerror.bind(this);
            this.socket.onclose = this.onclose.bind(this);
        },
        onopen        : function () {
            this.isOpen = true;
            this.trigger('ws:open');
        },
        onmessage     : function (event) {
            var data = JSON.parse(event.data),
                type = this.typeAttribute && data[this.typeAttribute],
                base_topic = 'ws:message';

            if ( type ) {
                data = this.dataAttribute ? data[this.dataAttribute] : data;
                this.trigger(this.route(base_topic + ':' + type, data), data);
            }

            this.trigger(base_topic, data, type);
        },
        onerror       : function () {
            this.trigger('ws:error');
        },
        onclose       : function (code, reason, wasClean) {
            this.isOpen = false;
            this.trigger('ws:close', code, reason, wasClean);

            if ( ! this.reopen ) {
                this.open();
            }
        },
        destroy       : function () {
            this.socket.close();
            this.socket = null;
            this.resources = null;
        },
        send          : function (data) {
            if ( this.socket ) {
                this.socket.send(JSON.stringify(data));
            }
            else {
                throw new Error('WebSocket not opened yet!');
            }
        },
        sync          : function (method, model, options) {
            if ( options.xhr ) {
                return ajaxSync.call(Backbone, method, model, options);
            }

            var data;

            data = options.data || options.attrs || model.toJSON(options);

            if ( ! data.method ) {
                data.method = method;
            }

            if ( typeof options.beforeSend == 'function' ) {
                options.beforeSend.apply(model, arguments);
            }

            this.send(data);

            model.trigger('request', model, this.socket, options);
            // returns nothing!
        },
        route         : function (topic, data) {
            var route = this.routes[topic] || this.routes['*'];
            if ( route ) {
                return typeof route == 'function' ? route(topic, data) : route;
            }
            return topic;
        },
        addResource   : function (resource, events) {
            if ( resource instanceof Backbone.Model ) {
                resource.on('destroy', this.removeResource, this);
            }

            resource[this.sendAttribute || 'send'] = this.send.bind(this);

            if ( this.sync ) {
                resource.sync = this.sync.bind(this);
            }

            Object.keys(events).forEach(function (event) {
                var handler = events[event];

                if ( handler === true ) {
                    handler = event;
                }
                if ( typeof handler == 'string' && typeof resource[handler] != 'function' ) {
                    handler = resource.trigger.bind(resource, handler)
                }

                resource.listenTo(this, event, handler);
            }, this);

            return this;
        },
        removeResource: function (resource) {
            resource.stopListening(this);

            resource[this.sendAttribute || 'send'] = null;

            if ( this.sync ) {
                resource.sync = ajaxSync;
            }

            this.resources.splice(this.resources.indexOf(resource), 1);

            if ( ! this.resources.length ) {
                this.destroy();
            }

            return this;
        }
    });

    Backbone.WS = WS;

    return WS;
}));
