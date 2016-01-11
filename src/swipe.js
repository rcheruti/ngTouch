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
ngTouch.provider('$swipe', [
        function() {
  
  // names for minifying:
  var __tapDuration = 'tapDuration',
      __moveTolerance = 'moveTolerance',
      __preventDuration = 'preventDuration',
      __moveBufferRadius = 'moveBufferRadius',
      __preventMouseFromTouch = 'preventMouseFromTouch',
      __preventMoveFromDrag = 'preventMoveFromDrag',
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
      __handleMove = 'handleMove'
  ;
  
  var provider = this;
  provider[__tapDuration] = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  provider[__moveTolerance] = 12; // 12px seems to work in most mobile browsers.
  provider[__preventDuration] = 2500; // 2.5 seconds maximum from preventGhostClick call to click
  //this.clickbusterThreshold = 25; // 25 pixels in any dimension is the limit for busting clicks.
  provider[__moveBufferRadius] = 10 ; // The total distance in any direction before we make the call on swipe vs. scroll.
  provider[__preventMouseFromTouch] = true; // to prevent or not the 'mouse' events when the 'touch' events were fired
  provider[__preventMoveFromDrag] = true; // to prevent or not the 'move' event when the 'drag' event is been fired
  
  var ACTIVE_CLASS_NAME = 'ng-click-active';
  
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
  */
  
  function Swiper(){
    var that = this;
    that[__element] = null;
    that[__eventHandlers] = null;
    
    that[__tapDuration] = provider[__tapDuration];
    that[__moveTolerance] = provider[__moveTolerance];
    that[__preventDuration] = provider[__preventDuration];
    that[__moveBufferRadius] = provider[__moveBufferRadius] ;
    that[__preventMouseFromTouch] = provider[__preventMouseFromTouch];
    that[__preventMoveFromDrag] = provider[__preventMoveFromDrag];
    
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
    that[__lastPos] = null;        // Last event's position.
  }
  var proto = Swiper.prototype;
  proto[__resetState] = function(){
    this[__tapping] = false;
    this[__dragging] = false;
    this[__element].removeClass(ACTIVE_CLASS_NAME);
  };
  proto[__handleStart] = function(eventFired){
    var that = this;
    that[__lastStartEvent] = eventFired;
    that[__tapping] = true;
    that[__element].addClass(ACTIVE_CLASS_NAME);
    that[__startTime] = Date.now();
    var e = getEvent(eventFired);
    that[__touchStartX] = e.clientX;
    that[__touchStartY] = e.clientY;

    that[__dragging] = true;
    that[__totalX] = 0;
    that[__totalY] = 0;
    that[__lastPos] = that[__startCoords] = getCoordinates(e);
    if( that[__eventHandlers]['start'] ) that[__eventHandlers]['start'](that[__startCoords], eventFired);
  };
  proto[__handleMove] = function(eventFired){
    var that = this;
    var coords = getCoordinates(eventFired);
    if( that[__dragging] ){
      that[__totalX] += Math.abs(coords.x - that[__lastPos].x);
      that[__totalY] += Math.abs(coords.y - that[__lastPos].y);
      that[__lastPos] = coords;
      if (that[__totalX] < that[__moveBufferRadius] && that[__totalY] < that[__moveBufferRadius]) {
        return;
      }
      // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
      if (that[__totalY] > that[__totalX]) {
        // Allow native scrolling to take over.
        that[__handleCancel](eventFired);
      } else {
        // Prevent the browser from scrolling.
        eventFired.preventDefault();
        if( that[__eventHandlers]['drag'] ) that[__eventHandlers]['drag'](coords, eventFired);
      }
    }

      // prevent the move if the drag was fired?
    if( !(that[__preventMoveFromDrag] && that[__dragging]) ){
      if( that[__eventHandlers]['move'] ) that[__eventHandlers]['move'](coords, eventFired);
    }

  };
  proto[__handleEnd] = function(eventFired){
    var that = this;
    that[__lastEndEvent] = eventFired;
    var diff = Date.now() - that[__startTime];
    var e = getEvent(eventFired);
    var x = e.clientX;
    var y = e.clientY;
    var dist = Math.sqrt(Math.pow(x - that[__touchStartX], 2) + Math.pow(y - that[__touchStartY], 2));
    var coords = getCoordinates(e);

      // check if this is a tap:
    if (that[__tapping] && diff < that[__tapDuration] && dist < that[__moveTolerance]){
      if( that[__eventHandlers]['tap'] ) that[__eventHandlers]['tap'](coords, eventFired);
    }

    if( that[__eventHandlers]['end'] ) that[__eventHandlers]['end'](coords, eventFired);
    that[__resetState]();
  };
  proto[__handleCancel] = function(eventFired){
    var that = this;
    that[__lastCancelEvent] = eventFired;
    if( that[__eventHandlers]['cancel'] ) that[__eventHandlers]['cancel']( eventFired );
    that[__resetState]();
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
  this.$get = [function(){ 
      
    function onFunc(element, eventHandlers, config) {
        if( !config ) config = {}; // make ever an object
        
          // vars to hold some configurations about the behavior of this element,
          // first are the provider's defaults overrides
        var  tapDuration =  config[__tapDuration] || provider[__tapDuration],
          moveTolerance = config[__moveTolerance] || provider[__moveTolerance], 
          preventDuration = config[__preventDuration] || provider[__preventDuration], 
          //clickbusterThreshold = config.clickbusterThreshold || provider.clickbusterThreshold, 
          moveBufferRadius = config[__moveBufferRadius] || provider[__moveBufferRadius] ,
          preventMouseFromTouch = config[__preventMouseFromTouch] || provider[__preventMouseFromTouch], 
          preventMoveFromDrag = config[__preventMoveFromDrag] || provider[__preventMoveFromDrag],

          hasTouchEvents = false, // to find if this browser has touch events (need to stay in separate var!)
          lastStartEvent = null,
          lastMoveEvent = null,
          lastEndEvent = null,
          lastCancelEvent = null,

          tapping = false, // to simulate the 'tap' event
          dragging = false, // to simulate de 'drag' event
          startTime,   // Used to check if the tap was held too long.
          touchStartX,
          touchStartY,
          totalX,       // Absolute total movement, used to control swipe vs. scroll.
          totalY,       // Absolute total movement, used to control swipe vs. scroll.
          startCoords,  // Coordinates of the start position.
          lastPos       // Last event's position.
        ;

        function resetState() {
          tapping = false;
          dragging = false;
          element.removeClass(ACTIVE_CLASS_NAME);
        }
        function handleStart(eventFired){
          lastStartEvent = eventFired;
          tapping = true;
          element.addClass(ACTIVE_CLASS_NAME);
          startTime = Date.now();
          var e = getEvent(eventFired);
          touchStartX = e.clientX;
          touchStartY = e.clientY;

          dragging = true;
          totalX = 0;
          totalY = 0;
          lastPos = startCoords = getCoordinates(e);
          if( eventHandlers['start'] ) eventHandlers['start'](startCoords, eventFired);
        }
        function handleMove(eventFired){
          var coords = getCoordinates(eventFired);
          if( dragging ){
            totalX += Math.abs(coords.x - lastPos.x);
            totalY += Math.abs(coords.y - lastPos.y);
            lastPos = coords;
            if (totalX < moveBufferRadius && totalY < moveBufferRadius) {
              return;
            }
            // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
            if (totalY > totalX) {
              // Allow native scrolling to take over.
              handleCancel(eventFired);
            } else {
              // Prevent the browser from scrolling.
              eventFired.preventDefault();
              if( eventHandlers['drag'] ) eventHandlers['drag'](coords, eventFired);
            }
          }

            // prevent the move if the drag was fired?
          if( !(preventMoveFromDrag && dragging) ){
            if( eventHandlers['move'] ) eventHandlers['move'](coords, eventFired);
          }

        }
        function handleEnd(eventFired){
          lastEndEvent = eventFired;
          var diff = Date.now() - startTime;
          var e = getEvent(eventFired);
          var x = e.clientX;
          var y = e.clientY;
          var dist = Math.sqrt(Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2));
          var coords = getCoordinates(e);

            // check if this is a tap:
          if (tapping && diff < tapDuration && dist < moveTolerance){
            if( eventHandlers['tap'] ) eventHandlers['tap'](coords, eventFired);
          }

          if( eventHandlers['end'] ) eventHandlers['end'](coords, eventFired);
          resetState();
        }
        function handleCancel(eventFired){
          lastCancelEvent = eventFired;
          if( eventHandlers['cancel'] ) eventHandlers['cancel']( eventFired );
          resetState();
        }


        // ===  Touch events  ===
        element.on('touchstart', function(eventFired){
          hasTouchEvents = true;
          handleStart(eventFired);
        });

        element.on('touchmove', function(eventFired){
          hasTouchEvents = true;
          handleMove(eventFired);
        });

        element.on('touchend', function(eventFired) {
          hasTouchEvents = true;
          handleEnd(eventFired);
        });

        element.on('touchcancel', function(eventFired) {
          hasTouchEvents = true;
          handleCancel(eventFired);
        });

        // ===  Mouse events  ===
          // mouse events are a bit different from touch just to prevent they from double touching the UI

        element.on('mousedown', function(eventFired) {
          if( preventMouseFromTouch && hasTouchEvents && lastStartEvent && (eventFired.timeStamp - lastStartEvent.timeStamp < preventDuration) ){
            eventFired.preventDefault();
            eventFired.stopPropagation();
            return; // just stop this event and return
          }
          handleStart(eventFired);
        });

        element.on('mousemove', function(eventFired) {
          // we need a little hack here:
          // the 'mousemove' event is fired after a 'touchend' (in the same position/coordinates)
          // if the 'tap' is too fast. e.g.: if we tap too fast the mousemove wil be fired.
          // To workaround that a check need to be done verifying if 'hasTouchEvents' is TRUE (we have touchs,
          // 'touchstart', maybe set it), 'lastMoveEvent' is FALSE/UNDEFINED (so 'touchmove' was never fired,
          // in notebooks we touch screen maybe this is realy possible (need tests!)) and if
          // the coordinates (getCoordinates(...)) of the 'mousemove' and 'touchend' are the same.
          // With these conditions we have a "fake mousemove event".
          // 
          // Also 'preventMouseFromTouch' need to be TRUE at the moment (this is just impl. decision).
          // 
          // > this hapens in "Chrome developer tools on device mode with touch simulator active"
          //

          if( preventMouseFromTouch && hasTouchEvents ){ 
            if( !lastMoveEvent ){
              var touchendCoords = getCoordinates(lastEndEvent),
                  mousemoveCoords = getCoordinates(eventFired);
              if( touchendCoords.x === mousemoveCoords.x && touchendCoords.y === mousemoveCoords.y ){
                eventFired.preventDefault();
                eventFired.stopPropagation();
                return; // just stop this event and return
              }
            }else if(lastMoveEvent && (eventFired.timeStamp - lastMoveEvent.timeStamp < preventDuration)){
              eventFired.preventDefault();
              eventFired.stopPropagation();
              return; // just stop this event and return
            }
          }
          handleMove(eventFired);
        });

        element.on('mouseup', function(eventFired) {
          if( preventMouseFromTouch && hasTouchEvents && lastEndEvent && (eventFired.timeStamp - lastEndEvent.timeStamp < preventDuration) ){
            eventFired.preventDefault();
            eventFired.stopPropagation();
            return; // just stop this event and return
          }
          handleEnd(eventFired);
        });


      }
    
    function offFunc(){  }
    
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
      
      /**
       * @ngdoc method
       * @name $swipe#on
       * 
       * @description 
       * This is just an alias for de {@link ngTouch `bind`} method.
       * 
       */
      on: onFunc ,
      
      /**
       * @ngdoc method
       * @name $swipe#off
       * 
       * @description 
       * This is an unbind method.
       * Implementation is pendding!
       * 
       */
      off: offFunc 
      
    };
  }];
}]);
