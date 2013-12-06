'use strict';

angular.module('sampleAppApp')
  .controller('MainCtrl', function ($scope, Stackmob) {
  	$scope.loggedInUser = JSON.parse(localStorage.getItem('stackmob.user')) || {};
  	$scope.login = function() {
  		Stackmob.login($scope.user.username, $scope.user.password)
  			.then(function(data) {
  				$scope.loggedInUser = data.data.stackmob.user;
  				$scope.user = {};
  			});
  	};
    $scope.createEmployee = function() {

      var Employee = Stackmob.schema('employee');
      var newEmployee = new Employee();
      newEmployee.name = $scope.newEmployee.name;
      newEmployee.email = $scope.newEmployee.email;
      newEmployee.title = $scope.newEmployee.title;
      newEmployee.$save();
      $scope.newEmployee = {};
    };
  	$scope.queryEmployees = function() {
  		var Employee = Stackmob.schema('employee');
  		$scope.employees = Employee.query();
  	};
    $scope.updateEmployee = function() {
      $scope.employee.$update();
      $scope.employee = {};
    };
    $scope.getEmployeeByName = function() {
      var Employee = Stackmob.schema('employee');
      var results = Employee.query({name:$scope.employee.name}, function() {
        if(results.length > 0) {
          $scope.employee = results[0];
        }
      });
    };
    $scope.deleteEmployee = function() {
      $scope.deletedEmployee.$delete();
      $scope.deletedEmployee = {};
    };
    $scope.getEmployeeByTitle = function() {
      var Employee = Stackmob.schema('employee');
      var results = Employee.query({title:$scope.deletedEmployee.title}, function() {
        if(results.length > 0) {
          $scope.deletedEmployee = results[0];
        }
      });
    };
  });
