'use strict';

var AbstractStrategy = require('rest-me').Strategy,
    util = require('util'),
    Q = require('q'),
    rest = require('rest'),
    URL = require('url'),
    mime = require('rest/interceptor/mime'),
    client = rest.wrap(mime);

function FacebookStrategy(accessToken, version) {
    this.accessToken = accessToken;
    this.version = version || 'v2.3'
    this.apiEndpoint = 'graph.facebook.com' + '/' + this.version;
    this.protocol = 'https';
}

util.inherits(FacebookStrategy, AbstractStrategy);

FacebookStrategy.prototype._get = function(path) {
    var done = Q.defer();
    var parsedUrl = URL.parse(path, true);
    parsedUrl.protocol = parsedUrl.protocol || this.protocol;
    parsedUrl.host = parsedUrl.host || this.apiEndpoint;
    parsedUrl.search = null;
    parsedUrl.query.access_token = this.accessToken;
    client({
        method: 'get',
        path: parsedUrl.format()
    }).then(function(response) {
        if (response.entity.error != null) {
            done.reject(response.entity.error);
        } else {
            done.resolve(response);
        }
    }, function(err) {
        done.reject(err);
    })

    return done.promise;
}

FacebookStrategy.prototype.get = function(path) {
    return this._get(path);
}

FacebookStrategy.prototype.getPaginatedList = function(path, results) {
    results = results || [];
    var that = this;

    return this._get(path).then(function(response) {
        results = results.concat(response.entity.data);
        if(response.entity.paging && response.entity.paging.hasOwnProperty('next')) {
            return that.getPaginatedList(response.entity.paging.next, results);
        } else {
            return {
                data: results
            }
        }
    });
}

module.exports = FacebookStrategy;