'use strict';

angular.module('sampleAppApp', [
  'ngRoute',
  'ngResource',
  'angular-stackmob'
])
  .config(function ($routeProvider, $httpProvider, StackmobProvider) {
    StackmobProvider.setApiKey('YOUR_API_KEY');
    StackmobProvider.setEnvironment('0');

    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
