'use strict';

// requestAnimationFrame hack, where I place it?!
window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback, element ){  // ( function, DOMElement )
      window.setTimeout(callback, 1000 / 60);
    };
})();

/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngSwipeLeft
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * To disable the mouse click and drag functionality, add `ng-swipe-disable-mouse` to
 * the `ng-swipe-left` or `ng-swipe-right` DOM Element.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeLeftExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeLeftExample', ['ngTouch']);
      </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name ngSwipeRight
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeRightExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeRightExample', ['ngTouch']);
      </file>
    </example>
 */

function makeSwipeDirective(directiveName, direction, eventName) {
  ngTouch.directive(directiveName, ['$parse', '$swipe', '$animateCss', '$window',
      function($parse, $swipe, $animateCss, $window) {
    // The maximum vertical delta for a swipe should be less than 75px.
    var MAX_VERTICAL_DISTANCE = 75;
    // Vertical distance should not be more than a fraction of the horizontal distance.
    var MAX_VERTICAL_RATIO = 0.3;
    // At least a 30px lateral motion is necessary for a swipe.
    var MIN_HORIZONTAL_DISTANCE = 30;

    return function(scope, element, attr){
      var swipeHandler = $parse(attr[directiveName]),
          drag = attr['ngSwipeDrag']? $parse(attr['ngSwipeDrag'])() : true,
          endClass = attr['ngSwipeEndclass']? 
                      $parse(attr['ngSwipeEndclass'])() || attr['ngSwipeEndclass']
                      : '';
        
      var startCoords, actualCoords, valid, animator, dragging;

      function validSwipe(coords) {
        // Check that it's within the coordinates.
        // Absolute vertical distance must be within tolerances.
        // Horizontal distance, we take the current X - the starting X.
        // This is negative for leftward swipes and positive for rightward swipes.
        // After multiplying by the direction (-1 for left, +1 for right), legal swipes
        // (ie. same direction as the directive wants) will have a positive delta and
        // illegal ones a negative delta.
        // Therefore this delta must be positive, and larger than the minimum.
        if (!startCoords) return false;
        var deltaY = Math.abs(coords.y - startCoords.y);
        var deltaX = (coords.x - startCoords.x) * direction;
        return valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }
      function validMoveArea(coords){
        if (!startCoords) return false;
        var deltaY = Math.abs(coords.y - startCoords.y);
        var deltaX = (coords.x - startCoords.x) * direction;
        return deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }
      function setTransition( ahead ){
        var x = (actualCoords.x - startCoords.x);
        if( ahead ){
          $window.requestAnimationFrame(function(){
            element.css({
              '-webkit-transform': 'translate3d('+x+'px,0,0)',
              'transform': 'translate3d('+x+'px,0,0)',
            });
          });
        }else{
          animator = $animateCss( element, {
            transitionStyle: 'transform 0.2s ease-out',
            //from: { 'transform': 'translate3d('+x+'px,0,0)' },
            to: { 'transform': 'translate3d(0px,0,0)' }
          });
          animator.start().then(function(){
            element.css({
              '-webkit-transform': '',
              'transform': '',
            });
          });
        }
      }
      
      var bindHandlers = {
        'start': function(coords, event) {
          actualCoords = startCoords = coords;
          if( animator ) animator.end();
          setTransition(true);
          dragging = valid = true;
        },
        'cancel': function(event) {
          dragging = valid = false;
          actualCoords = startCoords;
          setTransition(false);
        },
        'end': function(coords, event) {
          if (validSwipe(coords)){
            element.css({
              '-webkit-transform': '',
              'transform': '',
            });
            scope.$apply(function(){
              if( endClass ) element.addClass(endClass);
              element.triggerHandler(eventName);
              swipeHandler(scope, {$event: event});
            });
          }else{
            //var fromX = (coords.x - startCoords.x);
            //if( fromX * direction < 0 ) return;
            /*
            animator = $animateCss( element, {
              transitionStyle: 'transform 0.2s ease-out',
              from: { 'transform': 'translate3d('+fromX+'px,0,0)' },
              to: { 'transform': 'translate3d(0px,0,0)' }
            });
            animator.start();
            */
            setTransition(false);
          }
          dragging = false;
        },
        drag: function(coords, event){
          return; //  <<---------
          if( !drag ) return;
          if( !validMoveArea(coords) ){
            actualCoords = startCoords;
            setTransition(false);
            return;
          }
          actualCoords = coords;
          setTransition(true);
        }
      };
      
      $swipe.bind(element, bindHandlers );
    };
  }]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
makeSwipeDirective('ngSwipeRight', 1, 'swiperight');

