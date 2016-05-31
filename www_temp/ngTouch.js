
(function(window,angular){

'use strict';

/**
 * @ngdoc module
 * @name ngTouch
 * @description
 *
 * # ngTouch
 *
 * The `ngTouch` module provides touch events and other helpers for touch-enabled devices.
 * The implementation is based on jQuery Mobile touch event handling
 * ([jquerymobile.com](http://jquerymobile.com/)).
 *
 *
 * See {@link ngTouch.$swipe `$swipe`} for usage.
 *
 * <div doc-module-components="ngTouch"></div>
 *
 */

// define ngTouch module
/* global -ngTouch */
var ngTouch = angular.module('ngTouch', []);


//=============================================================
function nodeName_(element) {
  return angular.lowercase(element.nodeName || (element[0] && element[0].nodeName));
}
function getPointerEvent( event ){
  event = event.originalEvent || event;  // get jQuery 'originalEvent'
  event = (event.changedTouches && event.changedTouches.length) ? event.changedTouches
    : (event.touches && event.touches.length ? event.touches : [event]);
  event = event[0]; //  <<---  Transformar em lista de toques/cliques!!! 
  
  var element = event.target || event.srcElement ; // IE uses srcElement.
  // Hack for Safari, which can target text nodes instead of containers.
  if (element.nodeType === 3) element = element.parentNode;
  
  var obj = {
    event: event,
    element: element,
    x: event.clientX,
    y: event.clientY
  };
  return obj;
}
function setupSwiperGhostClick( pointer ){
  if( !_hasTouch ) return;
  function _timeoutHandler(){ 
    for(var i=0; i< RootHandlerObj._pointers.length; i++){ 
      if( RootHandlerObj._pointers[i] === pointer ){
        RootHandlerObj._pointers.splice( i, 1 );
        break; 
      }
    } 
  }
  if( !pointer.preventMouseFromTouch ) return;
  RootHandlerObj._pointers.push( pointer );
  setTimeout( _timeoutHandler, pointer.preventDuration );
}




var ACTIVE_CLASS_NAME = 'ng-click-active',
    generalDragging = [],
    generalTapping = [],
    RootHandlerObj = null, // Class to use when element pressed (touchstart/mousedown)
    _pointerEventsProps = [ 'lastStartEvent', 'lastMoveEvent', 'lastEndEvent', 'lastCancelEvent' ],
    _lastLabelClickCoords = null;
  
// the below line is a piece of code from modernizr:
// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
var _hasTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);

ngTouch.run(['$rootElement',function($rootElement){
  
  RootHandlerObj = new RootHandler( $rootElement[0] );
  
}]);



//================  Funções auxiliares  ==========================
function callHandler( that, name, argsArr ){
  var func = that.eventHandlers[name];
  if( func ){
    if( that.$scope && that.callApply ) 
      that.$scope.$apply(function(){ func.apply( that, argsArr ); });
    else func.apply( that, argsArr );
  }
}


//================  Pointer Class  ==========================
function Pointer( config ){
  this.tapDuration = config.tapDuration || 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  this.moveTolerance = config.moveTolerance || 12; // 12px seems to work in most mobile browsers.
  this.preventDuration = config.preventDuration || 2500; // 2.5 seconds maximum from preventGhostClick call to click
  this.clickbusterThreshold = config.clickbusterThreshold || 25; // 25 pixels in any dimension is the limit for busting clicks.
  this.moveBufferRadius = config.moveBufferRadius || 10 ; // The total distance in any direction before we make the call on swipe vs. scroll.
  this.preventMouseFromTouch = config.preventMouseFromTouch || true; // to prevent or not the 'mouse' events when the 'touch' events were fired
  //this[__preventMoveFromDrag] = true; // to prevent or not the 'move' event when the 'drag' event is been fired
  
  this.element = config.element;
  this.eventHandlers = config.eventHandlers || {};
  this.$scope = config.$scope ;
  this.callApply = config.callApply || true ;
  this.callDestroy = config.callDestroy || true ;
  
  this.blurGhostClickElement = config.blurGhostClickElement || true;
  
  this.hasTouchEvents = false; // to find if this browser has touch events (need to stay in separate var!)
  this.lastStartEvent = null;
  this.lastMoveEvent = null;
  this.lastEndEvent = null;
  this.lastCancelEvent = null;

  this.tapping = false;       // to simulate the 'tap' event
  this.dragging = false;      // to simulate de 'drag' event
  this.startTime = 0;         // Used to check if the tap was held too long.
  this.touchStartX = 0; 
  this.touchStartY = 0; 
  this.totalX = 0;            // Absolute total movement, used to control swipe vs. scroll.
  this.totalY = 0;            // Absolute total movement, used to control swipe vs. scroll.
  this.startCoords = null;    // Coordinates of the start position.
}
var proto = Pointer.prototype;
proto.resetState = function(){
  this.tapping = false;
  this.dragging = false;
  this.element.removeClass(ACTIVE_CLASS_NAME);
};
proto.handleDrag = function(eventFired){
  var ev = getPointerEvent(eventFired);
  eventFired.preventDefault();
  callHandler( this, 'drag', [ ev, eventFired ] );
};
proto.handleStart = function(eventFired){
  var ev = getPointerEvent(eventFired);
  
  this.lastStartEvent = ev;
    // TAP proccess
  if( this.eventHandlers['tap'] ){
    this.element.addClass(ACTIVE_CLASS_NAME); // only put the class if tapping or dragging
    this.startTime = Date.now();
    this.touchStartX = ev.x;
    this.touchStartY = ev.y;
    this.tapping = true;
    generalTapping.push( this );
  }
    // DRAG proccess
  if( this.eventHandlers['drag'] ){
    this.element.addClass(ACTIVE_CLASS_NAME); // only put the class if tapping or dragging
    this.dragging = true;
    generalDragging.push( this );
    this.totalX = 0;
    this.totalY = 0;
  }
  this.startCoords = ev;
  callHandler( this, 'start', [ this.startCoords, eventFired ] );
};
proto.handleMove = function(eventFired){
  var ev = getPointerEvent(eventFired);
  callHandler( this, 'move', [ ev, eventFired ] );
};
proto.handleCancel = function(eventFired){
  this.lastCancelEvent = getPointerEvent(eventFired);
  callHandler( this, 'cancel', [ eventFired ] );
  this.resetState();
};
proto.handleEnd = function(eventFired){
  var ev = getPointerEvent(eventFired);
  this.lastEndEvent = ev;

    // check if this is a tap:
  if( this.tapping ){
    var diff = Date.now() - this.startTime;
    var x = ev.x;
    var y = ev.y;
    var dist = Math.sqrt(Math.pow(x - this.touchStartX, 2) + Math.pow(y - this.touchStartY, 2));
    if ( diff < this.tapDuration && dist < this.moveTolerance){
      callHandler( this, 'tap', [ ev, eventFired ] );
    }
    for( var i=0; i<generalTapping.length; i++ ){
      if( generalTapping[i] === this ){
        generalTapping.splice( i, 1 );
        break;
      }
    }
  }

    // check dragging to remove that from the list
  if( this.dragging && this.element[0] === ev.element ){
    for( var i=0; i<generalDragging.length; i++ ){
      if( generalDragging[i] === this ){
        generalDragging.splice( i, 1 );
        break;
      }
    }
  }

  callHandler( this, 'end', [ ev, eventFired ] );
  this.resetState();
};
proto.unbind = function(){
  // default implementation
};
proto.bind = function(){
  
  
  
};



window.requestAnimationFrame = (function(){
  return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    window.oRequestAnimationFrame      ||
    window.msRequestAnimationFrame     ||
    function( callback ){  // ( function, DOMElement )
      window.setTimeout(callback, 1000 / 60);
    };
})();

window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;



  
//===================  Funções gerais  =============================
function _generalEndHandle(event){
  for(var i=0; i<generalDragging.length; i++){
    generalDragging[i].handleDrag(event);
    generalDragging[i].handleEnd(event);
    generalDragging[i].resetState();
  }
  for(var i=0; i<generalTapping.length; i++){
    // don't handle tap, because this was outside the element borders, just reset
    generalTapping[i].resetState();
  }
  generalDragging = []; // remove all draggings
  generalTapping = []; // remove all tappings
  if( _hasTouch && event.target.nodeName === 'INPUT' ){
    event.target.focus();
  }
}
function _generalDragHandle(event){
  for(var i=0; i<generalDragging.length; i++){
    generalDragging[i].handleDrag(event);
  }
}


//===========  Funções que usam o RootHandler para esse $rootElement  ==========
function _ghostclick(mouseEvent){
  var pointer = null, 
      touchPos = null,
      mousePos = getPointerEvent( mouseEvent );
  // Work around desktop Webkit quirk where clicking a label will fire two clicks (on the label
  // and on the input element). Depending on the exact browser, this second click we don't want
  // to bust has either (0,0), negative coordinates, or coordinates equal to triggering label
  // click event
  if( ( mousePos.x < 1 && mousePos.y < 1 ) || // check: offscreen
      ( // check: input click triggered by label click
        _lastLabelClickCoords &&
        _lastLabelClickCoords[0] === mousePos.x &&
        _lastLabelClickCoords[1] === mousePos.y
      ) ){
    return; // let the second event fire
  }
  // remember label click coordinates to prevent click busting of trigger click event on input
  // or reset label click coordinates on first subsequent click
  _lastLabelClickCoords = (nodeName_(event.target) === 'label')? 
      [mousePos.x, mousePos.y] : null ;

  outer:
  for(var i=0; i< RootHandlerObj._pointers.length; i++){
    pointer = RootHandlerObj._pointers[i];
    for(var y=0; y<_pointerEventsProps.length; y++){
      if( !(touchPos = pointer[_pointerEventsProps[y]]) )continue;
      // the position of the mouse event dispatched can be a little off the
      // position of the touch event, so some calcs are needed
      if( Math.abs(touchPos.x - mousePos.x) < pointer.clickbusterThreshold
          && Math.abs(touchPos.y - mousePos.y) < pointer.clickbusterThreshold ){
          // is ghost click!
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
          // blur the element
        /*
        // this piece of code cause a BLUR on the element if we have a ghostclick,
        // but this 'blur call' cause INPUT fields to not been focused on
        // touch events. This piece need to stay commented for more tests and
        // solutions.
        if( swiper[__blurGhostClickElement] ){
          var el = getElementFromEvent( mouseEvent );
          if( el.blur ) el.blur();
        }
        /* */
        break outer;
      }
    }
  }
}


//===================  Classe principal  ===========================
function RootHandler( $rootEl ){
  this._pointers = [];
  this.$rootElement = $rootEl;
  this._lastLabelClickCoords = null;
  this.iniciado = false;
  
  if( this.$rootElement ) this.init();
}
var proto = RootHandler.prototype;
proto.init = function(){
  if( this.iniciado ) return;
  this.$rootElement.addEventListener('mouseup', _generalEndHandle, false); // general end handle on bubbling fase
  this.$rootElement.addEventListener('mousemove', _generalDragHandle, false); // general drag handle on bubbling fase
  if( _hasTouch ){
    this.$rootElement.addEventListener('touchend', _generalEndHandle, false); // general handle on bubbling fase
    this.$rootElement.addEventListener('touchmove', _generalDragHandle, false); // general handle on bubbling fase
    this.$rootElement.addEventListener('mousedown',_ghostclick,true); // can be thrown after a 'touchstart'
    //$rootElementEl[__addEventListener]('mousemove',_ghostclick,true); // can be thrown after a 'touchend' or a 'touchmove'
    this.$rootElement.addEventListener('mouseup',_ghostclick,true); // can be thrown after a 'touchend'
    this.$rootElement.addEventListener('click',_ghostclick,true); // can be thrown after a 'touchstart' followed by a 'touchend'
  }
  this.iniciado = true;
};



'use strict';

ngTouch.service('$pointer',['$swipe',function($swipe){
    return $swipe;
}]);
ngTouch.service('$swipe',[function() {

  var scopedSwipers = {},
    __ElementStaticId = 1;
  // now, our service handlers:
  function onFunc(element, eventHandlers, config) {
    if(!(config instanceof Object)) config = {};
    var scope = config.$scope;
      // check the registry
    if( element.$swiperId ){
      var swipe = scopedSwipers[element.$swiperId];
      swipe.eventHandlers = angular.extend( swipe.eventHandlers, eventHandlers );
      return swipe; // just have an entry in registry, so don't need to proccess
    }
    config.element = angular.element( element );
    config.eventHandlers = eventHandlers;
    var swiper = new Pointer(config);

    element.on('touchstart', _touchstart );
    element.on('touchmove', _touchmove );
    element.on('touchend', _touchend );
    element.on('touchcancel', _touchcancel );

    element.on('mousedown', _mousedown );
    element.on('mousemove', _mousemove );
    element.on('mouseup', _mouseup );

    // set handler for unbind
    swiper.unbind = function(){
      element.off('touchstart', _touchstart );
      element.off('touchmove', _touchmove );
      element.off('touchend', _touchend );
      element.off('touchcancel', _touchcancel );

      element.off('mousedown', _mousedown );
      element.off('mousemove', _mousemove );
      element.off('mouseup', _mouseup );

      if( element.$swiperId ){
        delete scopedSwipers[element.$swiperId]; // the 'ids' will never be reused!
      }
      element = null;
      swiper = null;
    };

    if( scope && swiper.callDestroy ){
      element.$swiperId = __ElementStaticId++;
      scopedSwipers[element.$swiperId] = swiper;
      scope.$on('$destroy', function(){ swiper.unbind(); } ); // set 'swiper.unbind' on '$scope#$on($destroy)'
    }

    return swiper ;

    // =========  Handlers  =========
    function _touchstart(eventFired){
      setupSwiperGhostClick( swiper );
      swiper.handleStart(eventFired);
    }
    function _touchmove(eventFired){
      setupSwiperGhostClick( swiper );
      swiper.handleMove(eventFired);
    }
    function _touchend(eventFired) {
      setupSwiperGhostClick( swiper );
      swiper.handleEnd(eventFired);
    }
    function _touchcancel(eventFired) {
      setupSwiperGhostClick( swiper );
      swiper.handleCancel(eventFired);
    }
    function _mousedown(eventFired) {
      swiper.handleStart(eventFired);
    }
    function _mousemove(eventFired) {
      swiper.handleMove(eventFired);
    }
    function _mouseup(eventFired) {
      swiper.handleEnd(eventFired);
    }

  }


  return {
    bind: onFunc 
  };
}]);


'use strict';

/* global ngTouch: false,
  nodeName_: false
*/

/**
 * @ngdoc directive
 * @name ngClick
 *
 * @description
 * A more powerful replacement for the default ngClick designed to be used on touchscreen
 * devices. Most mobile browsers wait about 300ms after a tap-and-release before sending
 * the click event. This version handles them immediately, and then prevents the
 * following click event from propagating.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * This directive can fall back to using an ordinary click event, and so works on desktop
 * browsers as well as mobile.
 *
 * This directive also sets the CSS class `ng-click-active` while the element is being held
 * down (by a mouse click or touch) so you can restyle the depressed element if you wish.
 *
 * @element ANY
 * @param {expression} ngClick {@link guide/expression Expression} to evaluate
 * upon tap. (Event object is available as `$event`)
 *
 * @example
    <example module="ngClickExample" deps="angular-touch.js">
      <file name="index.html">
        <button ng-click="count = count + 1" ng-init="count=0">
          Increment
        </button>
        count: {{ count }}
      </file>
      <file name="script.js">
        angular.module('ngClickExample', ['ngTouch']);
      </file>
    </example>
 */

ngTouch.config(['$provide', function($provide) {
  $provide.decorator('ngClickDirective', ['$delegate', function($delegate) {
    // drop the default ngClick directive
    $delegate.shift();
    return $delegate;
  }]);
}]);

createDirectives('ngClick', 'tap');
createDirectives('ngTap', 'tap');
createDirectives('ngTouchStart', 'start');
createDirectives('ngTouchDrag', 'drag');
createDirectives('ngTouchMove', 'move');
createDirectives('ngTouchEnd', 'end');
createDirectives('ngTouchCancel', 'cancel');
//createDirectives(['ngTapHold'], 'taphold');
//createDirectives(['ngDrag'], 'drag');
function createDirectives( dirName, swipeEvent ){
  ngTouch.directive(dirName, ['$parse', '$swipe',
      function($parse, $swipe) {

    // Actual linking function.
    return function(scope, element, attr) {

      var handler = $parse(attr[dirName]),
          objEv = {};
      objEv[swipeEvent] = function(pos, event){
        handler(scope, {$event: event || pos});
      };
      $swipe.bind(element, objEv, {$scope: scope});

    };
  }]);
}




'use strict';


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

var SWIPE_DRAG_CLASS = 'ng-swipe-drag';

function makeSwipeDirective(directiveName, direction, eventName, vertical) {
  ngTouch.directive(directiveName, ['$parse', '$swipe', '$window',
      function($parse, $swipe, $window) {
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
        
      var startCoords, actualCoords, valid, animator, dragging, rafOn = false, ahead;
      
      
      
      function validSwipe(coords) {
        if(!direction) return true;
        if (!startCoords) return false;
        var i_coords, i_startCoords;
          // inverter as direções para swipe vertical:
        if( vertical ){
          i_coords = { x: coords.y, y: coords.x };
          i_startCoords = { x: startCoords.y, y: startCoords.x };
        }else{
          i_coords = coords;
          i_startCoords = startCoords;
        }
        
        // Check that it's within the coordinates.
        // Absolute vertical distance must be within tolerances.
        // Horizontal distance, we take the current X - the starting X.
        // This is negative for leftward swipes and positive for rightward swipes.
        // After multiplying by the direction (-1 for left, +1 for right), legal swipes
        // (ie. same direction as the directive wants) will have a positive delta and
        // illegal ones a negative delta.
        // Therefore this delta must be positive, and larger than the minimum.
        var deltaY = Math.abs(i_coords.y - i_startCoords.y);
        var deltaX = (i_coords.x - i_startCoords.x) * direction;
        return valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }
      function validMoveArea(coords){
        if(!direction) return true;
        if (!startCoords) return false;
        var i_coords, i_startCoords;
          // inverter as direções para swipe vertical:
        if( vertical ){
          i_coords = { x: coords.y, y: coords.x };
          i_startCoords = { x: startCoords.y, y: startCoords.x };
        }else{
          i_coords = coords;
          i_startCoords = startCoords;
        }
        
        var deltaY = Math.abs(i_coords.y - i_startCoords.y);
        var deltaX = (i_coords.x - i_startCoords.x) * direction;
        return deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }
      
      
      
      function cleanTransition(){
        element.css({
          '-webkit-transform': '',
          'transform': '',
        });
      }
      function setTransition( _ahead ){
        ahead = _ahead;
        if( rafOn ) return;
        rafOn = true;
        $window.requestAnimationFrame(function(){
          if( ahead ){
            var x = (!direction || !vertical)? (actualCoords.x - startCoords.x) : 0;
            var y = (!direction ||  vertical)? (actualCoords.y - startCoords.y) : 0;
            element.css({
              '-webkit-transform': 'translate3d('+x+'px,'+y+'px,0)',
              'transform': 'translate3d('+x+'px,'+y+'px,0)',
            });
          }else{
            element.css({
              '-webkit-transform': 'translate3d(0px,0px,0px)',
              'transform': 'translate3d(0px,0px,0px)',
            });
          }
          rafOn = false;
        });
      }
      
      var bindHandlers = {
        'start': function(coords, event) {
          actualCoords = startCoords = coords;
          if( animator ) animator.end();
          setTransition(true);
          dragging = valid = true;
          if(drag) element.addClass(SWIPE_DRAG_CLASS);
        },
        'cancel': function(event) {
          dragging = valid = false;
          actualCoords = startCoords;
          setTransition(false);
        },
        'end': function(coords, event) {
          if (validSwipe(coords)){
            scope.$apply(function(){
              if( endClass ) element.addClass(endClass);
              element.triggerHandler(eventName);
              swipeHandler(scope, {$event: event});
            });
          }
          
          dragging = false;
          if(drag) element.removeClass(SWIPE_DRAG_CLASS);
          if( endClass ){
            cleanTransition();
          }else{
            setTransition(false);
          }
        },
        drag: function(coords, event){
          //return; //  <<---------
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
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft', false);
makeSwipeDirective('ngSwipeRight', 1, 'swiperight', false);
makeSwipeDirective('ngSwipeTop', -1, 'swipetop', true);
makeSwipeDirective('ngSwipeDown', 1, 'swipedown', true);
makeSwipeDirective('ngSwipe', 0, 'swipe', false);



})(window,window.angular);
