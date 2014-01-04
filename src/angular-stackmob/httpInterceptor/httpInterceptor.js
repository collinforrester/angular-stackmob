'use strict';

angular.module('angular-stackmob.httpInterceptor', ['angular-stackmob.utils'])
  .provider('stackmobHttpInterceptor', function () {

    var apiKey = 'Hello';
    var env = 'LOL';
    this.setApiKey = function (s) {
      apiKey = s;
    };
    this.setEnvironment = function (s) {
      env = s;
    };
    this.getApiKey = function () {
      return apiKey;
    };
    this.getEnvironment = function () {
      return env;
    };

    function Interceptor($q, Utils) {
      return {
        'request': function(config) {
          if(config.url.indexOf('api.stackmob.com') > -1 ) {
            var contentType = '';
            if(config.url.indexOf('accessToken') > -1) {
              contentType = 'Content-Type:application/x-www-form-urlencoded';
            } else {
              contentType = 'application/json';
            }

            config.headers['X-StackMob-API-Key'] = apiKey;
            config.headers['X-StackMob-Proxy-Plain'] = 'stackmob-api';
            config.headers['X-StackMob-User-Agent'] = navigator.userAgent;
            config.headers['Content-Type'] = contentType;
            config.headers['Accept'] = 'application/vnd.stackmob+json; version=' + env;

            // old format StackMob requires
            var apiKeyHeader = 'X-StackMob-API-Key-' + apiKey;
            config.headers[apiKeyHeader] = 1;

            // relationship headers
            // must happen before params are processed
            if(config.params && config.params._relations) {
              if(config.params._relations !== '_') {
                config.headers['X-StackMob-Relations'] = config.params._relations;
              }
              delete config.params._relations;
            }

            // order by headers
            // must happen before params are processed as they
            // are removed and added as headers
            if(config.params && config.params._orderBy) {
              config.headers['X-StackMob-OrderBy'] = config.params._orderBy;
              delete config.params._orderBy;
            }

            // expand delete headers
            // must happen before params are processed as they
            // are removed and added as headers
            if(config.params && config.params._cascadeDelete) {
              config.headers['X-StackMob-CascadeDelete'] = true;
              config.url += '/' + config.params._cascadeDelete.schema + '/' + config.params._cascadeDelete.values.join(',');
              delete config.params._cascadeDelete;
            }

            // if(config.params && config.params._expand && config.method !== 'GET') {
            //   config.headers['X-StackMob-Expand'] = config.params._expand;
            //   delete config.params._expand;
            // }

            // if all the keys are gone, remove the empty object
            if(typeof config.params === 'object') {
              if(Object.keys(config.params).length === 0) {
                delete config.params;
              }
            }

            // manually encoded URI since Angular allows a '+'
            // and Stackmob does not
            var params = encodeURI(!!config.params ? '?' + Utils.serializeObject(config.params) : '');
            config.url = config.url + params;
            delete config.params;
            config.headers['Authorization'] = Utils.getAuthHeader(config.method, config.url);


            // Stackmob will throw 409s if sm_owner is submitted with data
            if (config.data) {
              delete config.data.sm_owner;
              delete config.data.createddate;
              delete config.data.lastmoddate;
            }
          }
          return config || $q.when(config);
        }
      };
    }
    this.$get = function ($q, Utils) {
      return new Interceptor($q, Utils);
    };
  });
