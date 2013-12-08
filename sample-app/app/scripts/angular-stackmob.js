var CryptoJS = CryptoJS || function (Math, undefined) {
    var C = {};
    var C_lib = C.lib = {};
    var Base = C_lib.Base = function () {
        function F() {
        }
        return {
          extend: function (overrides) {
            F.prototype = this;
            var subtype = new F();
            if (overrides) {
              subtype.mixIn(overrides);
            }
            if (!subtype.hasOwnProperty('init')) {
              subtype.init = function () {
                subtype.$super.init.apply(this, arguments);
              };
            }
            subtype.init.prototype = subtype;
            subtype.$super = this;
            return subtype;
          },
          create: function () {
            var instance = this.extend();
            instance.init.apply(instance, arguments);
            return instance;
          },
          init: function () {
          },
          mixIn: function (properties) {
            for (var propertyName in properties) {
              if (properties.hasOwnProperty(propertyName)) {
                this[propertyName] = properties[propertyName];
              }
            }
            if (properties.hasOwnProperty('toString')) {
              this.toString = properties.toString;
            }
          },
          clone: function () {
            return this.init.prototype.extend(this);
          }
        };
      }();
    var WordArray = C_lib.WordArray = Base.extend({
        init: function (words, sigBytes) {
          words = this.words = words || [];
          if (sigBytes != undefined) {
            this.sigBytes = sigBytes;
          } else {
            this.sigBytes = words.length * 4;
          }
        },
        toString: function (encoder) {
          return (encoder || Hex).stringify(this);
        },
        concat: function (wordArray) {
          var thisWords = this.words;
          var thatWords = wordArray.words;
          var thisSigBytes = this.sigBytes;
          var thatSigBytes = wordArray.sigBytes;
          this.clamp();
          if (thisSigBytes % 4) {
            for (var i = 0; i < thatSigBytes; i++) {
              var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
            }
          } else if (thatWords.length > 65535) {
            for (var i = 0; i < thatSigBytes; i += 4) {
              thisWords[thisSigBytes + i >>> 2] = thatWords[i >>> 2];
            }
          } else {
            thisWords.push.apply(thisWords, thatWords);
          }
          this.sigBytes += thatSigBytes;
          return this;
        },
        clamp: function () {
          var words = this.words;
          var sigBytes = this.sigBytes;
          words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
          words.length = Math.ceil(sigBytes / 4);
        },
        clone: function () {
          var clone = Base.clone.call(this);
          clone.words = this.words.slice(0);
          return clone;
        },
        random: function (nBytes) {
          var words = [];
          for (var i = 0; i < nBytes; i += 4) {
            words.push(Math.random() * 4294967296 | 0);
          }
          return new WordArray.init(words, nBytes);
        }
      });
    var C_enc = C.enc = {};
    var Hex = C_enc.Hex = {
        stringify: function (wordArray) {
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var hexChars = [];
          for (var i = 0; i < sigBytes; i++) {
            var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
            hexChars.push((bite >>> 4).toString(16));
            hexChars.push((bite & 15).toString(16));
          }
          return hexChars.join('');
        },
        parse: function (hexStr) {
          var hexStrLength = hexStr.length;
          var words = [];
          for (var i = 0; i < hexStrLength; i += 2) {
            words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
          }
          return new WordArray.init(words, hexStrLength / 2);
        }
      };
    var Latin1 = C_enc.Latin1 = {
        stringify: function (wordArray) {
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var latin1Chars = [];
          for (var i = 0; i < sigBytes; i++) {
            var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
            latin1Chars.push(String.fromCharCode(bite));
          }
          return latin1Chars.join('');
        },
        parse: function (latin1Str) {
          var latin1StrLength = latin1Str.length;
          var words = [];
          for (var i = 0; i < latin1StrLength; i++) {
            words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
          }
          return new WordArray.init(words, latin1StrLength);
        }
      };
    var Utf8 = C_enc.Utf8 = {
        stringify: function (wordArray) {
          try {
            return decodeURIComponent(escape(Latin1.stringify(wordArray)));
          } catch (e) {
            throw new Error('Malformed UTF-8 data');
          }
        },
        parse: function (utf8Str) {
          return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
      };
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        reset: function () {
          this._data = new WordArray.init();
          this._nDataBytes = 0;
        },
        _append: function (data) {
          if (typeof data == 'string') {
            data = Utf8.parse(data);
          }
          this._data.concat(data);
          this._nDataBytes += data.sigBytes;
        },
        _process: function (doFlush) {
          var data = this._data;
          var dataWords = data.words;
          var dataSigBytes = data.sigBytes;
          var blockSize = this.blockSize;
          var blockSizeBytes = blockSize * 4;
          var nBlocksReady = dataSigBytes / blockSizeBytes;
          if (doFlush) {
            nBlocksReady = Math.ceil(nBlocksReady);
          } else {
            nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
          }
          var nWordsReady = nBlocksReady * blockSize;
          var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);
          if (nWordsReady) {
            for (var offset = 0; offset < nWordsReady; offset += blockSize) {
              this._doProcessBlock(dataWords, offset);
            }
            var processedWords = dataWords.splice(0, nWordsReady);
            data.sigBytes -= nBytesReady;
          }
          return new WordArray.init(processedWords, nBytesReady);
        },
        clone: function () {
          var clone = Base.clone.call(this);
          clone._data = this._data.clone();
          return clone;
        },
        _minBufferSize: 0
      });
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        cfg: Base.extend(),
        init: function (cfg) {
          this.cfg = this.cfg.extend(cfg);
          this.reset();
        },
        reset: function () {
          BufferedBlockAlgorithm.reset.call(this);
          this._doReset();
        },
        update: function (messageUpdate) {
          this._append(messageUpdate);
          this._process();
          return this;
        },
        finalize: function (messageUpdate) {
          if (messageUpdate) {
            this._append(messageUpdate);
          }
          var hash = this._doFinalize();
          return hash;
        },
        blockSize: 512 / 32,
        _createHelper: function (hasher) {
          return function (message, cfg) {
            return new hasher.init(cfg).finalize(message);
          };
        },
        _createHmacHelper: function (hasher) {
          return function (message, key) {
            return new C_algo.HMAC.init(hasher, key).finalize(message);
          };
        }
      });
    var C_algo = C.algo = {};
    return C;
  }(Math);
(function () {
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var C_enc = C.enc;
  var Base64 = C_enc.Base64 = {
      stringify: function (wordArray) {
        var words = wordArray.words;
        var sigBytes = wordArray.sigBytes;
        var map = this._map;
        wordArray.clamp();
        var base64Chars = [];
        for (var i = 0; i < sigBytes; i += 3) {
          var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
          var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
          var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
          var triplet = byte1 << 16 | byte2 << 8 | byte3;
          for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
            base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
          }
        }
        var paddingChar = map.charAt(64);
        if (paddingChar) {
          while (base64Chars.length % 4) {
            base64Chars.push(paddingChar);
          }
        }
        return base64Chars.join('');
      },
      parse: function (base64Str) {
        var base64StrLength = base64Str.length;
        var map = this._map;
        var paddingChar = map.charAt(64);
        if (paddingChar) {
          var paddingIndex = base64Str.indexOf(paddingChar);
          if (paddingIndex != -1) {
            base64StrLength = paddingIndex;
          }
        }
        var words = [];
        var nBytes = 0;
        for (var i = 0; i < base64StrLength; i++) {
          if (i % 4) {
            var bits1 = map.indexOf(base64Str.charAt(i - 1)) << i % 4 * 2;
            var bits2 = map.indexOf(base64Str.charAt(i)) >>> 6 - i % 4 * 2;
            words[nBytes >>> 2] |= (bits1 | bits2) << 24 - nBytes % 4 * 8;
            nBytes++;
          }
        }
        return WordArray.create(words, nBytes);
      },
      _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    };
}());
(function () {
  var C = CryptoJS;
  var C_lib = C.lib;
  var Base = C_lib.Base;
  var C_enc = C.enc;
  var Utf8 = C_enc.Utf8;
  var C_algo = C.algo;
  var HMAC = C_algo.HMAC = Base.extend({
      init: function (hasher, key) {
        hasher = this._hasher = new hasher.init();
        if (typeof key == 'string') {
          key = Utf8.parse(key);
        }
        var hasherBlockSize = hasher.blockSize;
        var hasherBlockSizeBytes = hasherBlockSize * 4;
        if (key.sigBytes > hasherBlockSizeBytes) {
          key = hasher.finalize(key);
        }
        key.clamp();
        var oKey = this._oKey = key.clone();
        var iKey = this._iKey = key.clone();
        var oKeyWords = oKey.words;
        var iKeyWords = iKey.words;
        for (var i = 0; i < hasherBlockSize; i++) {
          oKeyWords[i] ^= 1549556828;
          iKeyWords[i] ^= 909522486;
        }
        oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;
        this.reset();
      },
      reset: function () {
        var hasher = this._hasher;
        hasher.reset();
        hasher.update(this._iKey);
      },
      update: function (messageUpdate) {
        this._hasher.update(messageUpdate);
        return this;
      },
      finalize: function (messageUpdate) {
        var hasher = this._hasher;
        var innerHash = hasher.finalize(messageUpdate);
        hasher.reset();
        var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));
        return hmac;
      }
    });
}());
(function () {
  var C = CryptoJS;
  var C_lib = C.lib;
  var WordArray = C_lib.WordArray;
  var Hasher = C_lib.Hasher;
  var C_algo = C.algo;
  var W = [];
  var SHA1 = C_algo.SHA1 = Hasher.extend({
      _doReset: function () {
        this._hash = new WordArray.init([
          1732584193,
          4023233417,
          2562383102,
          271733878,
          3285377520
        ]);
      },
      _doProcessBlock: function (M, offset) {
        var H = this._hash.words;
        var a = H[0];
        var b = H[1];
        var c = H[2];
        var d = H[3];
        var e = H[4];
        for (var i = 0; i < 80; i++) {
          if (i < 16) {
            W[i] = M[offset + i] | 0;
          } else {
            var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
            W[i] = n << 1 | n >>> 31;
          }
          var t = (a << 5 | a >>> 27) + e + W[i];
          if (i < 20) {
            t += (b & c | ~b & d) + 1518500249;
          } else if (i < 40) {
            t += (b ^ c ^ d) + 1859775393;
          } else if (i < 60) {
            t += (b & c | b & d | c & d) - 1894007588;
          } else {
            t += (b ^ c ^ d) - 899497514;
          }
          e = d;
          d = c;
          c = b << 30 | b >>> 2;
          b = a;
          a = t;
        }
        H[0] = H[0] + a | 0;
        H[1] = H[1] + b | 0;
        H[2] = H[2] + c | 0;
        H[3] = H[3] + d | 0;
        H[4] = H[4] + e | 0;
      },
      _doFinalize: function () {
        var data = this._data;
        var dataWords = data.words;
        var nBitsTotal = this._nDataBytes * 8;
        var nBitsLeft = data.sigBytes * 8;
        dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
        dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 4294967296);
        dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
        data.sigBytes = dataWords.length * 4;
        this._process();
        return this._hash;
      },
      clone: function () {
        var clone = Hasher.clone.call(this);
        clone._hash = this._hash.clone();
        return clone;
      }
    });
  C.SHA1 = Hasher._createHelper(SHA1);
  C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
}());
'use strict';
angular.module('angular-stackmob.stackmob', [
  'angular-stackmob.httpInterceptor',
  'angular-stackmob.utils',
  'ngResource'
]).config([
  '$httpProvider',
  function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  }
]).provider('Stackmob', [
  'stackmobHttpInterceptorProvider',
  function (stackmobHttpInterceptorProvider) {
    var apiKey = 'Hello';
    var env = 'LOL';
    var schemaUrl = 'http://api.stackmob.com/';
    function Stackmob($log, $resource, $http) {
      var refreshLoginInformation = function (data) {
        localStorage.setItem('stackmob.access_token', data.data.access_token);
        localStorage.setItem('stackmob.mac_key', data.data.mac_key);
        localStorage.setItem('stackmob.user', JSON.stringify(data.data.stackmob.user));
        localStorage.setItem('stackmob.refresh_token', data.data.refresh_token);
        localStorage.setItem('stackmob.expires_in', new Date().getTime() + data.data.expires_in * 1000);
      };
      return {
        refreshToken: function () {
          var promise = $http.post(schemaUrl + 'user/refreshToken', {}, {
              params: {
                refresh_token: localStorage.getItem('stackmob.refresh_token'),
                grant_type: 'refresh_token',
                token_type: 'mac',
                mac_algorithm: 'hmac-sha-1'
              },
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
          promise.then(refreshLoginInformation);
          return promise;
        },
        logout: function () {
          var promise = $http.get(schemaUrl + 'user/logout');
          promise.then(function () {
            localStorage.removeItem('stackmob.access_token');
            localStorage.removeItem('stackmob.mac_key');
            localStorage.removeItem('stackmob.user');
            localStorage.removeItem('stackmob.refresh_token');
            localStorage.removeItem('stackmob.expires_in');
          });
          return promise;
        },
        login: function (username, pw) {
          var promise = $http.post(schemaUrl + 'user/accessToken', {}, {
              params: {
                username: username,
                password: pw,
                token_type: 'mac'
              },
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
          promise.then(refreshLoginInformation);
          return promise;
        },
        schema: function (schemaName, primaryKey) {
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
              params: { _relations: '_' }
            };
          var deepUpdate = {
              method: 'PUT',
              isArray: false,
              params: { _relations: '_' }
            };
          var deepSave = { method: 'PUT' };
          update.params[pk] = '@' + pk;
          deleteMethod.params[pk] = '@' + pk;
          var resourceParams = {};
          resourceParams[pk] = '@' + pk;
          var resource = $resource(schemaUrl + schemaName + '/:' + pk, resourceParams, {
              update: update,
              create: create,
              deepSave: deepSave,
              deepCreate: deepCreate,
              deepUpdate: deepUpdate,
              'delete': deleteMethod
            });
          resource.prototype.$deepSave = function (args) {
            if (!this[pk]) {
              return this.$deepCreate(args);
            } else {
              return this.$deepUpdate(args);
            }
          };
          resource.prototype.$save = function (args) {
            for (var k in this) {
              if (this.hasOwnProperty(k)) {
                if (k.indexOf('$$') === -1 && typeof this[k] === 'object') {
                  if (this[k] instanceof Array) {
                    var shouldRemove = false;
                    angular.forEach(this[k], function (item) {
                      if (typeof item === 'object') {
                        shouldRemove = true;
                      }
                    });
                    if (shouldRemove) {
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
    this.setApiKey = function (s) {
      apiKey = s;
      stackmobHttpInterceptorProvider.setApiKey(s);
    };
    this.setEnvironment = function (s) {
      env = s;
      stackmobHttpInterceptorProvider.setEnvironment(s);
    };
    this.setSchemaUrl = function (s) {
      schemaUrl = s;
    };
    this.getSchemaUrl = function () {
      return schemaUrl;
    };
    this.getApiKey = function () {
      return apiKey;
    };
    this.getEnvironment = function () {
      return env;
    };
    this.$get = [
      '$log',
      '$resource',
      '$http',
      'stackmobHttpInterceptor',
      function ($log, $resource, $http, stackmobHttpInterceptor) {
        if (apiKey === 'Hello') {
          $log.error('Must set API key before using.');
          return;
        }
        if (env === 'LOL') {
          $log.error('Must set environment before using.');
          return;
        }
        return new Stackmob($log, $resource, $http);
      }
    ];
  }
]);
'use strict';
angular.module('angular-stackmob.httpInterceptor', ['angular-stackmob.utils']).provider('stackmobHttpInterceptor', function () {
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
      'request': function (config) {
        if (config.url.indexOf('api.stackmob.com') > -1) {
          var contentType = '';
          if (config.url.indexOf('accessToken') > -1) {
            contentType = 'Content-Type:application/x-www-form-urlencoded';
          } else {
            contentType = 'application/json';
          }
          config.headers['X-StackMob-API-Key'] = apiKey;
          config.headers['X-StackMob-Proxy-Plain'] = 'stackmob-api';
          config.headers['X-StackMob-User-Agent'] = navigator.userAgent;
          config.headers['Content-Type'] = contentType;
          config.headers['Accept'] = 'application/vnd.stackmob+json; version=' + env;
          var apiKeyHeader = 'X-StackMob-API-Key-' + apiKey;
          config.headers[apiKeyHeader] = 1;
          if (config.params && config.params._relations) {
            if (config.params._relations !== '_') {
              config.headers['X-StackMob-Relations'] = config.params._relations;
            }
            delete config.params._relations;
          }
          if (config.params && config.params._orderBy) {
            config.headers['X-StackMob-OrderBy'] = config.params._orderBy;
            delete config.params._orderBy;
          }
          if (config.params && config.params._cascadeDelete) {
            config.headers['X-StackMob-CascadeDelete'] = config.params._cascadeDelete;
            delete config.params._cascadeDelete;
          }
          if (typeof config.params === 'object') {
            if (Object.keys(config.params).length === 0) {
              delete config.params;
            }
          }
          var params = encodeURI(!!config.params ? '?' + Utils.serializeObject(config.params) : '');
          config.url = config.url + params;
          delete config.params;
          config.headers['Authorization'] = Utils.getAuthHeader(config.method, config.url);
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
  this.$get = [
    '$q',
    'Utils',
    function ($q, Utils) {
      return new Interceptor($q, Utils);
    }
  ];
});
'use strict';
angular.module('angular-stackmob.utils', []).service('Utils', function Utils() {
  this.serializeObject = function (obj) {
    var pairs = [];
    for (var prop in obj) {
      if (!obj.hasOwnProperty(prop)) {
        continue;
      }
      pairs.push(prop + '=' + obj[prop]);
    }
    return pairs.join('&');
  };
  this.createBaseString = function (ts, nonce, method, uri, host, port) {
    var nl = '\n';
    return ts + nl + nonce + nl + method + nl + uri + nl + host + nl + port + nl + nl;
  };
  this.generateMAC = function (httpVerb, accessToken, macKey, hostWithPort, url, _ts, _nonce, _hash) {
    var splitHost = hostWithPort.split(':');
    var hostNoPort = splitHost.length > 1 ? splitHost[0] : hostWithPort;
    var port = splitHost.length > 1 ? splitHost[1] : 80;
    var ts = _ts || Math.round(new Date().getTime() / 1000);
    var nonce = _nonce || 'n' + Math.round(Math.random() * 10000);
    var base = this.createBaseString(ts, nonce, httpVerb, url, hostNoPort, port);
    var hash = CryptoJS.HmacSHA1(base, macKey);
    var mac = _hash || hash.toString(CryptoJS.enc.Base64);
    return 'MAC id="' + accessToken + '",ts="' + ts + '",nonce="' + nonce + '",mac="' + mac + '"';
  };
  this.getAuthHeader = function (httpVerb, url) {
    var host = 'http://api.stackmob.com/';
    var path = url.replace(new RegExp(host, 'g'), '/');
    var hostWithPort = host.replace(new RegExp('^http://|^https://', 'g'), '').replace(new RegExp('/'), '');
    var accessToken = localStorage.getItem('stackmob.access_token');
    var macKey = localStorage.getItem('stackmob.mac_key');
    if (accessToken && macKey) {
      var authHeader = this.generateMAC(httpVerb, accessToken, macKey, hostWithPort, path);
      return authHeader;
    }
  };
});
angular.module('angular-stackmob', ['angular-stackmob.stackmob']).config([
  '$httpProvider',
  function ($httpProvider) {
    $httpProvider.interceptors.push('stackmobHttpInterceptor');
  }
]);