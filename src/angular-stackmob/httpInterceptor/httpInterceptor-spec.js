'use strict';

describe('Service: Stackmobhttpinterceptor', function () {

  // load the service's module
  beforeEach(module('angular-stackmob.httpInterceptor'));

  // instantiate service
  var Stackmobhttpinterceptor;
  var provider;
  beforeEach(function() {
    var fakeModule = angular.module('fake',['angular-stackmob.httpInterceptor'])
      .config(function(stackmobHttpInterceptorProvider) {
        provider = stackmobHttpInterceptorProvider;
        console.log(provider);
      });
  });

  it('should be something', inject(function (_stackmobHttpInterceptor_) {
    Stackmobhttpinterceptor = _stackmobHttpInterceptor_;
    expect(!!Stackmobhttpinterceptor).toBe(true);
  }));

  // TODO - not sure how to test the provider functions
  xit('can set/get API key', function () {
    expect(provider.getApiKey()).toBe('Hello');
    expect(provider.setApiKey('1')).toBe(provider.getApiKey());
  });

});
