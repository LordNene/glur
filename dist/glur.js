!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.glur=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var glur = require('./lib/glur');

////////////////////////////////////////////////////////////////////////////////
// API methods

var blurCanvas = function (canvas, radius, callback) {
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var src = imageData.data;

  var data32 = new Uint32Array(src.buffer);
  var res = glur.blur32(data32, canvas.width, canvas.height, radius);

  imageData.data.set(res);
  ctx.putImageData(imageData, 0, 0);

  callback();
};

exports.blurCanvas = blurCanvas;
},{"./lib/glur":2}],2:[function(require,module,exports){
'use strict';

var buildKernel = function (radius) {
  var rows = radius * 2 + 1;
  var kernel = new Float32Array(rows);
  var sigma = radius / 3;
  var sigma22 = 2 * sigma * sigma;
  var sigmaPi2 = 2 * Math.PI * sigma;

  var sqrtSigmaPi2 = Math.sqrt(sigmaPi2);
  var radius2 = radius * radius;
  var total = 0;
  var index = 0;
  var row, distance;
  for (row = -radius; row <= radius; row++) {
    distance = row * row;
    if (distance > radius2)
      kernel[index] = 0;
    else
      kernel[index] = Math.exp(-1 * (distance) / sigma22) / sqrtSigmaPi2;
    total += kernel[index];
    index++;
  }
  for (row = 0; rows < rows; row++) {
    kernel[row] /= total;
  }

  return kernel;
};

var convolve = function (src, out, kernel, width, height, radius) {
  var x, y, rgb, r, g, b, a, weight_sum, out_index, y_offset, col, f;

  for (y = 0; y < height; y++) {
    out_index = y;
    y_offset = y * width;
    for (x = 0; x < width; x++) {
      r = 0;
      g = 0;
      b = 0;
      a = 0;
      weight_sum = 0;
      for (col = -radius; col <= radius; col++) {
        f = kernel[radius + col];

        if (f != 0) {
          var ix = x + col;
          if (ix < 0) {
            ix = 0;
          } else if (ix >= width) {
            ix = width - 1;
          }
          rgb = src[y_offset + ix];

          a += f * ((rgb >> 24) & 0xff);
          r += f * ((rgb >> 16) & 0xff);
          g += f * ((rgb >> 8) & 0xff);
          b += f * (rgb & 0xff);
          weight_sum += f;
        }
      }
      a = (a / weight_sum | 0) & 0xff;
      r = (r / weight_sum | 0) & 0xff;
      g = (g / weight_sum | 0) & 0xff;
      b = (b / weight_sum | 0) & 0xff;
      out[out_index] = (a << 24) | (r << 16) | (g << 8) | b;
      out_index += height;
    }
  }
};

var blur32 = function (src, width, height, radius) {
  var buf = new ArrayBuffer(width * height * 4);
  var out = new Uint32Array(buf);
  var kernel = buildKernel(radius);

  convolve(src, out, kernel, width, height, radius);
  convolve(out, src, kernel, height, width, radius);
  return new Uint8ClampedArray(src.buffer);
};

exports.blur32 = blur32;

},{}]},{},[1])(1)
});