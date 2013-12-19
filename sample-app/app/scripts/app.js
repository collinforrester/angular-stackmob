'use strict';

angular.module('sampleAppApp', [
  'ngRoute',
  'ngResource',
  'angular-stackmob'
])
  .config(function ($routeProvider, $httpProvider, StackmobProvider) {
    StackmobProvider.setApiKey('0ac1c6a2-912b-46dd-b43b-8aa06ab73fe4');
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
