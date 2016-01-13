Module.controller('GhostClick',['$scope','$element','$swipe',
    function($scope,$element,$swipe){
  
  
  //===========  old compatible  ===========
  
  var panel2 = $element.children('div').eq(3);
  var p2_1 = panel2.children('div').eq(0);
  var p2_2 = panel2.children('div').eq(1);
  $swipe.bind( p2_1, {
    start:function(pos, ev){
      p2_2.removeClass('getout');
    }
  },false  );
  $swipe.bind( p2_2, {
    start:function(pos, ev){
      p2_2.addClass('getout');
    }
  },false );
  
  
  //===========  below will raise an error and break the execution  ===========
  
  $scope.tempoPrevent = 400;
  
  var panel = $element.children('div').eq(1);
  var p1 = panel.children('div').eq(0);
  var p2 = panel.children('div').eq(1);
  
  var config = true? {preventDuration: $scope.tempoPrevent, $scope: $scope} : false;
  var swiper1 = $swipe.bind( p1, {
    start:function(pos, ev){
      p2.removeClass('getout');
    }
  }, config  );
  var swiper2 = $swipe.bind( p2, {
    start:function(pos, ev){
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


