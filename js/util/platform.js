(function(global){
  'use strict';

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};

  function safeString(value){
    return value == null ? '' : String(value);
  }

  function getNavigator(){
    try { return global.navigator || null; } catch (_) { return null; }
  }

  function getUserAgent(){
    var nav = getNavigator();
    return nav && nav.userAgent ? safeString(nav.userAgent) : '';
  }

  function getPlatform(){
    var nav = getNavigator();
    return nav && nav.platform ? safeString(nav.platform) : '';
  }

  function hasTouchPoints(){
    try {
      var nav = getNavigator();
      if (!nav) return false;
      if (typeof nav.maxTouchPoints === 'number') return nav.maxTouchPoints > 1;
      if (typeof nav.msMaxTouchPoints === 'number') return nav.msMaxTouchPoints > 0;
      return false;
    } catch (_) { return false; }
  }

  function isIOS(){
    try {
      var ua = getUserAgent();
      var plat = getPlatform();
      if (!ua && !plat) return false;
      var iDevice = /(iPad|iPhone|iPod)/i.test(ua) || /(iPad|iPhone|iPod)/i.test(plat);
      var touchMac = /Mac/i.test(plat) && hasTouchPoints();
      return !!(iDevice || touchMac);
    } catch (_) { return false; }
  }

  function isAndroid(){
    try { return /Android/i.test(getUserAgent()); } catch (_) { return false; }
  }

  function isWindows(){
    try { return /Windows/i.test(getUserAgent()); } catch (_) { return false; }
  }

  function isMac(){
    try {
      if (isIOS()) return false;
      var ua = getUserAgent();
      var plat = getPlatform();
      return /Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(plat);
    } catch (_) { return false; }
  }

  function isMobile(){
    try {
      var ua = getUserAgent();
      return /(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/i.test(ua);
    } catch (_) { return false; }
  }

  NS.util.platform = {
    getUserAgent: getUserAgent,
    getPlatform: getPlatform,
    isIOS: isIOS,
    isAndroid: isAndroid,
    isWindows: isWindows,
    isMac: isMac,
    isMobile: isMobile
  };
})(window);
