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
