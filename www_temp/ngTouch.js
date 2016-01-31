
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

function nodeName_(element) {
  return angular.lowercase(element.nodeName || (element[0] && element[0].nodeName));
}

'use strict';

/* global ngTouch: false */

/**
 * @ngdoc provider
 * @name $swipeProvider
 * 
 * @description 
 * Description pendding...
 * 
 * 
 */
ngTouch.provider('$swipe',[
        function() {
  
  // names for minifying:
  var __tapDuration = 'tapDuration',
      __moveTolerance = 'moveTolerance',
      __preventDuration = 'preventDuration',
      __moveBufferRadius = 'moveBufferRadius',
      __clickbusterThreshold = 'clickbusterThreshold',
      __preventMouseFromTouch = 'preventMouseFromTouch',
      //__preventMoveFromDrag = 'preventMoveFromDrag',
      __element = 'element',
      __eventHandlers = 'eventHandlers',
      __hasTouchEvents = 'hasTouchEvents',
      __lastStartEvent = 'lastStartEvent',
      __lastMoveEvent = 'lastMoveEvent',
      __lastEndEvent = 'lastEndEvent',
      __lastCancelEvent = 'lastCancelEvent',
      __tapping = 'tapping',
      __dragging = 'dragging',
      __startTime = 'startTime',
      __touchStartX = 'touchStartX',
      __touchStartY = 'touchStartY',
      __totalX = 'totalX',
      __totalY = 'totalY',
      __startCoords = 'startCoords',
      __lastPos = 'lastPos',
      __resetState = 'resetState',
      __handleStart = 'handleStart',
      __handleEnd = 'handleEnd',
      __handleCancel = 'handleCancel',
      __handleMove = 'handleMove',
      __handleDrag = 'handleDrag',
      __$scope = '$scope',
      __callApply = 'callApply',
      __callDestroy = 'callDestroy',
      __blurGhostClickElement = 'blurGhostClickElement',
      __unbind = 'unbind',
      __$swiperId = '$swiperId',
      __addEventListener = 'addEventListener',
      __$id = '$id'
  ;
  
  var provider = this;
  provider[__tapDuration] = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  provider[__moveTolerance] = 12; // 12px seems to work in most mobile browsers.
  provider[__preventDuration] = 2500; // 2.5 seconds maximum from preventGhostClick call to click
  provider[__clickbusterThreshold] = 25; // 25 pixels in any dimension is the limit for busting clicks.
  provider[__moveBufferRadius] = 10 ; // The total distance in any direction before we make the call on swipe vs. scroll.
  provider[__preventMouseFromTouch] = true; // to prevent or not the 'mouse' events when the 'touch' events were fired
  //provider[__preventMoveFromDrag] = true; // to prevent or not the 'move' event when the 'drag' event is been fired
  
  var ACTIVE_CLASS_NAME = 'ng-click-active';
  //var TAPHOLD_ACTIVE_CLASS = 'ng-taphold-active';
  
  /*
   * Events in the '$swipe':
   *  - start : fired on 'touchstart' or 'mousedown'
   *  - move : fired on 'touchmove' or 'mousemove'
   *  - end : fired on 'touchend' or 'mouseup'
   *  - tap : fired on 'touchend after touchstart' or 'mouseup after mousedown' ('click' events are never listen)
   *  - drag : fired on 'touchmove after touchstart and before tochend' and 'mousemove after mousedown and before mouseup'
   *  
   *  
   */

  
  //==============================================================
        //  The code
  
  //  Get the real event: the touch event or the click event, any one
  function getEvent(event){
    event = event.originalEvent || event;  // get jQuery 'originalEvent'
    event = (event.changedTouches && event.changedTouches.length) ? event.changedTouches
      : (event.touches && event.touches.length ? event.touches : [event]);
    return event[0];
  }
  function getCoordinates(event) {
    var e = getEvent(event);
    return {
      x: e.clientX,
      y: e.clientY
    };
  }
  /*
  function checkHandlers( swiper, handlersArr ){
    var h = swiper[__eventHandlers];
    for(var i=0; i<handlersArr.length; i++) if( handlersArr[i] in h ) return true;
    return false;
  }
  */
  function callHandler( that, name, argsArr ){
    var func = that[__eventHandlers][name];
    if( func ){
      if( that[__$scope] && that[__callApply] ) 
        that[__$scope].$apply(function(){ func.apply( that, argsArr ); });
      else func.apply( that, argsArr );
    }
  }
  
  //  Get the target element from the event, appling all the hacks needed
  function getElementFromEvent(event){
    event = getEvent(event);
    var element = event.target || event.srcElement ; // IE uses srcElement.
    // Hack for Safari, which can target text nodes instead of containers.
    if (element.nodeType === 3) {
      element = element.parentNode;
    }
    return element ;
  }
  
  
  var generalDragging = [],
      generalTapping = []
    //  _SwiperStaticId = 1
    ;
  //console.log( 'Swiper generalDragging map', generalDragging );
  //console.log( 'Swiper generalTapping map', generalTapping );
  /**
   * @ngdoc Class
   * @name Swiper
   * 
   * @description
   * This is the Swiper class, used by the {@link ngTouch $swipe} module to hold
   * the configuration of the actual bind call.
   * 
   * Every time a 'bind call' is executed an instance of this class will be
   * created to hold the configurations and to handle the events.
   * 
   * @param {object} config Configuration object to override the default values
   */
  function Swiper(config){
    var that = this;
    //that[__$id] = _SwiperStaticId++;
    that[__element] = config[__element];
    that[__eventHandlers] = config[__eventHandlers];
    
    that[__tapDuration] = config[__tapDuration] || provider[__tapDuration]; 
    that[__moveTolerance] = config[__moveTolerance] || provider[__moveTolerance];
    that[__preventDuration] = config[__preventDuration] || provider[__preventDuration];
    that[__moveBufferRadius] = config[__moveBufferRadius] || provider[__moveBufferRadius] ;
    that[__preventMouseFromTouch] = config[__preventMouseFromTouch] || provider[__preventMouseFromTouch];
    //that[__preventMoveFromDrag] = config[__preventMoveFromDrag] || provider[__preventMoveFromDrag];
    that[__clickbusterThreshold] = config[__clickbusterThreshold] || provider[__clickbusterThreshold];
    
    that[__$scope] = config[__$scope] ;
    that[__callApply] = config[__callApply] || true ;
    that[__callDestroy] = config[__callDestroy] || true ;
    that[__blurGhostClickElement] = config[__blurGhostClickElement] || true;
    
    
    that[__hasTouchEvents] = false; // to find if this browser has touch events (need to stay in separate var!)
    that[__lastStartEvent] = null;
    that[__lastMoveEvent] = null;
    that[__lastEndEvent] = null;
    that[__lastCancelEvent] = null;

    that[__tapping] = false;       // to simulate the 'tap' event
    that[__dragging] = false;      // to simulate de 'drag' event
    that[__startTime] = 0;         // Used to check if the tap was held too long.
    that[__touchStartX] = 0; 
    that[__touchStartY] = 0; 
    that[__totalX] = 0;            // Absolute total movement, used to control swipe vs. scroll.
    that[__totalY] = 0;            // Absolute total movement, used to control swipe vs. scroll.
    that[__startCoords] = null;    // Coordinates of the start position.
    //that[__lastPos] = null;        // Last event's position.
  }
  var proto = Swiper.prototype;
  proto[__resetState] = function(){
    var that = this;
    that[__tapping] = false;
    that[__dragging] = false;
    that[__element].removeClass(ACTIVE_CLASS_NAME);
  };
  proto[__handleStart] = function(eventFired){
    var that = this ;
    
    that[__lastStartEvent] = eventFired;
    
      // TAP proccess
    if( that[__eventHandlers]['tap'] ){
      that[__element].addClass(ACTIVE_CLASS_NAME); // only put the class if tapping or dragging
      that[__startTime] = Date.now();
      var e = getEvent(eventFired);
      that[__touchStartX] = e.clientX;
      that[__touchStartY] = e.clientY;
      that[__tapping] = true;
      generalTapping.push( that );
    }
    
      // DRAG proccess
    if( that[__eventHandlers]['drag'] ){
      that[__element].addClass(ACTIVE_CLASS_NAME); // only put the class if tapping or dragging
      that[__dragging] = true;
      generalDragging.push( that );
      that[__totalX] = 0;
      that[__totalY] = 0;
    }
    
    //that[__lastPos] = 
    that[__startCoords] = getCoordinates(eventFired);
    callHandler( that, 'start', [ that[__startCoords], eventFired ] );
  };
  proto[__handleDrag] = function(eventFired){
    var that = this;
    var coords = getCoordinates(eventFired);
    //that[__totalX] += Math.abs(coords.x - that[__lastPos].x);
    //that[__totalY] += Math.abs(coords.y - that[__lastPos].y);
    //that[__lastPos] = coords;
    /* 
    if (that[__totalX] < that[__moveBufferRadius] && that[__totalY] < that[__moveBufferRadius]) {
      return;
    }
    */
    // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
    //if (that[__totalY] > that[__totalX]) {
      // Allow native scrolling to take over.
    //  that[__handleCancel](eventFired);
    //} else {
      // Prevent the browser from scrolling.
      eventFired.preventDefault();
      callHandler( that, 'drag', [ coords, eventFired ] );
    //}
  };
  proto[__handleMove] = function(eventFired){
    var that = this;
    var coords = getCoordinates(eventFired);
    callHandler( that, 'move', [ coords, eventFired ] );
  };
  proto[__handleEnd] = function(eventFired){
    var that = this;
    that[__lastEndEvent] = eventFired;
    
    var coords = getCoordinates(eventFired);
    
      // check if this is a tap:
    if( that[__tapping] ){
      var diff = Date.now() - that[__startTime];
      var x = coords.x;
      var y = coords.y;
      var dist = Math.sqrt(Math.pow(x - that[__touchStartX], 2) + Math.pow(y - that[__touchStartY], 2));
      if ( diff < that[__tapDuration] && dist < that[__moveTolerance]){
        callHandler( that, 'tap', [ coords, eventFired ] );
      }
      for( var i=0; i<generalTapping.length; i++ ){
        if( generalTapping[i] === that ){
          generalTapping.splice( i, 1 );
          break;
        }
      }
    }
    
      // check dragging to remove that from the list
    if( that[__dragging] && that[__element][0] === getElementFromEvent(eventFired) ){
      for( var i=0; i<generalDragging.length; i++ ){
        if( generalDragging[i] === that ){
          generalDragging.splice( i, 1 );
          break;
        }
      }
    }
    
    callHandler( that, 'end', [ coords, eventFired ] );
    that[__resetState]();
  };
  proto[__handleCancel] = function(eventFired){
    var that = this;
    that[__lastCancelEvent] = eventFired;
    callHandler( that, 'cancel', [ eventFired ] );
    that[__resetState]();
  };
  proto[__unbind] = function(){
    // default implementation
  };
  
  
  
  //==============================================================
  
    /**
     * @ngdoc service
     * @name $swipe
     *
     * @description
     * The `$swipe` service is a service that abstracts the messier details of hold-and-drag swipe
     * behavior, to make implementing swipe-related directives more convenient.
     *
     * Requires the {@link ngTouch `ngTouch`} module to be installed.
     *
     * `$swipe` is used by the `ngSwipeLeft`, `ngSwipeRight` and `ngClick` directives in `ngTouch` module.
     *
     * # Usage
     * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
     * which is to be watched for swipes, and an object with four handler functions. See the
     * documentation for `bind` below.
     */
  provider.$get = ['$rootElement','$timeout',function($rootElement,$timeout){ 
    
    // the below line is a piece of code from modernizr:
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
    var _hasTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    
    
    function _generalEndHandle(event){
      for(var i=0; i<generalDragging.length; i++){
        generalDragging[i][__handleDrag](event);
        generalDragging[i][__handleEnd](event);
        generalDragging[i][__resetState]();
      }
      for(var i=0; i<generalTapping.length; i++){
        // don't handle tap, because this was outside the element borders, just reset
        generalTapping[i][__resetState]();
      }
      generalDragging = []; // remove all draggings
      generalTapping = []; // remove all tappings
      if( _hasTouch && event.target.nodeName === 'INPUT' ){
        event.target.focus();
      }
    }
    function _generalDragHandle(event){
      for(var i=0; i<generalDragging.length; i++){
        generalDragging[i][__handleDrag](event);
      }
    }
    
    
    // first, last setup the 'ghostclick' handler on the '$rootElement' on propagation fase:
    var _swipers = [],
        _swiperEventsProps = [ __lastStartEvent, __lastMoveEvent, __lastEndEvent, __lastCancelEvent ],
        $rootElementEl = $rootElement[0],
        _lastLabelClickCoords = null;
    
    $rootElementEl[__addEventListener]('mouseup', _generalEndHandle, false); // general end handle on bubbling fase
    $rootElementEl[__addEventListener]('mousemove', _generalDragHandle, false); // general drag handle on bubbling fase
    if( _hasTouch ){
      $rootElementEl[__addEventListener]('touchend', _generalEndHandle, false); // general handle on bubbling fase
      $rootElementEl[__addEventListener]('touchmove', _generalDragHandle, false); // general handle on bubbling fase
      $rootElementEl[__addEventListener]('mousedown',_ghostclick,true); // can be thrown after a 'touchstart'
      //$rootElementEl[__addEventListener]('mousemove',_ghostclick,true); // can be thrown after a 'touchend' or a 'touchmove'
      $rootElementEl[__addEventListener]('mouseup',_ghostclick,true); // can be thrown after a 'touchend'
      $rootElementEl[__addEventListener]('click',_ghostclick,true); // can be thrown after a 'touchstart' followed by a 'touchend'
    }
    function setupSwiperGhostClick( swiper ){
      if( !_hasTouch ) return;
      function _timeoutHandler(){ 
        for(var i=0; i<_swipers.length; i++){ 
          if( _swipers[i] === swiper ){
            _swipers.splice( i, 1 );
            break; 
          }
        } 
      }
      if( !swiper[__preventMouseFromTouch] ) return;
      _swipers.push( swiper );
      $timeout( _timeoutHandler, swiper[__preventDuration] );
    }
    function _ghostclick(mouseEvent){
      var swiper = null, 
          touchEvent = null,
          mousePos = getCoordinates( mouseEvent );
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
      for(var i=0; i<_swipers.length; i++){
        swiper = _swipers[i];
        for(var y=0; y<_swiperEventsProps.length; y++){
          if( !(touchEvent = swiper[_swiperEventsProps[y]]) )continue;
          var touchPos = getCoordinates( touchEvent );
          
          // the position of the mouse event dispatched can be a little off the
          // position of the touch event, so some calcs are needed
          if( Math.abs(touchPos.x - mousePos.x) < swiper[__clickbusterThreshold] 
              && Math.abs(touchPos.y - mousePos.y) < swiper[__clickbusterThreshold] ){
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
    
    /* */
    
    var scopedSwipers = {},
      __ElementStaticId = 1;
    // now, our service handlers:
    function onFunc(element, eventHandlers, config) {
        if(!(config instanceof Object)) config = {};
        var scope = config.$scope;
          // check the registry
        if( element[__$swiperId] ){
          var swipe = scopedSwipers[element[__$swiperId]];
          swipe[__eventHandlers] = angular.extend( swipe[__eventHandlers], eventHandlers );
          return swipe; // just have an entry in registry, so don't need to proccess
        }
        config[__element] = angular.element( element );
        config[__eventHandlers] = eventHandlers;
        var swiper = new Swiper(config);
        
        /*
        // ===  Touch events  ===
        if( checkHandlers( swiper, ['start','tap','drag'] ) )  element.on('touchstart', _touchstart );
        if( checkHandlers( swiper, ['drag'] ) )                element.on('touchmove', _touchmove );
        if( checkHandlers( swiper, ['end','tap','drag'] ) )    element.on('touchend', _touchend );
        if( checkHandlers( swiper, ['cancel'] ) )              element.on('touchcancel', _touchcancel );
        // ===  Mouse events  ===
        if( checkHandlers( swiper, ['start','tap','drag'] ) )  element.on('mousedown', _mousedown );
        if( checkHandlers( swiper, ['move','drag'] ) )         element.on('mousemove', _mousemove );
        if( checkHandlers( swiper, ['end','tap','drag'] ) )    element.on('mouseup', _mouseup );
        */
        
        element.on('touchstart', _touchstart );
        //element.on('touchmove', _touchmove );
        element.on('touchend', _touchend );
        element.on('touchcancel', _touchcancel );
        
        element.on('mousedown', _mousedown );
        element.on('mousemove', _mousemove );
        element.on('mouseup', _mouseup );
        
        // set handler for unbind
        //var delegateImpl = swiper[__unbind];
        swiper[__unbind] = function(){
          element.off('touchstart', _touchstart );
          element.off('touchmove', _touchmove );
          element.off('touchend', _touchend );
          element.off('touchcancel', _touchcancel );

          element.off('mousedown', _mousedown );
          element.off('mousemove', _mousemove );
          element.off('mouseup', _mouseup );
          
          if( element[__$swiperId] ){
            //scopedSwipers[element[__$swiperId]] = null;
            delete scopedSwipers[element[__$swiperId]]; // the 'ids' will never be reused!
          }
          element = null;
          swiper = null;
          //delegateImpl.call( swiper ); // call default impl.
        };
        
        if( scope && swiper[__callDestroy] ){
          element[__$swiperId] = __ElementStaticId++;
          scopedSwipers[element[__$swiperId]] = swiper;
          scope.$on('$destroy', function(){ swiper[__unbind](); } ); // set 'swiper.unbind' on '$scope#$on($destroy)'
        }
        
        return swiper ;
        
        // =========  Handlers  =========
        function _touchstart(eventFired){
          //swiper[__hasTouchEvents] = true;
          setupSwiperGhostClick( swiper );
          swiper[__handleStart](eventFired);
        }
        function _touchmove(eventFired){
          //swiper[__hasTouchEvents] = true;
          setupSwiperGhostClick( swiper );
          swiper[__handleMove](eventFired);
        }
        function _touchend(eventFired) {
          //swiper[__hasTouchEvents] = true;
          setupSwiperGhostClick( swiper );
          swiper[__handleEnd](eventFired);
        }
        function _touchcancel(eventFired) {
          //swiper[__hasTouchEvents] = true;
          setupSwiperGhostClick( swiper );
          swiper[__handleCancel](eventFired);
        }
        function _mousedown(eventFired) {
          swiper[__handleStart](eventFired);
        }
        function _mousemove(eventFired) {
          swiper[__handleMove](eventFired);
        }
        function _mouseup(eventFired) {
          swiper[__handleEnd](eventFired);
        }
        
      }
    
    
    return {
      /**
       * @ngdoc method
       * @name $swipe#bind
       *
       * @description
       * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
       * object containing event handlers.
       * The pointer types that should be used can be specified via the optional
       * third argument, which is an array of strings `'mouse'` and `'touch'`. By default,
       * `$swipe` will listen for `mouse` and `touch` events.
       *
       * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
       * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }` and the raw
       * `event`. `cancel` receives the raw `event` as its single parameter.
       *
       * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
       * watching for `touchmove` or `mousemove` events. These events are ignored until the total
       * distance moved in either dimension exceeds a small threshold.
       *
       * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
       * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
       * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
       *   A `cancel` event is sent.
       *
       * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
       * a swipe is in progress.
       *
       * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
       *
       * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
       * as described above.
       *
       */
      bind: onFunc ,
      
    };
  }];
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




})(window,window.angular);
