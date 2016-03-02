
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

