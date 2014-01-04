'use strict';

describe('Service: Stackmob', function() {

  var ua = window.navigator.userAgent;
  var provider;
  var mockUser1;
  var mockLoggedInUser;
  var mockedHeaders;

  // load the service's module
  beforeEach(module('angular-stackmob', function($httpProvider, StackmobProvider) {
    provider = StackmobProvider;
    StackmobProvider.setApiKey('xxx');
    StackmobProvider.setEnvironment('0');
    StackmobProvider.setLocalStorageKey('stackmob.oauth2');
    $httpProvider.interceptors.push('stackmobHttpInterceptor');
    mockUser1 = {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      thing_id: 1
    };
    mockLoggedInUser = {
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
    };
    mockedHeaders = {
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "Content-Type": "application/json",
      "Accept": "application/vnd.stackmob+json; version=0",
      "X-StackMob-API-Key-xxx": 1
    };
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

  it('should be able to POST forgot password', inject(function(_Stackmob_, $httpBackend) {
    $httpBackend.expectPOST('http://api.stackmob.com/user/forgotPassword', {
      username: 'collin'
    }).respond(201, '');
    _Stackmob_.forgotPassword('collin');
    $httpBackend.flush();
  }));

  it('should be able to POST for custom code', inject(function(_Stackmob_, $httpBackend) {
    $httpBackend.expectPOST('http://api.stackmob.com/sendgrid/email', {
      to: 'e@mail.com',
      text: 'hello world'
    }).respond(201, '');
    _Stackmob_.customCode('POST', 'sendgrid/email', {
      to: 'e@mail.com',
      text: 'hello world'
    });
    $httpBackend.flush();
  }));

  it('should be able to POST reset password', inject(function(_Stackmob_, $httpBackend) {
    $httpBackend.expectPOST('http://api.stackmob.com/user/resetPassword', {
      "old": {
        "password": "oldpw"
      },
      "new": {
        "password": "newpw"
      }
    }).respond(201, '');
    _Stackmob_.resetPassword('oldpw', 'newpw');
    $httpBackend.flush();
  }));

  it('should be able to log a user into stackmob oauth 2 style', inject(function(_Stackmob_, $httpBackend) {
    expect(_Stackmob_.login).not.toBe(undefined);
    $httpBackend.expectPOST('http://api.stackmob.com/user/accessToken?username=collin&password=asdf&token_type=mac').respond(201, mockLoggedInUser);
    _Stackmob_.login('collin', 'asdf');
    $httpBackend.flush();

    expect(localStorage.getItem('stackmob.oauth2.access_token')).toBe('lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK');
    expect(localStorage.getItem('stackmob.oauth2.mac_key')).toBe('glyuU932UhqhMbozQUMwWG1TGzSmydHZ');
    expect(localStorage.getItem('stackmob.oauth2.user')).toBe(JSON.stringify(mockLoggedInUser.stackmob.user));
    expect(localStorage.getItem('stackmob.oauth2.refresh_token')).toBe('5N114k3uP2dCNDqyb4xLupinSfOtoErI');
  }));

  it('should be able to log a user into stackmob oauth 2 style', inject(function(_Stackmob_, $httpBackend) {
    expect(_Stackmob_.loginWithTemporaryAndResetPassword).not.toBe(undefined);
    $httpBackend.expectPOST('http://api.stackmob.com/user/accessToken?password=temppassword&username=johndoe&new_password=newpassword').respond(201, mockLoggedInUser);
    _Stackmob_.loginWithTemporaryAndResetPassword('johndoe', 'temppassword', 'newpassword');
    $httpBackend.flush();

    expect(localStorage.getItem('stackmob.oauth2.access_token')).toBe('lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK');
    expect(localStorage.getItem('stackmob.oauth2.mac_key')).toBe('glyuU932UhqhMbozQUMwWG1TGzSmydHZ');
    expect(localStorage.getItem('stackmob.oauth2.user')).toBe(JSON.stringify(mockLoggedInUser.stackmob.user));
    expect(localStorage.getItem('stackmob.oauth2.refresh_token')).toBe('5N114k3uP2dCNDqyb4xLupinSfOtoErI');
  }));

  it('should instantiate by taking the name of the schema to hit against', inject(function($log, _Stackmob_) {
    var Users = _Stackmob_.schema('users');
    expect(Users).not.toBe(undefined);
  }));

  it('should change content-type when refreshing token', inject(function($httpBackend, $log, _Stackmob_) {
    localStorage.setItem('stackmob.oauth2.refresh_token', 'abc');
    $httpBackend
      .expectPOST('http://api.stackmob.com/user/refreshToken?refresh_token=abc&grant_type=refresh_token&token_type=mac&mac_algorithm=hmac-sha-1', {}, mockedHeaders).respond(201, mockLoggedInUser);
    _Stackmob_.refreshToken();
    $httpBackend.flush();

    expect(localStorage.getItem('stackmob.oauth2.access_token')).toBe('lkkTwTm951R1yqQj3FxIiwaiVVn7ZLmK');
    expect(localStorage.getItem('stackmob.oauth2.mac_key')).toBe('glyuU932UhqhMbozQUMwWG1TGzSmydHZ');
    expect(localStorage.getItem('stackmob.oauth2.user')).not.toBe(undefined);
    expect(localStorage.getItem('stackmob.oauth2.refresh_token')).toBe('5N114k3uP2dCNDqyb4xLupinSfOtoErI');
  }));

  it('should be able to logout', inject(function($httpBackend, _Stackmob_) {
    localStorage.setItem('stackmob.oauth2.access_token', 42);
    localStorage.setItem('stackmob.oauth2.mac_key', 42);
    localStorage.setItem('stackmob.oauth2.user', 42);
    localStorage.setItem('stackmob.oauth2.refresh_token', 42);
    localStorage.setItem('stackmob.oauth2.expires_in', 42);
    $httpBackend.expectGET('http://api.stackmob.com/user/logout').respond(201, '');
    _Stackmob_.logout();
    $httpBackend.flush();
    expect(localStorage.getItem('stackmob.oauth2.access_token')).toBe(null);
    expect(localStorage.getItem('stackmob.oauth2.mac_key')).toBe(null);
    expect(localStorage.getItem('stackmob.oauth2.user')).toBe(null);
    expect(localStorage.getItem('stackmob.oauth2.refresh_token')).toBe(null);
    expect(localStorage.getItem('stackmob.oauth2.expires_in')).toBe(null);
  }));

  it('should be able to create (POST) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectPOST('http://api.stackmob.com/thing', {
      title: 'New thing'
    }, mockedHeaders).respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var newThing = new Thing();
    newThing.title = 'New thing';
    newThing.$save();
    $httpBackend.flush();
  }));

  // Stackmob docs are wrong.
  // http://api.stackmob.com/thing/1 is valid to hit to PUT
  it('should be able to modify (PUT) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, mockUser1);
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
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, mockUser1);
    var Thing = _Stackmob_.schema('thing');
    var thing1 = Thing.get({
      thing_id: 1
    });
    $httpBackend.flush();
    expect(thing1.title).toBe('No title');
  }));

  it('should be able to query (GET) correctly with orderBy', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing', {
      "Accept": "application/vnd.stackmob+json; version=0",
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "X-StackMob-API-Key-xxx": 1,
      "X-StackMob-OrderBy": "createddate:desc,dateout:asc,datein:desc"
    }).respond(201, [mockUser1]);
    var Thing = _Stackmob_.schema('thing');
    var thing1 = Thing.query({
      _orderBy: 'createddate:desc,dateout:asc,datein:desc'
    });
    $httpBackend.flush();
  }));

  // Stackmob docs are wrong.
  // http://api.stackmob.com/thing/1 is valid to hit to DELETE
  it('should be able to remove (DELETE) correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectDELETE('http://api.stackmob.com/thing/1').respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var thing1 = new Thing({
      thing_id: 1
    });
    thing1.$delete();
    $httpBackend.flush();
  }));

  it('should be able to remove (DELETE) deep objects correctly', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectDELETE('http://api.stackmob.com/thing/1/childThings/1,2,3,4', {
      "Accept": "application/vnd.stackmob+json; version=0",
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "X-StackMob-API-Key-xxx": 1,
      "X-StackMob-CascadeDelete": true
    }).respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var thing1 = new Thing({
      thing_id: 1,
      childThings: [1,2,3,4]
    });
    thing1.$delete({
      _cascadeDelete: {
        schema: 'childThings',
        values: thing1.childThings
      }
    });
    $httpBackend.flush();
  }));

  // allows for a custom _id field
  it('should be able to use a different primary key', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/user/jdoe').respond(201, {});
    var User = _Stackmob_.schema('user', 'username');
    User.get({
      username: 'jdoe'
    });
    $httpBackend.flush();
  }));

  it('should remove any relationship type object from a $save request so stackmob does not throw an invalid schema error', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      parentThing: {
        thing_id: 5,
        title: 'Parent'
      },
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

  it('should remove any relationship type arrays from a $save request so stackmob does not throw an invalid schema error', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      childrenThings: [{
        thing_id: 5,
        title: 'Parent'
      }, {
        thing_id: 5,
        title: 'Parent'
      }],
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

  it('should remove any relationship type arrays from a $save request so stackmob does not throw an invalid schema error', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      childrenThings: ['asdfasdf24f24222', {
        thing_id: 5,
        title: 'Parent'
      }],
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

  it('should NOT remove any valid relationship type arrays from a $save request so stackmob does not throw an invalid schema error', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectGET('http://api.stackmob.com/thing/1').respond(201, {
      sm_owner: 'user1',
      lastmoddate: 1385009161669,
      createddate: 1384043194085,
      title: 'No title',
      childrenThings: ['5adbasdf2', '54t45gaerg2'],
      thing_id: 1
    });
    $httpBackend.expectPUT('http://api.stackmob.com/thing/1', {
      title: 'New thing',
      thing_id: 1,
      childrenThings: ['5adbasdf2', '54t45gaerg2']
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

  it('should be able to add relationships', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectPOST('http://api.stackmob.com/thing', {
      title: 'New thing',
      childThing: {
        title: 'I am the child'
      }
    }, {
      "Accept": "application/vnd.stackmob+json; version=0",
      "Content-Type": "application/json",
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "X-StackMob-API-Key-xxx": 1,
      "X-StackMob-Relations": "childThing=thing"
    })
      .respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var newThing = new Thing();
    newThing.title = 'New thing';
    newThing.childThing = {
      title: 'I am the child'
    };
    newThing.$deepSave({
      _relations: 'childThing=thing'
    });
    $httpBackend.flush();
  }));

  it('should be able to add multiple (array) relationships', inject(function($httpBackend, _Stackmob_) {
    $httpBackend.expectPOST('http://api.stackmob.com/thing', {
      title: 'New thing',
      father: {
        title: 'I am father',
        children: [{
          title: 'I am the child'
        }, {
          title: 'I am the child2'
        }]
      }
    }, {
      "Accept": "application/vnd.stackmob+json; version=0",
      "Content-Type": "application/json",
      "X-StackMob-API-Key": "xxx",
      "X-StackMob-Proxy-Plain": "stackmob-api",
      "X-StackMob-User-Agent": ua,
      "X-StackMob-API-Key-xxx": 1,
      "X-StackMob-Relations": "father=thing&father.children=thing"
    })
      .respond(201, '');
    var Thing = _Stackmob_.schema('thing');
    var newThing = new Thing();
    newThing.title = 'New thing';
    newThing.father = {
      title: 'I am father',
      children: [{
        title: 'I am the child'
      }, {
        title: 'I am the child2'
      }]
    };
    newThing.$deepSave({
      _relations: 'father=thing&father.children=thing'
    });
    $httpBackend.flush();
  }));

  it('does not call refreshLoginInformation on a failed call', inject(function(_Stackmob_, $httpBackend) {
    expect(_Stackmob_._refreshLoginInformation).not.toBe(undefined);
    spyOn(_Stackmob_, '_refreshLoginInformation');
    $httpBackend.expectPOST('http://api.stackmob.com/user/accessToken?username=collin&password=asdf&token_type=mac').respond(401, {error_description: 'Invalid username/password.'});
    _Stackmob_.login('collin', 'asdf');
    $httpBackend.flush();
    expect(_Stackmob_._refreshLoginInformation).not.toHaveBeenCalled();
  }));

  // should be able to build queries?
  // Stackmob
  //    .query()
  //    .equals('name','collin')
  //    .greaterThan('age',20)
  //    .contains([1,2,3],4);
});
