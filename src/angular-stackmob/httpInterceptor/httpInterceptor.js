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
            if(config.url.indexOf('accessToken') > -1) {
              config.headers['Content-Type'] = 'Content-Type:application/x-www-form-urlencoded';
            } else {
              config.headers['Content-Type'] = 'application/json';
            }

            var apiKeyHeader = 'X-StackMob-API-Key-'+apiKey;
            config.headers = angular.extend({
                'X-StackMob-API-Key': apiKey,
                'X-StackMob-Proxy-Plain':'stackmob-api',
                'X-StackMob-User-Agent':navigator.userAgent
              }, config.headers);
            var params = encodeURI(!!config.params ? '?' + Utils.serializeObject(config.params) : '');
            config.headers['Authorization'] = Utils.getAuthHeader(config.method, config.url+params);
            config.headers[apiKeyHeader] = 1;
            config.headers['Accept'] = 'application/vnd.stackmob+json; version='+env;
            config.url = config.url+params;
            delete config.params;
            if(config.data) {
              delete config.data.sm_owner;
              delete config.data.createddate;
              delete config.data.lastmoddate;
            }


            // if(config.params && config.params.expand) {
            //   config.headers['X-StackMob-Expand'] = config.params.expand;
            //   delete config.params;
            // }
          }
          return config || $q.when(config);
        }
      };
    }
    this.$get = function ($q, Utils) {
      return new Interceptor($q, Utils);
    };
  });
