Module.controller('GhostClick',['$scope','$element','$swipe',
    function($scope,$element,$swipe){
  
  $scope.tempoPrevent = 400;
  
  var panel = $element.find('div').eq(1);
  var p1 = panel.find('div').eq(0);
  var p2 = panel.find('div').eq(1);
  
  var config = {preventDuration: $scope.tempoPrevent};
  var swiper1 = $swipe.bind( p1, {
    start:function(pos, ev){
      console.log('hello1', ev); 
      p2.removeClass('getout');
    }
  }, config  );
  var swiper2 = $swipe.bind( p2, {
    start:function(pos, ev){
      console.log('hello2', ev); 
      p2.addClass('getout');
    }
  }, config );
  
  // methods to test the call
  $scope.hello1 = function(){  };
  $scope.hello2 = function(){  };
  
  $scope.tempoPreventChange = function(){
    swiper1.preventDuration = $scope.tempoPrevent;
    swiper2.preventDuration = $scope.tempoPrevent;
  };
  
}]);


