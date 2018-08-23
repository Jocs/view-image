(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('tslib')) :
    typeof define === 'function' && define.amd ? define(['tslib'], factory) :
    (global.ImgViewer = factory(global.tslib_1));
}(this, (function (tslib_1) { 'use strict';

    // ease out method
    /*
        t : current time,
        b : intial value,
        c : changed value,
        d : duration
    */
    var easeOutQuart = function easeOutQuart(t, b, c, d) {
        t /= d;
        t--;
        return -c * (t * t * t * t - 1) + b;
    };
    var noop = function noop() {};
    var id = 0;
    var getUniqueId = function getUniqueId() {
        return id++;
    };

    var EventCenter = /** @class */function () {
        function EventCenter() {
            this.events = [];
        }
        /**
         * [attachDOMEvent] bind event listener to target, and return a unique ID,
         * this ID
         */
        EventCenter.prototype.attachDOMEvent = function (target, event, listener, capture) {
            if (this.checkHasBind(target, event, listener, capture)) {
                return false;
            }
            var eventId = getUniqueId();
            target.addEventListener(event, listener, capture);
            this.events.push({
                eventId: eventId,
                target: target,
                event: event,
                listener: listener,
                capture: capture
            });
            return eventId;
        };
        /**
         * [detachDOMEvent removeEventListener]
         * @param  {[type]} eventId [unique eventId]
         */
        EventCenter.prototype.detachDOMEvent = function (eventId) {
            if (!eventId) {
                return false;
            }
            var removeEvent = this.events.filter(function (e) {
                return e.eventId === eventId;
            })[0];
            if (removeEvent) {
                var target = removeEvent.target,
                    event = removeEvent.event,
                    listener = removeEvent.listener,
                    capture = removeEvent.capture;
                target.removeEventListener(event, listener, capture);
            }
        };
        /**
         * [detachAllDomEvents remove all the DOM events handler]
         */
        EventCenter.prototype.detachAllDomEvents = function () {
            var _this = this;
            this.events.forEach(function (event) {
                return _this.detachDOMEvent(event.eventId);
            });
        };
        // Determine whether the event has been bind
        EventCenter.prototype.checkHasBind = function (cTarget, cEvent, cListener, cCapture) {
            for (var _i = 0, _a = this.events; _i < _a.length; _i++) {
                var _b = _a[_i],
                    target = _b.target,
                    event = _b.event,
                    listener = _b.listener,
                    capture = _b.capture;
                if (target === cTarget && event === cEvent && listener === cListener && capture === cCapture) {
                    return true;
                }
            }
            return false;
        };
        return EventCenter;
    }();

    var imageViewHtml = "\n<div class=\"iv-snap-view\">\n  <div class=\"iv-snap-image-wrap\">\n    <div class=\"iv-snap-handle\"></div>\n  </div>\n  <div class=\"iv-zoom-slider\">\n    <div class=\"iv-zoom-handle\"></div>\n  </div>\n</div>\n<div class=\"iv-image-view\">\n  <div class=\"iv-image-wrap\"></div>\n</div>\n";
    var defaultOptions = {
        zoomValue: 100,
        snapView: true,
        maxZoom: 1000,
        minZoom: 50,
        refreshOnResize: true,
        zoomOnMouseWheel: true,
        beforeload: noop,
        loaded: noop,
        failed: noop
    };
    // constants
    var ZOOM_CONSTANT = 15; // increase or decrease value for zoom on mouse wheel
    var MOUSE_WHEEL_COUNT = 5; // A mouse delta after which it should stop preventing default behaviour of mouse wheel
    var ZOOM_DELTA = 1.2;

    var Slider = /** @class */function () {
        function Slider(container, options) {
            this.container = container;
            this.eventCenter = options.eventCenter;
            this.onStart = options.onStart || noop;
            this.onMove = options.onMove || noop;
            this.onEnd = options.onEnd || noop;
            this.sliderId = options.sliderId || 'slider-' + getUniqueId();
        }
        Slider.prototype.init = function () {
            var _this = this;
            var _a = this,
                container = _a.container,
                eventCenter = _a.eventCenter;
            // assign event on snap image wrap
            var touchMouse = function touchMouse(eOrginal) {
                eOrginal.preventDefault();
                var moveId;
                var endId;
                var touchMove = eOrginal.type === 'touchstart' ? 'touchmove' : 'mousemove';
                var touchEnd = eOrginal.type === 'touchstart' ? 'touchend' : 'mouseup';
                var x = eOrginal.clientX || eOrginal.touches[0].clientX;
                var y = eOrginal.clientY || eOrginal.touches[0].clientY;
                var start = _this.onStart(eOrginal, {
                    x: x,
                    y: y
                });
                if (start === false) {
                    return;
                }
                var moveListener = function moveListener(emove) {
                    emove.preventDefault();
                    // get the cordinates
                    var mx = emove.clientX || emove.touches[0].clientX;
                    var my = emove.clientY || emove.touches[0].clientY;
                    _this.onMove(emove, {
                        dx: mx - x,
                        dy: my - y,
                        mx: mx,
                        my: my
                    });
                };
                var endListener = function endListener() {
                    eventCenter.detachDOMEvent(moveId);
                    eventCenter.detachDOMEvent(endId);
                    _this.onEnd();
                };
                moveId = eventCenter.attachDOMEvent(document, touchMove, moveListener);
                endId = eventCenter.attachDOMEvent(document, touchEnd, endListener);
            };
            ['touchstart', 'mousedown'].forEach(function (evt) {
                eventCenter.attachDOMEvent(container, evt, touchMouse);
            });
            return this;
        };
        return Slider;
    }();

    var ImageViewer = /** @class */function () {
        function ImageViewer(container, options) {
            this.container = container;
            this.options = tslib_1.__assign({}, defaultOptions, options);
            this.container.innerHTML = imageViewHtml;
            this.snapView = container.querySelector('.iv-snap-view');
            this.snapImageWrap = container.querySelector('.iv-snap-image-wrap');
            this.imageWrap = container.querySelector('.iv-image-wrap');
            this.snapHandle = container.querySelector('.iv-snap-handle');
            this.zoomHandle = container.querySelector('.iv-zoom-handle');
            this.zoomHandleWrap = container.querySelector('.iv-zoom-slider');
            this.viewerId = 'iv-' + getUniqueId();
            this.imgUrl = options.url;
            this.zoomValue = 100;
            this.zooming = false;
            this.eventCenter = new EventCenter();
            container.classList.add('iv-container');
            this.snapViewVisibility(false);
            if (getComputedStyle(container)['position'] === 'static') {
                container.style.position = 'relative';
            }
            // init image viewer
            this.init();
        }
        ImageViewer.prototype.init = function () {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var _a, beforeload, loaded, failed, image, err_1;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this.options, beforeload = _a.beforeload, loaded = _a.loaded, failed = _a.failed;
                            beforeload();
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3,, 4]);
                            return [4 /*yield*/, this.load(this.imgUrl)];
                        case 2:
                            image = _b.sent();
                            this.snapViewVisibility(true);
                            loaded(image);
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _b.sent();
                            this.container.innerHTML = '';
                            return [2 /*return*/, failed(err_1)];
                        case 4:
                            this.calculateDimensions();
                            this.initSnapSlider();
                            this.initImageSlider();
                            if (this.options.zoomOnMouseWheel) {
                                this.initZoomOnMouseWheel();
                            }
                            this.pinch();
                            this.doubleClick();
                            if (this.options.refreshOnResize) {
                                this.resizeHandler();
                            }
                            this.preventDefaultTouch();
                            this.zoomHandler();
                            this.resetZoom();
                            return [2 /*return*/];
                    }
                });
            });
        };
        ImageViewer.prototype.initSnapSlider = function () {
            var _a = this,
                snapHandle = _a.snapHandle,
                snapImageWrap = _a.snapImageWrap,
                viewerId = _a.viewerId,
                eventCenter = _a.eventCenter;
            var viewer = this;
            this.snapSlider = new Slider(snapImageWrap, {
                sliderId: viewerId,
                eventCenter: eventCenter,
                onStart: function onStart() {
                    if (!viewer.loaded) {
                        return;
                    }
                    var imageSlider = viewer.imageSlider;
                    var handleStyle = snapHandle.style;
                    var snapImageWrapStyles = getComputedStyle(snapImageWrap);
                    this.curHandleTop = parseFloat(handleStyle.top);
                    this.curHandleLeft = parseFloat(handleStyle.left);
                    this.handleWidth = parseFloat(handleStyle.width);
                    this.handleHeight = parseFloat(handleStyle.height);
                    this.width = parseInt(snapImageWrapStyles['width'], 10);
                    this.height = parseInt(snapImageWrapStyles['height'], 10);
                    // stop momentum on image
                    if (imageSlider) {
                        clearInterval(imageSlider.slideMomentumCheck);
                        cancelAnimationFrame(imageSlider.sliderMomentumFrame);
                    }
                },
                onMove: function onMove(e, position) {
                    var xPerc = this.curHandleLeft + position.dx * 100 / this.width;
                    var yPerc = this.curHandleTop + position.dy * 100 / this.height;
                    xPerc = Math.max(0, xPerc);
                    xPerc = Math.min(100 - this.handleWidth, xPerc);
                    yPerc = Math.max(0, yPerc);
                    yPerc = Math.min(100 - this.handleHeight, yPerc);
                    var containerDim = viewer.containerDim;
                    var imgWidth = viewer.imageDim.w * (viewer.zoomValue / 100);
                    var imgHeight = viewer.imageDim.h * (viewer.zoomValue / 100);
                    var imgLeft = imgWidth < containerDim.w ? (containerDim.w - imgWidth) / 2 : -imgWidth * xPerc / 100;
                    var imgTop = imgHeight < containerDim.h ? (containerDim.h - imgHeight) / 2 : -imgHeight * yPerc / 100;
                    snapHandle.style.top = yPerc + '%';
                    snapHandle.style.left = xPerc + '%';
                    viewer.image.style.left = imgLeft + 'px';
                    viewer.image.style.top = imgTop + 'px';
                }
            }).init();
        };
        ImageViewer.prototype.initImageSlider = function () {
            var _a = this,
                imageWrap = _a.imageWrap,
                viewerId = _a.viewerId,
                eventCenter = _a.eventCenter;
            var viewer = this;
            this.imageSlider = new Slider(imageWrap, {
                sliderId: viewerId,
                eventCenter: eventCenter,
                onStart: function onStart(e, position) {
                    var _this = this;
                    if (!viewer.loaded) {
                        return false;
                    }
                    if (viewer.zooming) {
                        return;
                    }
                    viewer.snapSlider.onStart();
                    this.imgWidth = viewer.imageDim.w * viewer.zoomValue / 100;
                    this.imgHeight = viewer.imageDim.h * viewer.zoomValue / 100;
                    this.positions = [position, position];
                    this.startPosition = position;
                    // clear all animation frame and interval
                    viewer.clearFrames();
                    viewer.imageSlider.slideMomentumCheck = setInterval(function () {
                        if (!_this.currentPos) {
                            return;
                        }
                        _this.positions.shift();
                        _this.positions.push({
                            x: _this.currentPos.mx,
                            y: _this.currentPos.my
                        });
                    }, 50);
                },
                onMove: function onMove(e, position) {
                    if (viewer.zooming) {
                        return;
                    }
                    this.currentPos = position;
                    viewer.snapSlider.onMove(e, {
                        dx: -position.dx * viewer.snapSlider.width / this.imgWidth,
                        dy: -position.dy * viewer.snapSlider.height / this.imgHeight
                    });
                },
                onEnd: function onEnd() {
                    var _this = this;
                    if (viewer.zooming) {
                        return;
                    }
                    var step;
                    var positionX;
                    var positionY;
                    var xDiff = this.positions[1].x - this.positions[0].x;
                    var yDiff = this.positions[1].y - this.positions[0].y;
                    var momentum = function momentum() {
                        if (step <= 60) {
                            viewer.imageSlider.sliderMomentumFrame = requestAnimationFrame(momentum);
                        }
                        positionX = positionX + easeOutQuart(step, xDiff / 3, -xDiff / 3, 60);
                        positionY = positionY + easeOutQuart(step, yDiff / 3, -yDiff / 3, 60);
                        viewer.snapSlider.onMove(null, {
                            dx: -(positionX * viewer.snapSlider.width / _this.imgWidth),
                            dy: -(positionY * viewer.snapSlider.height / _this.imgHeight)
                        });
                        step++;
                    };
                    if (Math.abs(xDiff) > 30 || Math.abs(yDiff) > 30) {
                        step = 1;
                        positionX = this.currentPos.dx;
                        positionY = this.currentPos.dy;
                        momentum();
                    }
                }
            }).init();
        };
        ImageViewer.prototype.initZoomOnMouseWheel = function () {
            var _this = this;
            var _a = this,
                imageWrap = _a.imageWrap,
                container = _a.container,
                eventCenter = _a.eventCenter;
            /*Add zoom interation in mouse wheel*/
            var changedDelta = 0;
            var handler = function handler(e) {
                if (!_this.loaded) {
                    return;
                }
                // clear all animation frame and interval
                _this.clearFrames();
                // cross-browser wheel delta
                var delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
                var zoomValue = _this.zoomValue * (100 + delta * ZOOM_CONSTANT) / 100;
                if (!(zoomValue >= _this.options.minZoom && zoomValue <= _this.options.maxZoom)) {
                    changedDelta += Math.abs(delta);
                } else {
                    changedDelta = 0;
                }
                if (changedDelta > MOUSE_WHEEL_COUNT) {
                    return;
                }
                e.preventDefault();
                var contOffset = container.getBoundingClientRect();
                var x = (e.pageX || e.pageX) - (contOffset.left + document.body.scrollLeft);
                var y = (e.pageY || e.pageY) - (contOffset.top + document.body.scrollTop);
                _this.zoom(zoomValue, {
                    x: x,
                    y: y
                });
                // show the snap viewer
                // showSnapView()
            };
            ['mousewheel', 'DOMMouseScroll'].forEach(function (evt) {
                eventCenter.attachDOMEvent(imageWrap, evt, handler);
            });
        };
        ImageViewer.prototype.pinch = function () {
            var _this = this;
            var _a = this,
                container = _a.container,
                imageWrap = _a.imageWrap,
                eventCenter = _a.eventCenter;
            // apply pinch and zoom feature
            var moveId;
            var endId;
            var handler = function handler(estart) {
                if (!_this.loaded) {
                    return;
                }
                var touch0 = estart.touches[0];
                var touch1 = estart.touches[1];
                if (!(touch0 && touch1)) {
                    return;
                }
                _this.zooming = true;
                var contOffset = container.getBoundingClientRect();
                var startdist = Math.sqrt(Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2));
                var startZoom = _this.zoomValue;
                var center = {
                    x: (touch1.pageX + touch0.pageX) / 2 - (contOffset.left + document.body.scrollLeft),
                    y: (touch1.pageY + touch0.pageY) / 2 - (contOffset.top + document.body.scrollTop)
                };
                var moveListener = function moveListener(emove) {
                    emove.preventDefault();
                    var touchM0 = emove.touches[0];
                    var touchM1 = emove.touches[1];
                    var newDist = Math.sqrt(Math.pow(touchM1.pageX - touchM0.pageX, 2) + Math.pow(touchM1.pageY - touchM0.pageY, 2));
                    var zoomValue = startZoom + (newDist - startdist) / 2;
                    _this.zoom(zoomValue, center);
                };
                var endListener = function endListener() {
                    eventCenter.detachDOMEvent(moveId);
                    eventCenter.detachDOMEvent(endId);
                    _this.zooming = false;
                };
                moveId = eventCenter.attachDOMEvent(document, 'touchmove', moveListener);
                endId = eventCenter.attachDOMEvent(document, 'touchend', endListener);
            };
            eventCenter.attachDOMEvent(imageWrap, 'touchstart', handler);
        };
        ImageViewer.prototype.doubleClick = function () {
            var _this = this;
            var _a = this,
                imageWrap = _a.imageWrap,
                eventCenter = _a.eventCenter;
            // handle double tap for zoom in and zoom out
            var touchtime = 0;
            var point;
            var handler = function handler(e) {
                if (touchtime === 0) {
                    touchtime = Date.now();
                    point = {
                        x: e.pageX,
                        y: e.pageY
                    };
                } else {
                    if (Date.now() - touchtime < 500 && Math.abs(e.pageX - point.x) < 50 && Math.abs(e.pageY - point.y) < 50) {
                        if (_this.zoomValue === _this.options.zoomValue) {
                            _this.zoom(200);
                        } else {
                            _this.resetZoom();
                        }
                    }
                    touchtime = 0;
                }
            };
            eventCenter.attachDOMEvent(imageWrap, 'click', handler);
        };
        ImageViewer.prototype.resizeHandler = function () {
            var _this = this;
            var eventCenter = this.eventCenter;
            var handler = function handler() {
                _this.calculateDimensions();
                _this.resetZoom();
            };
            eventCenter.attachDOMEvent(window, 'resize', handler);
        };
        ImageViewer.prototype.preventDefaultTouch = function () {
            var _a = this,
                eventCenter = _a.eventCenter,
                container = _a.container;
            // prevent scrolling the backside if container if fixed positioned
            var handler = function handler(e) {
                e.preventDefault();
            };
            ['touchmove', 'mousewheel', 'DOMMouseScroll'].forEach(function (evt) {
                eventCenter.attachDOMEvent(container, evt, handler);
            });
        };
        // zoom in zoom out using zoom handle
        ImageViewer.prototype.zoomHandler = function () {
            var _a = this,
                zoomHandleWrap = _a.zoomHandleWrap,
                viewerId = _a.viewerId,
                eventCenter = _a.eventCenter;
            var viewer = this;
            this.zoomSlider = new Slider(zoomHandleWrap, {
                sliderId: viewerId,
                eventCenter: eventCenter,
                onStart: function onStart(eStart) {
                    if (!viewer.loaded) {
                        return false;
                    }
                    this.leftOffset = zoomHandleWrap.getBoundingClientRect().left + document.body.scrollLeft;
                    this.handleWidth = parseInt(getComputedStyle(viewer.zoomHandle)['width'], 10);
                    this.onMove(eStart);
                },
                onMove: function onMove(e, position) {
                    var newLeft = (e.pageX || e.touches[0].pageX) - this.leftOffset - this.handleWidth / 2;
                    newLeft = Math.max(0, newLeft);
                    newLeft = Math.min(viewer.zoomSliderLength, newLeft);
                    var zoomValue = 100 + (viewer.options.maxZoom - 100) * newLeft / viewer.zoomSliderLength;
                    viewer.zoom(zoomValue);
                }
            }).init();
        };
        ImageViewer.prototype.clearFrames = function () {
            clearInterval(this.imageSlider.slideMomentumCheck);
            cancelAnimationFrame(this.imageSlider.sliderMomentumFrame);
            cancelAnimationFrame(this.zoomFrame);
        };
        ImageViewer.prototype.resetZoom = function () {
            this.zoom(this.options.zoomValue);
        };
        ImageViewer.prototype.zoom = function (value, point) {
            var _this = this;
            var perc = typeof value === 'string' ? this.zoomKeyWords[value] : value;
            var _a = this,
                image = _a.image,
                containerDim = _a.containerDim,
                imageDim = _a.imageDim,
                zoomValue = _a.zoomValue;
            var _b = this.options,
                minZoom = _b.minZoom,
                maxZoom = _b.maxZoom;
            var imageStyles = getComputedStyle(image);
            var curLeft = parseFloat(imageStyles['left']);
            var curTop = parseFloat(imageStyles['top']);
            var center = {
                x: containerDim.w / 2,
                y: containerDim.h / 2
            };
            var step = 0;
            perc = Math.round(Math.max(minZoom, perc));
            perc = Math.round(Math.min(maxZoom, perc));
            point = perc >= 100 && point ? point : center;
            this.clearFrames();
            // calculate base top, left, bottom, right
            var baseLeft = (containerDim.w - imageDim.w) / 2;
            var baseTop = (containerDim.h - imageDim.h) / 2;
            var baseRight = containerDim.w - baseLeft;
            var baseBottom = containerDim.h - baseTop;
            var zoom = function zoom() {
                step++;
                if (step < 20) {
                    _this.zoomFrame = requestAnimationFrame(zoom);
                }
                var tickZoom = easeOutQuart(step, zoomValue, perc - zoomValue, 20);
                var ratio = tickZoom / zoomValue;
                var imgWidth = imageDim.w * tickZoom / 100;
                var imgHeight = imageDim.h * tickZoom / 100;
                var newLeft = -((point.x - curLeft) * ratio - point.x);
                var newTop = -((point.y - curTop) * ratio - point.y);
                if (perc >= 100) {
                    // fix for left and top
                    newLeft = Math.min(newLeft, baseLeft);
                    newTop = Math.min(newTop, baseTop);
                    // fix for right and bottom
                    if (newLeft + imgWidth < baseRight) {
                        newLeft = baseRight - imgWidth; // newLeft - (newLeft + imgWidth - baseRight)
                    }
                    if (newTop + imgHeight < baseBottom) {
                        newTop = baseBottom - imgHeight; // newTop + (newTop + imgHeight - baseBottom)
                    }
                }
                image.style.height = imgHeight + 'px';
                image.style.width = imgWidth + 'px';
                image.style.left = newLeft + 'px';
                image.style.top = newTop + 'px';
                _this.zoomValue = tickZoom;
                if (perc < 100) {
                    _this.snapViewVisibility(false);
                } else {
                    _this.snapViewVisibility(true);
                    _this.resizeHandle(imgWidth, imgHeight, newLeft, newTop);
                    // update zoom handle position
                    _this.zoomHandle.style.left = (tickZoom - 100) * _this.zoomSliderLength / (maxZoom - 100) + 'px';
                }
            };
            zoom();
        };
        ImageViewer.prototype.zoomIn = function () {
            var zoomValue = this.zoomValue;
            var maxZoom = this.options.maxZoom;
            var newZoom = Math.min(zoomValue * ZOOM_DELTA, maxZoom);
            this.zoom(newZoom);
        };
        ImageViewer.prototype.zoomOut = function () {
            var zoomValue = this.zoomValue;
            var minZoom = this.options.minZoom;
            var newZoom = Math.max(zoomValue / ZOOM_DELTA, minZoom);
            this.zoom(newZoom);
        };
        ImageViewer.prototype.snapViewVisibility = function (status) {
            var snapView = this.snapView;
            snapView.style.visibility = status ? 'visible' : 'hidden';
        };
        ImageViewer.prototype.resizeHandle = function (imgWidth, imgHeight, imgLeft, imgTop) {
            var _a = this,
                snapHandle = _a.snapHandle,
                image = _a.image;
            var imageWidth = imgWidth || this.imageDim.w * this.zoomValue / 100;
            var imageHeight = imgHeight || this.imageDim.h * this.zoomValue / 100;
            var imageStyles = getComputedStyle(image);
            var left = Math.max(-(imgLeft || parseFloat(imageStyles['left'])) * 100 / imageWidth, 0);
            var top = Math.max(-(imgTop || parseFloat(imageStyles['top'])) * 100 / imageHeight, 0);
            var handleWidth = Math.min(this.containerDim.w * 100 / imageWidth, 100);
            var handleHeight = Math.min(this.containerDim.h * 100 / imageHeight, 100);
            snapHandle.style.top = top + '%';
            snapHandle.style.left = left + '%';
            snapHandle.style.width = handleWidth + '%';
            snapHandle.style.height = handleHeight + '%';
        };
        ImageViewer.prototype.calculateDimensions = function () {
            var _a = this,
                image = _a.image,
                container = _a.container,
                snapView = _a.snapView,
                imageNativeWidth = _a.imageNativeWidth;
            var imageStyles = getComputedStyle(image);
            var containerStyles = getComputedStyle(container);
            var imageWidth = parseInt(imageStyles['width'], 10);
            var imageHeight = parseInt(imageStyles['height'], 10);
            var contWidth = parseInt(containerStyles['width'], 10);
            var contHeight = parseInt(containerStyles['height'], 10);
            var snapViewWidth = snapView.clientWidth;
            var snapViewHeight = snapView.clientHeight;
            this.containerDim = {
                w: contWidth,
                h: contHeight
            };
            // set the image dimension
            var imgWidth;
            var imgHeight;
            var ratio = imageWidth / imageHeight;
            imgWidth = imageWidth > imageHeight && contHeight >= contWidth || ratio * contHeight > contWidth ? contWidth : ratio * contHeight;
            imgHeight = imgWidth / ratio;
            this.imageDim = {
                w: imgWidth,
                h: imgHeight
            };
            // reset image position and zoom
            image.style.width = imgWidth + 'px';
            image.style.height = imgHeight + 'px';
            image.style.left = (contWidth - imgWidth) / 2 + 'px';
            image.style.top = (contHeight - imgHeight) / 2 + 'px';
            image.style.maxWidth = 'none';
            image.style.maxHeight = 'none';
            // set the snap Image dimension
            var snapWidth = imgWidth > imgHeight ? snapViewWidth : imgWidth * snapViewHeight / imgHeight;
            var snapHeight = imgHeight > imgWidth ? snapViewHeight : imgHeight * snapViewWidth / imgWidth;
            this.snapImage.style.width = snapWidth + 'px';
            this.snapImage.style.height = snapHeight + 'px';
            this.zoomSliderLength = snapViewWidth - this.zoomHandle.offsetWidth;
            var original = imageNativeWidth * 100 / imgWidth;
            var cover = contWidth * 100 / imgWidth;
            var contain = 100;
            this.zoomKeyWords = {
                original: original,
                cover: cover,
                contain: contain
            };
        };
        ImageViewer.prototype.load = function (imgUrl) {
            var _this = this;
            var _a = this,
                snapImageWrap = _a.snapImageWrap,
                imageWrap = _a.imageWrap;
            var resolve = null;
            var reject = null;
            var promise = new Promise(function (re, rj) {
                resolve = re;
                reject = rj;
            });
            var image = new Image();
            image.src = imgUrl;
            image.onload = function () {
                snapImageWrap.insertAdjacentHTML('afterbegin', "<img src=" + imgUrl + " class=\"iv-snap-image\">");
                imageWrap.innerHTML = "<img src=" + imgUrl + " class=\"iv-large-image\">";
                _this.imageNativeWidth = image.width;
                _this.imageNativeHeight = image.height;
                _this.snapImage = snapImageWrap.querySelector('img.iv-snap-image');
                _this.image = imageWrap.querySelector('img.iv-large-image');
                _this.snapImage.style.display = 'inline';
                _this.image.style.display = 'block';
                _this.loaded = true;
                resolve(image);
            };
            image.onerror = function () {
                reject();
            };
            return promise;
        };
        ImageViewer.prototype.destroy = function () {
            this.eventCenter.detachAllDomEvents();
        };
        return ImageViewer;
    }();

    return ImageViewer;

})));
