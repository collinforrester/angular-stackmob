angular.module('angular-stackmob',['angular-stackmob.stackmob']).config(function($httpProvider) {
  $httpProvider.interceptors.push('stackmobHttpInterceptor');
});
