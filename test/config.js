
window.Module = angular.module('Module',['ngAnimate','ngTouch','ui.router']);
            
Module.config(['$stateProvider','$urlRouterProvider',
      function($stateProvider,$urlRouterProvider){
    
    // for any unmatched URL
    $urlRouterProvider.otherwise('/clicks');
    
    $stateProvider.state('clicks',{
      url: '/clicks', views:{ conteudo:{ templateUrl: 'test/clicks/index.html' } }
    }).state('ghostclick',{
      url: '/ghostclick', views:{ conteudo:{ templateUrl: 'test/ghostclick/index.html' } }
    }).state('taphold',{
      url: '/taphold', views:{ conteudo:{ templateUrl: 'test/taphold/index.html' } }
    }).state('swiperlot',{
      url: '/swiperlot', views:{ conteudo:{ templateUrl: 'test/swiperlot/index.html' } }
    }).state('touchleave',{
      url: '/touchleave', views:{ conteudo:{ templateUrl: 'test/touchleave/index.html' } }
    });
    
    
}]);