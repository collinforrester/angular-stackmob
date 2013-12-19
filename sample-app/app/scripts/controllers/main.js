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
    $scope.addNewChild = function() {
      var Person = Stackmob.schema('person');
      var newChild = new Person({
        name: $scope.newChild.name,
        age: $scope.newChild.age
      });
      var results = Person.query({name: $scope.personToAddTo.name }, function() {
        if(results.length) {
          var owner = results[0];
          if(owner.children) {
            owner.children.push(newChild);
          } else {
            owner.children = [newChild];
          }
          owner.$deepSave({_relations:'children=person'}).then(function() {
            $scope.newChild = {};
            $scope.personToAddTo = {};
          });
        }
      });
    };
    $scope.createPerson = function() {

      var Person = Stackmob.schema('person');
      var newPerson = new Person();
      newPerson.name = $scope.newPerson.name;
      newPerson.age = $scope.newPerson.age;
      newPerson.$save();
      $scope.newPerson = {};
    };
  	$scope.queryPeople = function() {
  		var Person = Stackmob.schema('person');
  		$scope.people = Person.query();
  	};
    $scope.updatePerson = function() {
      $scope.person.$update();
      $scope.person = {};
    };
    $scope.getPersonByName = function() {
      var Person = Stackmob.schema('person');
      var results = Person.query({name:$scope.person.name}, function() {
        console.log('back', results);
        if(results.length > 0) {
          $scope.person = results[0];
        }
      });
    };
    $scope.deletePerson = function() {
      $scope.deletedPerson.$delete();
      $scope.deletedPerson = {};
    };
    $scope.getPersonForDelete = function() {
      var Person = Stackmob.schema('person');
      var results = Person.query({title:$scope.deletedPerson.title}, function() {
        if(results.length > 0) {
          $scope.deletedPerson = results[0];
        }
      });
    };
  });
