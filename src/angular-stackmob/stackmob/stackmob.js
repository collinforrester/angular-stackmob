'use strict';

angular.module('angular-stackmob.stackmob', ['angular-stackmob.httpInterceptor', 'angular-stackmob.utils', 'ngResource'])
  .config(function($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })
  .provider('Stackmob', function(stackmobHttpInterceptorProvider, UtilsProvider) {

    // Private variables
    var apiKey = 'Hello';
    var env = 'LOL';
    var schemaUrl = 'http://api.stackmob.com/';
    var localStorageKey = 'stackmob';
    // Private constructor
    function Stackmob($log, $resource, $http) {
      var refreshLoginInformation = function(data) {
        localStorage.setItem(localStorageKey + '.access_token', data.data.access_token);
        localStorage.setItem(localStorageKey + '.mac_key', data.data.mac_key);
        localStorage.setItem(localStorageKey + '.user', JSON.stringify(data.data.stackmob.user));
        localStorage.setItem(localStorageKey + '.refresh_token', data.data.refresh_token);
        localStorage.setItem(localStorageKey + '.expires_in', (new Date()).getTime() + data.data.expires_in * 1000);
      };
      return {
        refreshToken: function() {
          var promise = $http.post(schemaUrl + 'user/refreshToken', {}, {
            params: {
              refresh_token: localStorage.getItem(localStorageKey + '.refresh_token'),
              grant_type: 'refresh_token',
              token_type: 'mac',
              mac_algorithm: 'hmac-sha-1'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          promise.then(refreshLoginInformation);
          return promise;
        },
        logout: function() {
          var promise = $http.get(schemaUrl + 'user/logout');
          promise.then(function() {
            localStorage.removeItem(localStorageKey + '.access_token');
            localStorage.removeItem(localStorageKey + '.mac_key');
            localStorage.removeItem(localStorageKey + '.user');
            localStorage.removeItem(localStorageKey + '.refresh_token');
            localStorage.removeItem(localStorageKey + '.expires_in');
          });
          return promise;
        },
        login: function(username, pw) {
          var promise = $http.post(schemaUrl + 'user/accessToken', {

          }, {
            params: {
              username: username,
              password: pw,
              token_type: 'mac'
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          promise.then(refreshLoginInformation);
          return promise;
        },
        schema: function(schemaName, primaryKey) {
          var pk = primaryKey || schemaName + '_id';
          var update = {
            method: 'PUT',
            isArray: false,
            params: {}
          };
          var create = {
            method: 'POST',
            params: {}
          };
          var deleteMethod = {
            method: 'DELETE',
            params: {}
          };
          var deepCreate = {
            method: 'POST',
            params: {_relations: '_'}
          };
          var deepUpdate = {
            method: 'PUT',
            isArray: false,
            params: {_relations: '_'}
          };
          var deepSave = {
            method: 'PUT'
          };
          update.params[pk] = '@'+pk;
          deleteMethod.params[pk] = '@'+pk;
          var resourceParams = {};
          resourceParams[pk] = '@' + pk;
          var resource = $resource(schemaUrl + schemaName + '/:' + pk,
            resourceParams, {
            update: update,
            create: create,
            deepSave: deepSave,
            deepCreate: deepCreate,
            deepUpdate: deepUpdate,
            'delete': deleteMethod
          });
          resource.prototype.$deepSave = function(args) {
            if (!this[pk]) {
              return this.$deepCreate(args);
            } else {
              return this.$deepUpdate(args);
            }
          };
          resource.prototype.$save = function (args) {
            for(var k in this) {
              if(this.hasOwnProperty(k)) {
                if(k.indexOf('$$') === -1 && typeof this[k] === 'object') {
                  if(this[k] instanceof Array) {
                    // special case - make sure its a valid array of
                    // primary keys
                    var shouldRemove = false;
                    angular.forEach(this[k], function(item) {
                      if(typeof item === 'object') {
                        shouldRemove = true;
                      }
                    });
                    if(shouldRemove) {
                      delete this[k];
                    }
                  } else {
                    delete this[k];
                  }
                }
              }
            }
            if (!this[pk]) {
              return this.$create(args);
            } else {
              return this.$update(args);
            }
          };
          return resource;
        }
      };
    }

    // Public API for configuration
    this.setApiKey = function(s) {
      apiKey = s;
      stackmobHttpInterceptorProvider.setApiKey(s);
    };
    this.setEnvironment = function(s) {
      env = s;
      stackmobHttpInterceptorProvider.setEnvironment(s);
    };
    this.setSchemaUrl = function(s) {
      schemaUrl = s;
    };
    this.setLocalStorageKey = function(s) {
      localStorageKey = s;
      UtilsProvider.setLocalStorageKey(s);
    };
    this.getSchemaUrl = function() {
      return schemaUrl;
    };
    this.getApiKey = function() {
      return apiKey;
    };
    this.getEnvironment = function() {
      return env;
    };

    // Method for instantiating
    this.$get = function($log, $resource, $http, stackmobHttpInterceptor) {
      if (apiKey === 'Hello') {
        $log.error('Must set API key before using.');
        return;
      }
      if (env === 'LOL') {
        $log.error('Must set environment before using.');
        return;
      }
      return new Stackmob($log, $resource, $http);
    };
  });
