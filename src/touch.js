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
