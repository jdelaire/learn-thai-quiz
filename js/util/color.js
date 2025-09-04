(function(global){
  'use strict';

  function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) { h = h.split('').map(function(x){ return x + x; }).join(''); }
    const bigint = parseInt(h, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function rgbToHex(r, g, b) {
    function toHex(x){ return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = function(p, q, t){
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
  }

  function adjustLightness(hex, delta) {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.max(0, Math.min(1, hsl.l + delta));
    const nrgb = hslToRgb(hsl.h, hsl.s, newL);
    return rgbToHex(nrgb.r, nrgb.g, nrgb.b);
  }

  function getDisplayHex(baseHex, modifier) {
    if (!modifier) return baseHex;
    const eng = String(modifier.english || '');
    if (/^light$/i.test(eng)) return adjustLightness(baseHex, 0.25);
    if (/^dark$/i.test(eng)) return adjustLightness(baseHex, -0.25);
    return baseHex;
  }

  function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    const a = (typeof alpha === 'number') ? alpha : 1;
    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + a + ')';
  }

  var NS = global.__TQ = global.__TQ || {};
  NS.util = NS.util || {};
  NS.util.color = {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    adjustLightness: adjustLightness,
    getDisplayHex: getDisplayHex,
    hexToRgba: hexToRgba
  };
})(window);

