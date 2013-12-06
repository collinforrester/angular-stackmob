'use strict';

describe('Service: Stackmob', function() {

  var ua = window.navigator.userAgent;
  var provider;
  // load the service's module
  beforeEach(module('angular-stackmob', function($httpProvider, StackmobProvider) {
    provider = StackmobProvider;
    StackmobProvider.setApiKey('xxx');
    StackmobProvider.setEnvironment('0');
    $httpProvider.interceptors.push('stackmobHttpInterceptor');
  }));

  afterEach(inject(function($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    localStorage.clear();
  }));

  // not sure how to test this
  xit('should have public APIs to set things', function() {
    expect(provider.setApiKey).toBeDefined();
    expect(provider.setSchemaUrl).toBeDefined();
    expect(provider.setEnvironment).toBeDefined();
    expect(provider.getApiKey).toBeDefined();
    expect(provider.getSchemaUrl).toBeDefined();
    expect(provider.getEnvironment).toBeDefined();
    expect(typeof provider.setApiKey).toBe('function');
    expect(typeof provider.setSchemaUrl).toBe('function');
    expect(typeof provider.setEnvironment).toBe('function');
    expect(typeof provider.getApiKey).toBe('function');
    expect(typeof provider.getSchemaUrl).toBe('function');
    expect(typeof provider.getEnvironment).toBe('function');
  });

  it('should force one to set API key before using', inject(function($log, _Stackmob_) {
    expect($log.error.logs).not.toContain(['Must set API key before using.']);
  }));

  it('should force one to set ENV before using', inject(function($log, _Stackmob_) {
    expect($log.error.logs).not.toContain(['Must set environment before using.']);
  }));

  it('should be able to log a user into stackmob oauth 2 style', inject(function(_Stackmob_, $httpBackend) {
    expect(_Stackmob_.login).not.toBe(undefined);
    var user = {
      "username": "collin",
      "lastmoddate": 1385009161669,
      "user_id": "collin",
      "sm_owner": "user/collin",
      "createddate": 1384043194085
    };
    $httpBackend.expectPOST('http://api.stackmob.com/user/accessToken?username=collin&password=asdf&token_type=mac').respond(201, {
      "access_token": "lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK",
      "mac_key": "glyuU932UhqhMbozQUMwWG1TGzSmydHZ",
      "mac_algorithm": "hmac-sha-1",
      "token_type": "mac",
      "expires_in": 3600,
      "refresh_token": "5N114k3uP2dCNDqyb4xLupinSfOtoErI",
      "stackmob": {
        "user": user
      }
    });
    _Stackmob_.login('collin', 'asdf');
    $httpBackend.flush();

    expect(localStorage.getItem('stackmob.access_token')).toBe('lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK');
    expect(localStorage.getItem('stackmob.mac_key')).toBe('glyuU932UhqhMbozQUMwWG1TGzSmydHZ');
    expect(localStorage.getItem('stackmob.user')).toBe(JSON.stringify(user));
    expect(localStorage.getItem('stackmob.refresh_token')).toBe('5N114k3uP2dCNDqyb4xLupinSfOtoErI');
  }));

  it('should instantiate by taking the name of the schema to hit against', inject(function($log, _Stackmob_) {
    var Users = _Stackmob_.schema('users');
    expect(Users).not.toBe(undefined);
  }));

  it('should change content-type when refreshing token', inject(function($httpBackend, $log, _Stackmob_) {
    localStorage.setItem('stackmob.refresh_token', 'abc');
    $httpBackend
      .expectPOST('http://api.stackmob.com/user/refreshToken?refresh_token=abc&grant_type=refresh_token&token_type=mac&mac_algorithm=hmac-sha-1', {}, {
        "X-StackMob-API-Key": "xxx",
        "X-StackMob-Proxy-Plain": "stackmob-api",
        "X-StackMob-User-Agent": ua,
        "Content-Type": "application/json",
        "Accept": "application/vnd.stackmob+json; version=0",
        "X-StackMob-API-Key-xxx": 1
      }).respond(201, {
        "access_token": "lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK",
        "mac_key": "glyuU932UhqhMbozQUMwWG1TGzSmydHZ",
        "mac_algorithm": "hmac-sha-1",
        "token_type": "mac",
        "expires_in": 3600,
        "refresh_token": "5N114k3uP2dCNDqyb4xLupinSfOtoErI",
        "stackmob": {
          "user": {
            "username": "collin",
            "lastmoddate": 1385009161669,
            "user_id": "collin",
            "sm_owner": "user/collin",
            "createddate": 1384043194085
          }
        }
      });
    _Stackmob_.refreshToken();
    $httpBackend.flush();

    expect(localStorage.getItem('stackmob.access_token')).toBe('lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK');
    expect(localStorage.getItem('stackmob.mac_key')).toBe('glyuU932UhqhMbozQUMwWG1TGzSmydHZ');
    expect(localStorage.getItem('stackmob.user')).not.toBe(undefined);
    expect(localStorage.getItem('stackmob.refresh_token')).toBe('5N114k3uP2dCNDqyb4xLupinSfOtoErI');
  }));

  it('should be able to logout', inject(function($httpBackend, _Stackmob_) {
    localStorage.setItem('stackmob.access_token', 42);
    localStorage.setItem('stackmob.mac_key', 42);
    localStorage.setItem('stackmob.user', 42);
    localStorage.setItem('stackmob.refresh_token', 42);
    localStorage.setItem('stackmob.expires_in', 42);
    $httpBackend.expectGET('http://api.stackmob.com/user/logout').respond(201, '');
    _Stackmob_.logout();
    $httpBackend.flush();
    expect(localStorage.getItem('stackmob.access_token')).toBe(null);
    expect(localStorage.getItem('stackmob.mac_key')).toBe(null);
    expect(localStorage.getItem('stackmob.user')).toBe(null);
    expect(localStorage.getItem('stackmob.refresh_token')).toBe(null);
    expect(localStorage.getItem('stackmob.expires_in')).toBe(null);
  }));

  it('should be able to create (POST) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectPOST('http://api.stackmob.com/thing', {
      title: 'New thing'
    }, {
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "Content-Type": "application/json",
      "Accept": "application/vnd.stackmob+json; version=0",
      "X-StackMob-API-Key-xxx": 1
    }).respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var newThing = new Thing();
    newThing.title = 'New thing';
    newThing.$save();
    $httpBackend.flush();
  }));

  // Stackmob docs are wrong.
  // http://api.stackmob.com/thing/1 is valid to hit to PUT
  it('should be able to modify (PUT) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      thing_id: 1
    });
    $httpBackend.expectPUT('http://api.stackmob.com/thing/1', {
      title: 'New thing',
      thing_id: 1
    }).respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var thing1 = Thing.get({
      thing_id: 1
    }, function() {
      thing1.title = 'New thing';
      thing1.$save();
    });
    $httpBackend.flush();
  }));

  it('should be able to read (GET) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      thing_id: 1
    });
    var Thing = _Stackmob_.schema('thing');
    var thing1 = Thing.get({
      thing_id: 1
    });
    $httpBackend.flush();
    expect(thing1.title).toBe('No title');
  }));

  // Stackmob docs are wrong.
  // http://api.stackmob.com/thing/1 is valid to hit to DELETE
  it('should be able to remove (DELETE) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectDELETE('http://api.stackmob.com/thing/1').respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var thing1 = new Thing({thing_id: 1});
    thing1.$delete();
    $httpBackend.flush();
  }));

  // allows for a custom _id field
  it('should be able to use a different primary key', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/user/jdoe').respond(201, {});
    var User = _Stackmob_.schema('user', 'username');
    User.get({username: 'jdoe'});
    $httpBackend.flush();
  }));

  // should be able to build queries?
  // Stackmob
  //    .query()
  //    .equals('name','collin')
  //    .greaterThan('age',20)
  //    .contains([1,2,3],4);
});
