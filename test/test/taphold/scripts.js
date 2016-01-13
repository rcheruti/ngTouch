Module.controller('TapHold',['$scope','$element','$swipe',
    function($scope,$element,$swipe){
  
  $scope.toShow = false;
  
  var toShow = $element.find('div').eq(2);
  var el = $element.find('div').eq(1);
  $swipe.bind( el, {
    taphold: function(pos, ev){
      console.log( 'taphold', ev );
      $scope.toShow = true;
      toShow.addClass('realyShowing');
    },
    tap:function(pos, ev){
      console.log( 'tap', ev );
      $scope.toShow = true;
      toShow.addClass('realyShowing');
    }
  }, {$scope: $scope} );
  console.log( $scope );
  
  $scope.hide = function(){
    console.log('hiding');
    $scope.toShow = false;
    toShow.removeClass('realyShowing');
  };
  
}]);


