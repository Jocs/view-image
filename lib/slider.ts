import { noop, getUniqueId } from './utils'

class Slider {
  private container: HTMLElement
  private onStart: any
  private onMove: any
  private onEnd: any
  private eventCenter: any
  private sliderId: string

  constructor(container, options) {
    this.container = container
    this.eventCenter = options.eventCenter
    this.onStart = options.onStart || noop
    this.onMove = options.onMove || noop
    this.onEnd = options.onEnd || noop
    this.sliderId = options.sliderId || 'slider-' + getUniqueId()
  }

  public init() {
    const { container, eventCenter } = this

    // assign event on snap image wrap
    const touchMouse = eOrginal => {
      eOrginal.preventDefault()

      let moveId
      let endId

      const touchMove = eOrginal.type === 'touchstart' ? 'touchmove' : 'mousemove'
      const touchEnd = eOrginal.type === 'touchstart' ? 'touchend' : 'mouseup'
      const sx = eOrginal.clientX || eOrginal.touches[0].clientX
      const sy = eOrginal.clientY || eOrginal.touches[0].clientY

      const start = this.onStart(eOrginal, {
        x: sx,
        y: sy
      })

      if (start === false) {
        return
      }

      const moveListener = emove => {
        emove.preventDefault()

        // get the cordinates
        const mx = emove.clientX || emove.touches[0].clientX
        const my = emove.clientY || emove.touches[0].clientY

        this.onMove(emove, {
          dx: mx - sx,
          dy: my - sy,
          mx,
          my
        })
      }

      const endListener = () => {
        eventCenter.detachDOMEvent(moveId)
        eventCenter.detachDOMEvent(endId)
        this.onEnd()
      }
      moveId = eventCenter.attachDOMEvent(document, touchMove, moveListener)
      endId = eventCenter.attachDOMEvent(document, touchEnd, endListener)
    }

    ;['touchstart', 'mousedown'].forEach(evt => {
      eventCenter.attachDOMEvent(container, evt, touchMouse)
    })

    return this
  }
}

export default Slider
