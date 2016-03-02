
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

