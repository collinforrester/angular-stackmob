'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  var karmaConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, keepalive: true };
    var travisOptions = process.env.TRAVIS && { browsers: ['Firefox'], reporters: 'dots' };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  var banner = '/**\n'+
                '* angular-stackmob.js\n'+
                '* MIT License\n'+
                '* Copyright 2013 Collin Forrester\n**/\n\n';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    yeoman: {
      // configurable paths
      app: require('./bower.json').appPath || 'app',
      dist: 'dist'
    },

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      js: {
        files: ['{.tmp,<%= yeoman.app %>}/{,*/}*.js'],
        tasks: ['newer:jshint:all']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        '<%= yeoman.app %>/angular-stackmob/{,*/}*.js'
      ],
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngmin: {
      dist: {
        files: [{
          src: '<%= yeoman.dist %>/angular-stackmob.js',
          dest: '<%= yeoman.dist %>/angular-stackmob.js'
        }]
      }
    },

    copy: {
      sampleapp: {
        files: [{
          dest: 'sample-app/app/scripts/angular-stackmob.js',
          src: [
            '<%= yeoman.dist %>/angular-stackmob.js'
          ]
        }]
      }
    },
    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: banner
        },
        files: {
          src: [ 'dist/angular-stackmob.*' ]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= yeoman.dist %>/angular-stackmob.min.js': [
            '<%= yeoman.dist %>/angular-stackmob.js'
          ]
        }
      }
    },
    concat: {
      dist: {
        files: [{
          dest: '<%= yeoman.dist %>/angular-stackmob.js',
          src: [
            '<%= yeoman.app %>/bower_components/crypto-js/src/core.js',
            '<%= yeoman.app %>/bower_components/crypto-js/src/enc-base64.js',
            '<%= yeoman.app %>/bower_components/crypto-js/src/hmac.js',
            '<%= yeoman.app %>/bower_components/crypto-js/src/sha1.js',
            '<%= yeoman.app %>/angular-stackmob/stackmob/stackmob.js',
            '<%= yeoman.app %>/angular-stackmob/httpInterceptor/httpInterceptor.js',
            '<%= yeoman.app %>/angular-stackmob/utils/utils.js',
            '<%= yeoman.app %>/angular-stackmob/core.js',
            '!<%= yeoman.app %>/angular-stackmob/**/*-spec.js'
          ]
        }]
      }
    },

    bump: {
      files: ['package.json', 'bower.json'],
      updateConfigs: ['pkg']
    },

    changelog: {
      options: {
        dest: 'CHANGELOG.md'
      }
    },

    karma: {
      unit: {
        options: karmaConfig('karma.conf.js')
      },
      continuous: {
        options: karmaConfig('karma.conf.js', { singleRun: false })
      }
    }
  });

  grunt.registerTask('test', [
    'karma:unit'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'concat',
    'ngmin',
    'uglify',
    'copy',
    'usebanner'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
