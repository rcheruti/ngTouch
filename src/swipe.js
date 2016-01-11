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

ngTouch.factory('$swipe', ['$parse','$timeout','$rootElement',
        function($parse,$timeout,$rootElement) {
        
  var TAP_DURATION = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  var MOVE_TOLERANCE = 12; // 12px seems to work in most mobile browsers.
  var PREVENT_DURATION = 2500; // 2.5 seconds maximum from preventGhostClick call to click
  var CLICKBUSTER_THRESHOLD = 25; // 25 pixels in any dimension is the limit for busting clicks.

  var ACTIVE_CLASS_NAME = 'ng-click-active';
  var lastPreventedTime;
  var touchCoordinates;
  var lastLabelClickCoordinates;
  
  // The total distance in any direction before we make the call on swipe vs. scroll.
  var MOVE_BUFFER_RADIUS = 10;

    // a new extra 'tap' event will be simulated
  var POINTER_EVENTS = {
    'mouse': {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    },
    'touch': {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      cancel: 'touchcancel'
    }
  };

  function getCoordinates(event) {
    var e = getEvent(event);
    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  function getEvents(pointerTypes, eventType) {
    var res = [];
    angular.forEach(pointerTypes, function(pointerType) {
      var eventName = POINTER_EVENTS[pointerType][eventType];
      if (eventName) {
        res.push(eventName);
      }
    });
    return res.join(' ');
  }
  
  //==============================================================
        // From ngClick directive, to make '$swipe' behavior the same way
  
  // TAP EVENTS AND GHOST CLICKS
  //
  // Why tap events?
  // Mobile browsers detect a tap, then wait a moment (usually ~300ms) to see if you're
  // double-tapping, and then fire a click event.
  //
  // This delay sucks and makes mobile apps feel unresponsive.
  // So we detect touchstart, touchcancel and touchend ourselves and determine when
  // the user has tapped on something.
  //
  // What happens when the browser then generates a click event?
  // The browser, of course, also detects the tap and fires a click after a delay. This results in
  // tapping/clicking twice. We do "clickbusting" to prevent it.
  //
  // How does it work?
  // We attach global touchstart and click handlers, that run during the capture (early) phase.
  // So the sequence for a tap is:
  // - global touchstart: Sets an "allowable region" at the point touched.
  // - element's touchstart: Starts a touch
  // (- touchcancel ends the touch, no click follows)
  // - element's touchend: Determines if the tap is valid (didn't move too far away, didn't hold
  //   too long) and fires the user's tap handler. The touchend also calls preventGhostClick().
  // - preventGhostClick() removes the allowable region the global touchstart created.
  // - The browser generates a click event.
  // - The global click handler catches the click, and checks whether it was in an allowable region.
  //     - If preventGhostClick was called, the region will have been removed, the click is busted.
  //     - If the region is still there, the click proceeds normally. Therefore clicks on links and
  //       other elements without ngTap on them work normally.
  //
  // This is an ugly, terrible hack!
  // Yeah, tell me about it. The alternatives are using the slow click events, or making our users
  // deal with the ghost clicks, so I consider this the least of evils. Fortunately Angular
  // encapsulates this ugly logic away from the user.
  //
  // Why not just put click handlers on the element?
  // We do that too, just to be sure. If the tap event caused the DOM to change,
  // it is possible another element is now in that position. To take account for these possibly
  // distinct elements, the handlers are global and care only about coordinates.

  // Checks if the coordinates are close enough to be within the region.
  function hit(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) < CLICKBUSTER_THRESHOLD && Math.abs(y1 - y2) < CLICKBUSTER_THRESHOLD;
  }

  // Checks a list of allowable regions against a click location.
  // Returns true if the click should be allowed.
  // Splices out the allowable region from the list after it has been used.
  function checkAllowableRegions(touchCoordinates, x, y) {
    for (var i = 0; i < touchCoordinates.length; i += 2) {
      if (hit(touchCoordinates[i], touchCoordinates[i + 1], x, y)) {
        touchCoordinates.splice(i, i + 2);
        return true; // allowable region
      }
    }
    return false; // No allowable region; bust it.
  }
  
  // On the first call, attaches some event handlers. Then whenever it gets called, it creates a
  // zone around the touchstart where clicks will get busted.
  function preventGhostClick(x, y) {
    if (!touchCoordinates) {
      //$rootElement[0].addEventListener('click', onClick, true);
      //$rootElement[0].addEventListener('touchstart', onTouchStart, true);
      touchCoordinates = [];
    }

    lastPreventedTime = Date.now();

    checkAllowableRegions(touchCoordinates, x, y);
  }
  
  
  
  

  // Global click handler that prevents the click if it's in a bustable zone and preventGhostClick
  // was called recently.
  function onClick(event) {
    if (Date.now() - lastPreventedTime > PREVENT_DURATION) {
      return; // Too old.
    }
    
    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    // Work around desktop Webkit quirk where clicking a label will fire two clicks (on the label
    // and on the input element). Depending on the exact browser, this second click we don't want
    // to bust has either (0,0), negative coordinates, or coordinates equal to triggering label
    // click event
    if (x < 1 && y < 1) {
      return; // offscreen
    }
    if (lastLabelClickCoordinates &&
        lastLabelClickCoordinates[0] === x && lastLabelClickCoordinates[1] === y) {
      return; // input click triggered by label click
    }
    // reset label click coordinates on first subsequent click
    if (lastLabelClickCoordinates) {
      lastLabelClickCoordinates = null;
    }
    // remember label click coordinates to prevent click busting of trigger click event on input
    if (nodeName_(event.target) === 'label') {
      lastLabelClickCoordinates = [x, y];
    }

    // Look for an allowable region containing this click.
    // If we find one, that means it was created by touchstart and not removed by
    // preventGhostClick, so we don't bust it.
    if (checkAllowableRegions(touchCoordinates, x, y)) {
      return;
    }

    // If we didn't find an allowable region, bust the click.
    event.stopPropagation();
    event.preventDefault();

    // Blur focused form elements
    event.target && event.target.blur && event.target.blur();
  }


  // Global touchstart handler that creates an allowable region for a click event.
  // This allowable region can be removed by preventGhostClick if we want to bust it.
  function onTouchStart(event) {
    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    touchCoordinates.push(x, y);

    $timeout(function() {
      // Remove the allowable region.
      for (var i = 0; i < touchCoordinates.length; i += 2) {
        if (touchCoordinates[i] === x && touchCoordinates[i + 1] === y) {
          touchCoordinates.splice(i, i + 2);
          return;
        }
      }
    }, PREVENT_DURATION, false);
  }

  
  
  //==============================================================
        //  The code
  
  //  Get the real event: the touch event or the click event, any of the two
  function getEvent(event){
    // get jQuery 'originalEvent'
    event = event.originalEvent || event;
    event = (event.changedTouches && event.changedTouches.length) ? event.changedTouches
      : (event.touches && event.touches.length ? event.touches : [event]);
    return event;
  }
  //  Get the target element from the event, appling all the hacks needed
  function getElementFromEvent(event){
    event = getEvent(event)[0];
    var element = event.target || event.srcElement ; // IE uses srcElement.
    // Hack for Safari, which can target text nodes instead of containers.
    if (element.nodeType === 3) {
      element = element.parentNode;
    }
    return element ;
  }
  
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
        CLICKBUSTER_THRESHOLD = 25, // 25 pixels in any dimension is the limit for busting clicks.
        preventMouseFromTouch = true, // to prevent or not the 'mouse' events when the 'touch' events were fired
        clickHandler = function(){},
        hasTouchEvents = false, // to find if this browser has touch events (need to stay in separate var!)
        tapping = false, // to simulate the 'tap' event
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
      // Whether a swipe is active.
      var active = false;

      function resetState() {
        tapping = false;
        active = false;
        element.removeClass(ACTIVE_CLASS_NAME);
      }



      // ===  Touch events  ===
      element.on('touchstart', function(event){
        hasTouchEvents = true;
        tapping = true;
        element.addClass(ACTIVE_CLASS_NAME);
        startTime = Date.now();
        var e = getEvent(event)[0];
        touchStartX = e.clientX;
        touchStartY = e.clientY;

        // Added from '$swipe'
        active = true;
        totalX = 0;
        totalY = 0;
        lastPos = startCoords = getCoordinates(event);
        if( eventHandlers['start'] ) eventHandlers['start'](startCoords, event);
      });

      element.on('touchcancel', function(event) {
        hasTouchEvents = true;
        event = getEvent(event);
        if( eventHandlers['cancel'] ) eventHandlers['cancel'](event);
        resetState();
      });

      element.on('touchend', function(event) {
        hasTouchEvents = true;
        var diff = Date.now() - startTime;
        var e = getEvent(event)[0];
        var x = e.clientX;
        var y = e.clientY;
        var dist = Math.sqrt(Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2));
        var coords = getCoordinates(event);
        
        if (tapping && diff < TAP_DURATION && dist < MOVE_TOLERANCE) {
          // Call preventGhostClick so the clickbuster will catch the corresponding click.
          //preventGhostClick(x, y);

          // Blur the focused element (the button, probably) before firing the callback.
          // This doesn't work perfectly on Android Chrome, but seems to work elsewhere.
          // I couldn't get anything to work reliably on Android Chrome.
          /*  --- Why?
          var tapElement = getElementFromEvent(event);
          if (tapElement) {
            tapElement.blur();
          }
          */
          
          // Added from '$swipe'
          if( eventHandlers['tap'] ) eventHandlers['tap'](coords, event);
        }
        
        if( eventHandlers['end'] ) eventHandlers['end'](coords, event);
        resetState();

      });

      // Hack for iOS Safari's benefit. It goes searching for onclick handlers and is liable to click
      // something else nearby.
      //element.onclick = function(event) { };

      // ===  Mouse events  ===
      element.on('mousedown', function(event) {
        element.addClass(ACTIVE_CLASS_NAME);

          // Added from '$swipe'
        startCoords = getCoordinates(event);
          active = true;
          totalX = 0;
          totalY = 0;
          lastPos = startCoords;
          eventHandlers['start'] && eventHandlers['start'](startCoords, event);
      });

      element.on('mousemove', function(event) {
        element.removeClass(ACTIVE_CLASS_NAME);
      });

      element.on('mouseup', function(event) {
        element.removeClass(ACTIVE_CLASS_NAME);

          // Added from '$swipe'
        if (!active) return;
          active = false;
          eventHandlers['end'] && eventHandlers['end'](getCoordinates(event), event);
      });


    }
  };
}]);


