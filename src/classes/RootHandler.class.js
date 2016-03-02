
  
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

