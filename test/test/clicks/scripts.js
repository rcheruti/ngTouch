Module.controller('Clicks',['$scope','$element','$swipe',
        function($scope,$element,$swipe){

        // for ngClick test
    $scope.ngClick = function(ev){
      console.log('ngClick', ev);
    };

        // for '$swipe' test
    var elX = $element.find('div').eq(1);
    $swipe.bind( elX, {
      tap: function(pos, ev){
          console.log('$swipe tap:', pos, ev);
      },
      start: function(pos, ev){
          console.log('$swipe start:', pos, ev);
          elX.addClass('clickstart');
      },
      move: function(pos, ev){
          console.log('$swipe move:', pos, ev);
      },
      drag: function(pos, ev){
          console.log('$swipe drag:', pos, ev);
      },
      end: function(pos, ev){
          console.log('$swipe end:', pos, ev);
          elX.removeClass('clickstart');
      },
      cancel: function(pos, ev){
          console.log('$swipe cancel:', pos, ev);
      },
    } );

        // for native mouse test
    var el = $element.find('div').eq(2)[0];
    el.addEventListener('mousedown',function(ev){ console.log('native mousedown', ev); });
    el.addEventListener('mousemove',function(ev){ console.log('native mousemove', ev); });
    el.addEventListener('mouseup',function(ev){ console.log('native mouseup', ev); });
    el.addEventListener('click',function(ev){ console.log('native click', ev); });

        // for native touch test
    var el = $element.find('div').eq(3)[0];
    el.addEventListener('touchstart',function(ev){ console.log('native touchstart', ev); });
    el.addEventListener('touchmove',function(ev){ console.log('native touchmove', ev); });
    el.addEventListener('touchend',function(ev){ console.log('native touchend', ev); });

        // for native mouse test
    var el = $element.find('div').eq(4)[0];
    el.addEventListener('mousedown',function(ev){ console.log('both native mousedown', ev); });
    el.addEventListener('mousemove',function(ev){ console.log('both native mousemove', ev); });
    el.addEventListener('mouseup',function(ev){ console.log('both native mouseup', ev); });
    el.addEventListener('click',function(ev){ console.log('both native click', ev); });
    el.addEventListener('touchstart',function(ev){ console.log('both native touchstart', ev); });
    el.addEventListener('touchmove',function(ev){ console.log('both native touchmove', ev); });
    el.addEventListener('touchend',function(ev){ console.log('both native touchend', ev); });


        // to test the ngSwipeX directives
    $scope.swipeLeft = function(){ console.log('swipeLeft'); };
    $scope.swipeRight = function(){ console.log('swipeRight'); };

}]);


