import { noop } from './utils'

class Slider {
  constructor (container, options) {
    this.container = container
    this.onStart = options.onStart || noop
    this.onMove = options.onMove || noop
    this.onEnd = options.onEnd || noop
    this.sliderId = options.sliderId || 'slider' + Math.ceil(Math.random() * 1000000)
  }

  init () {
    const { container } = this

  //assign event on snap image wrap
    const touchMouse = function (eOrginal) {
    eOrginal.preventDefault();

    var touchMove = eOrginal.type == 'touchstart' ? 'touchmove' : 'mousemove',
      touchEnd = eOrginal.type == 'touchstart' ? 'touchend' : 'mouseup',
      eOrginal = eOrginal,
      sx = eOrginal.clientX || eOrginal.touches[0].clientX,
      sy = eOrginal.clientY || eOrginal.touches[0].clientY;

    var start = self.onStart(eOrginal, {
      x: sx,
      y: sy
    });

    if (start === false) return

    var moveListener = function (eOrginal) {
      eOrginal.preventDefault()

      //get the cordinates
      var mx = eOrginal.clientX || eOrginal.touches[0].clientX,
        my = eOrginal.clientY || eOrginal.touches[0].clientY;

      self.onMove(eOrginal, {
        dx: mx - sx,
        dy: my - sy,
        mx: mx,
        my: my
      });
    };

    var endListener = function () {
      document.removeEventListener(touchMove, moveListener)
      document.removeEventListener(touchEnd, endListener)
      self.onEnd()
    }

    document.addEventListener(touchMove, moveListener);
    document.addEventListener(touchEnd, endListener);
  }
  ['touchstart', 'mousedown'].forEach(function (evt) {
    container.addEventListener(evt, touchMouse)
  })

  return this
  }
}

export default Slider
