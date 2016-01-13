Module.controller('SwiperLot',['$scope','$element','$swipe',
    function($scope,$element,$swipe){
  
  $scope.limit = 0;
  
  $scope.w = { msg:'waiting start' };
  $scope.callWith = function(){
    for(var i=0; i< $scope.limit; i++){
      $swipe.bind( $element, {start:function(){}}, {$scope: $scope} );
    }
  };
  
  
  $scope.wout = { msg:'waiting start' };
  $scope.callWithout = function(){
    for(var i=0; i< $scope.limit; i++){
      $swipe.bind( $element, {start:function(){}} );
    }
  };
  
}]);


