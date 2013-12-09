'use strict';

angular.module('angular-stackmob.utils',[])
	.provider('Utils', function Utils() {

    var localStorageKey = 'stackmob';

    this.setLocalStorageKey = function(s) {
      localStorageKey = s;
    };

    function Utils() {
      return {
        serializeObject: function(obj) {
          var pairs = [];
          for (var prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
              continue;
            }
            pairs.push(prop + '=' + obj[prop]);
          }
          return pairs.join('&');
        },

        createBaseString: function(ts, nonce, method, uri, host, port) {
          var nl = '\u000A';
          return ts + nl + nonce + nl + method + nl + uri + nl + host + nl + port + nl + nl;
        },

        // TODO - not sure if I'm happy with how I have to change this production code
        // to test it.
        // parameters at the end prefixed with _ are optional and only used in testing
        // to substitute out variables that are created randomly/dynamically.
        generateMAC: function(httpVerb, accessToken, macKey, hostWithPort, url, _ts, _nonce, _hash) {
          var splitHost = hostWithPort.split(':');
          var hostNoPort = splitHost.length > 1 ? splitHost[0] : hostWithPort;

          // remember that if you're pointing at https, the port is 443!
          var port = splitHost.length > 1 ? splitHost[1] : 80;

          var ts = _ts || Math.round(new Date().getTime() / 1000);
          var nonce = _nonce || "n" + Math.round(Math.random() * 10000);

          var base = this.createBaseString(ts, nonce, httpVerb, url, hostNoPort, port);

          var hash = CryptoJS.HmacSHA1(base, macKey);
          var mac = _hash || hash.toString(CryptoJS.enc.Base64);

          return 'MAC id="' + accessToken + '",ts="' + ts + '",nonce="' + nonce + '",mac="' + mac + '"';
        },

        getAuthHeader: function(httpVerb, url) {
          // http://api.stackmob.com/
          var host = 'http://api.stackmob.com/';

          // /user?age[gt]=21
          var path = url.replace(new RegExp(host, 'g'), '/');

          // api.stackmob.com
          var hostWithPort = host.replace(
            new RegExp('^http://|^https://', 'g'), '').replace(new RegExp('/'), '');

          // The access token when you logged in
          var accessToken = localStorage.getItem(localStorageKey+'.access_token');

          // The mac key when you logged in
          var macKey = localStorage.getItem(localStorageKey+'.mac_key');

          if (accessToken && macKey) {
            // Generate the Header!
            var authHeader = this.generateMAC(httpVerb, accessToken, macKey, hostWithPort, path);
            return authHeader;
          }
        }
      };
    }

    this.$get = function() {
      return new Utils();
    };
	});
