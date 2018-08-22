(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.imgViewer = factory());
}(this, (function () { 'use strict';

    var hello = function hello() {
        console.log('ddd');
    };

    return hello;

})));
