Module.controller('PreventDefault',['$scope','$element','$swipe','$log','$sce',
    function($scope,$element,$swipe,$log,$sce){
  
  var logMsg = '';
  $scope.logMsg = '';
  
  $scope.log = function(msg, $event){
    if( $event ) $log.debug( $event );
    $log.log(msg);
    logMsg += msg+ '<br/>';
    $scope.logMsg = $sce.trustAsHtml( logMsg );
  };
  
}]);


