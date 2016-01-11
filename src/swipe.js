'use strict';

/* global ngTouch: false */

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
     * `$swipe` is used by the `ngSwipeLeft` and `ngSwipeRight` directives in `ngTouch`.
     *
     * # Usage
     * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
     * which is to be watched for swipes, and an object with four handler functions. See the
     * documentation for `bind` below.
     */

ngTouch.factory('$swipe', ['$timeout',
        function($timeout) {
        
  var ACTIVE_CLASS_NAME = 'ng-click-active';
  
  // The total distance in any direction before we make the call on swipe vs. scroll.
  //var MOVE_BUFFER_RADIUS = 10; // for a 'swipe' event, like 'swipeleft' or 'swiperight'
  
  /*
   * Events in the '$swipe':
   *  - start : fired on 'touchstart' or 'mousedown'
   *  - move : fired on 'touchmove' or 'mousemove'
   *  - end : fired on 'touchend' or 'mouseup'
   *  - tap : fired on 'touchend after touchstart' or 'mouseup after mousedown' ('click' events are never listen)
   * 
   */

  
  //==============================================================
        //  The code
  
  //  Get the real event: the touch event or the click event, any of the two
  function getEvent(event){
    // get jQuery 'originalEvent'
    event = event.originalEvent || event;
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
  
  //==============================================================
  
  
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
    bind: function(element, eventHandlers, pointerTypes) {

        // vars to hold some configurations about the behavior of this element
      var  TAP_DURATION = 750, // Shorter than 750ms is a tap, longer is a taphold or drag.
        MOVE_TOLERANCE = 12, // 12px seems to work in most mobile browsers.
        PREVENT_DURATION = 2500, // 2.5 seconds maximum from preventGhostClick call to click
        //CLICKBUSTER_THRESHOLD = 25, // 25 pixels in any dimension is the limit for busting clicks.
        MOVE_BUFFER_RADIUS = 10 , // The total distance in any direction before we make the call on swipe vs. scroll.
        preventMouseFromTouch = true, // to prevent or not the 'mouse' events when the 'touch' events were fired
        preventMoveFromDrag = true, // to prevent or not the 'move' event when the 'drag' event is been fired
        
        hasTouchEvents = false, // to find if this browser has touch events (need to stay in separate var!)
        lastStartEvent = null,
        lastMoveEvent = null,
        lastEndEvent = null,
        lastCancelEvent = null,
      
        tapping = false, // to simulate the 'tap' event
        dragging = false, // to simulate de 'drag' event
        startTime,   // Used to check if the tap was held too long.
        touchStartX,
        touchStartY
      ;

      // Absolute total movement, used to control swipe vs. scroll.
      var totalX, totalY;
      // Coordinates of the start position.
      var startCoords;
      // Last event's position.
      var lastPos;

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
          if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
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
        if (tapping && diff < TAP_DURATION && dist < MOVE_TOLERANCE){
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
        if( preventMouseFromTouch && hasTouchEvents && (eventFired.timeStamp - lastStartEvent.timeStamp < PREVENT_DURATION) ){
          eventFired.preventDefault();
          eventFired.stopPropagation();
          return; // just stop this event and return
        }
        handleStart(eventFired);
      });

      element.on('mousemove', function(eventFired) {
        if( preventMouseFromTouch && hasTouchEvents && (eventFired.timeStamp - lastMoveEvent.timeStamp < PREVENT_DURATION) ){
          eventFired.preventDefault();
          eventFired.stopPropagation();
          return; // just stop this event and return
        }
        handleMove(eventFired);
      });

      element.on('mouseup', function(eventFired) {
        if( preventMouseFromTouch && hasTouchEvents && (eventFired.timeStamp - lastEndEvent.timeStamp < PREVENT_DURATION) ){
          eventFired.preventDefault();
          eventFired.stopPropagation();
          return; // just stop this event and return
        }
        handleEnd(eventFired);
      });
      
      
    }
  };
}]);
