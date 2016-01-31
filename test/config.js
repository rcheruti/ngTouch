
window.Module = angular.module('Module',['ngAnimate','ngTouch','ui.router']);
            
Module.config(['$stateProvider','$urlRouterProvider',
      function($stateProvider,$urlRouterProvider){
    
    // for any unmatched URL, this is the default URL
    $urlRouterProvider.otherwise('/clicks');
    
    $stateProvider.state('clicks',{
      url: '/clicks', views:{ conteudo:{ templateUrl: 'test/clicks/index.html' } }
    }).state('ghostclick',{
      url: '/ghostclick', views:{ conteudo:{ templateUrl: 'test/ghostclick/index.html' } }
    }).state('swiperlot',{
      url: '/swiperlot', views:{ conteudo:{ templateUrl: 'test/swiperlot/index.html' } }
    }).state('swiping',{
      url: '/swiping', views:{ conteudo:{ templateUrl: 'test/swiping/index.html' } }
    }).state('taphold',{
      url: '/taphold', views:{ conteudo:{ templateUrl: 'test/taphold/index.html' } }
    }).state('touchleave',{
      url: '/touchleave', views:{ conteudo:{ templateUrl: 'test/touchleave/index.html' } }
    }).state('preventdefault',{
      url: '/preventdefault', views:{ conteudo:{ templateUrl: 'test/preventdefault/index.html' } }
    });
    
    
}]);