# angular-stackmob
## What is this?
In another project, our stack was Angular backed by StackMob.  StackMob is amazing.  Big downside was that the StackMob JavaScript SDK is written to work best with Backbone and jQuery.  Neither of which are required with Angular.

angular-stackmob is my attempt at bridging the gap between AngularJS and Stackmob and making the two easier to use together.  This is simply an abstraction written on top of the StackMob REST API.  Anyone can/could/and have probably already written this and in a better way.  I searched and could not find an existing solution.

For the longest time we used the StackMob JS SDK side by side with Angular.  This caused several issues and alot of extra code.

## Installation
To install angular-stackmob:
* Clone the repo
* `npm install && bower install`
* `grunt test` to run the unit test
* There is a sample application included inside of `sample-app/` for convenience. `cd sample-app` and `bower install && npm install` to install the sample application

## Usage
* Install via bower, `bower install --save angular-stackmob`
* Include `angular-stackmob.js` on your page.
* In the `.config()` of your module, you need to set your StackMob publicKey and environment

```javascript
angular.module('yourmodule',['angular-stackmob'])
  .config(function ($httpProvider, StackmobProvider) {
      StackmobProvider.setApiKey('YOUR_PUBLIC_KEY');
      StackmobProvider.setEnvironment('0');
      // optionally set localStorage key namespace
      StackmobProvider.setLocalStorageKey('namespace');
  });
```
* Now inject the service in your controller/service/code. The first thing you'll need to do is log in.

```javascript
angular.module('yourapp')
  .controller('MainCtrl', function ($scope, Stackmob) {
      Stackmob.login('johndoe', 'secret1').then(function(loggedInUser) {
  		// you're now logged in!
  	});
  });

```
* Once you've logged the user in, you can use `Stackmob.schema()` to query any schemas you have set up in StackMob.

```javascript
angular.module('yourapp')
  .controller('MainCtrl', function ($scope, Stackmob) {
    Stackmob.login('test', 'test').then(function(loggedInUser) {
      // you're now logged in!
      var Things = Stackmob.schema('things');
   	  var allTheThings = Things.query();
  	});
  });
```
* If the login expires (it will at 1 hour automatically), use `Stackmob.refreshToken()` to log the user back in without reprompting for credentials.

```javascript
angular.module('yourapp')
  .controller('MainCtrl', function ($scope, Stackmob) {
    Stackmob.refreshToken().then(function() {
      // you're now refreshed
      var Things = Stackmob.schema('things');
   	  var allTheThings = Things.query();
  	});
  });
```

* Keep in mind that anything returned by Stackmob.schema() is a glorified angular $resource object.
* The current API is not a 1-to-1 replacement.

## Roadmap
* implement all Stackmob JavaScript SDK functions (resetPassword, forgotPassword, etc)
* support to provide custom params and actions to the resource object returned by `Stackmob.schema()`
* .queryBuilder() of some type to set get params for you
* directive - set schema as directive attribute to have directive populate and handle model for you
* Support oAuth 1.0

## Contributing
Pull requests are welcomed and encouraged.  Try your best to include unit tests for the new code you're implementing and things will go much faster.

Also please make sure to have the EditorConfig plugin installed in whatever editor you use (if applicable).  This will help keep the diffs manageable (if you're contributing from windows its a big deal).

### Commit style guide
* feat (feature)
* fix (bug fix)
* docs (documentation)
* style (formatting, missing semi colons, ...)
* refactor
* test (when adding missing tests)
* chore (maintain)

## License
The MIT License (MIT)

Copyright (c) [2013] [Collin Forrester]
