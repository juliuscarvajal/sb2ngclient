'use strict';

angular
  .module('SB2', [
    'ngResource',
    'ui.router',
    'ls.LiveSet',
    'ls.ChangeStream'
  ])
  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
      $stateProvider
        .state('index', {
          url: '/',
          templateUrl: 'views/app.html',
          controller: 'AppController'
        });

    }
  ]);