'use strict';

describe('Service: Utils', function () {

  // load the service's module
  beforeEach(module('angular-stackmob.utils'));

  // instantiate service
  var Utils;
  beforeEach(inject(function (_Utils_) {
    Utils = _Utils_;
  }));

  it('should be something', function () {
    expect(!!Utils).toBe(true);
  });

  it('should be able to serialize 1 level deep objects', function() {
    expect(Utils.serializeObject({help:1,ok:'then'})).toBe('help=1&ok=then');
  });

  it('should create a valid base string', function() {
    var expected = '1\n'+
    '123\n'+
    'GET\n'+
    '/users\n'+
    'api.stackmob.com\n'+
    '80\n\n';
    expect(Utils.createBaseString(1,123,'GET', '/users','api.stackmob.com', '80')).toBe(expected);
  });

  it('should generate a valid MAC', function() {
    var expected = 'MAC id="1accestoken1",ts="' +
    '1",nonce="123",mac="mymac123"';
    var actual = Utils.generateMAC('GET','1accestoken1', 'macKey', 'api.stackmob.com', '/employee?_expand=1',1 ,123, 'mymac123');
    expect(actual).toBe(expected);
  });

});
