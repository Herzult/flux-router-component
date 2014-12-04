/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var navigateAction = require('../actions/navigate'),
    History = require('./History'),
    EVT_PAGELOAD = 'pageload',
    EVT_POPSTATE = 'popstate',
    RouterMixin;

require('setimmediate');

function routesEqual(route1, route2) {
    route1 = route1 || {};
    route2 = route2 || {};
    return (route1.path === route2.path);
}

RouterMixin = {
    componentDidMount: function() {
        var self = this,
            context = self.props.context,
            pathFromHistory,
            pathFromState;

        self._history = ('function' === typeof self.props.historyCreator) ? self.props.historyCreator() : new History();

        if (self.props.checkRouteOnPageLoad) {
            // You probably want to enable checkRouteOnPageLoad, if you use a history implementation
            // that supports hash route:
            //   At page load, for browsers without pushState AND hash is present in the url,
            //   since hash fragment is not sent to the server side, we need to
            //   dispatch navigate action on browser side to load the actual page content
            //   for the route represented by the hash fragment.

            pathFromHistory = self._history.getPath();
            pathFromState = self.state && self.state.route && self.state.route.path;

            if (context && (pathFromHistory !== pathFromState)) {
                // put it in setImmediate, because we need the base component to have
                // store listeners attached, before navigateAction is executed.
                setImmediate(function navigateToActualRoute() {
                    context.executeAction(navigateAction, {type: EVT_PAGELOAD, path: pathFromHistory});
                });
            }
        }

        self._historyListener = function (e) {
            if (context) {
                var path = self._history.getPath();
                context.executeAction(navigateAction, {type: EVT_POPSTATE, path: path, params: e.state});
            }
        };
        self._history.on(self._historyListener);
    },
    componentWillUnmount: function() {
        this._history.off(this._historyListener);
        this._historyListener = null;
        this._history = null;
    },
    componentDidUpdate: function (prevProps, prevState) {
        var newState = this.state;
        if (routesEqual(prevState && prevState.route, newState && newState.route)) {
            return;
        }
        var nav = newState.route.navigate;
        if (nav.type !== EVT_POPSTATE && nav.type !== EVT_PAGELOAD) {
            this._history.pushState(nav.params || null, null, newState.route.path);
        }
    }
};

module.exports = RouterMixin;
