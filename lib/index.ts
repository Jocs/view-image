import EventCenter from './event'
import { imageViewHtml, defaultOptions, ZOOM_CONSTANT, MOUSE_WHEEL_COUNT } from './config'
import { getUniqueId, easeOutQuart } from './utils'
import Slider from './slider'

interface IOptions {
  url: string
  zoomValue?: number
  snapView?: boolean
  maxZoom?: number
  refreshOnResize?: boolean
  zoomOnMouseWheel?: boolean
}

interface IDim {
  w: number
  h: number
}

class ImageViewer {
  private container: HTMLElement
  private options: IOptions
  private snapView: HTMLElement
  private snapImageWrap: HTMLElement
  private snapImage: HTMLImageElement
  private image: HTMLImageElement
  private imageWrap: HTMLElement
  private snapHandle: HTMLElement
  private zoomHandle: HTMLDivElement
  private zoomHandleWrap: HTMLDivElement
  private viewerId: string
  private loaded: boolean
  private imgUrl: string
  private zoomValue: number
  private containerDim: IDim
  private imageDim: IDim
  private zoomSliderLength: number
  private eventCenter: any
  private snapSlider: any
  private imageSlider: any
  private zoomSlider: any
  private zooming: boolean
  private zoomFrame: any

  constructor (container, options: IOptions) {
    this.container = container
    this.options = { ...defaultOptions, ...options }
    this.container.innerHTML = imageViewHtml
    this.snapView = container.querySelector('.iv-snap-view')
    this.snapImageWrap = container.querySelector('.iv-snap-image-wrap')
    this.imageWrap = container.querySelector('.iv-image-wrap')
    this.snapHandle = container.querySelector('.iv-snap-handle')
    this.zoomHandle = container.querySelector('.iv-zoom-handle')
    this.zoomHandleWrap = container.querySelector('.iv-zoom-slider')
    this.viewerId = 'iv-' + getUniqueId()
    this.imgUrl = options.url
    this.zoomValue = this.options.zoomValue
    this.zooming = false
    this.eventCenter = new EventCenter()
    container.classList.add('iv-container')
    if (getComputedStyle(container)['position'] === 'static') {
      container.style.position = 'relative'
    }
    // init image viewer
    this.init()
  }

  public async init () {
    await this.load(this.imgUrl)
    this.calculateDimensions()
    this.initSnapSlider()
    this.initImageSlider()
    if (this.options.zoomOnMouseWheel) {
      this.initZoomOnMouseWheel()
    }
    this.pinch()
    this.doubleClick()
    if (this.options.refreshOnResize) {
      this.resizeHandler()
    }
    this.preventDefaultTouch()
    this.zoomHandler()
  }

  private initSnapSlider () {
    const { snapImage, snapHandle, snapImageWrap, viewerId, eventCenter } = this
    const viewer = this

    this.snapSlider = new Slider(snapImage, {
      sliderId: viewerId,
      eventCenter,
      onStart() {
        if (!viewer.loaded) {
          return
        }
        const { imageSlider } = viewer
        const handleStyle = snapHandle.style

        this.curHandleTop = parseFloat(handleStyle.top)
        this.curHandleLeft = parseFloat(handleStyle.left)
        this.handleWidth = parseFloat(handleStyle.width)
        this.handleHeight = parseFloat(handleStyle.height)
        this.width = parseInt(getComputedStyle(snapImageWrap)['width'], 10)
        this.height = parseInt(getComputedStyle(snapImageWrap)['height'], 10)

        // stop momentum on image
        if (imageSlider) {
          clearInterval(imageSlider.slideMomentumCheck)
          cancelAnimationFrame(imageSlider.sliderMomentumFrame)
        }
      },

      onMove (e, position) {
        let xPerc = this.curHandleLeft + position.dx * 100 / this.width
        let yPerc = this.curHandleTop + position.dy * 100 / this.height

        xPerc = Math.max(0, xPerc)
        xPerc = Math.min(100 - this.handleWidth, xPerc)

        yPerc = Math.max(0, yPerc)
        yPerc = Math.min(100 - this.handleHeight, yPerc)

        const containerDim = viewer.containerDim
        const imgWidth = viewer.imageDim.w * (viewer.zoomValue / 100)
        const imgHeight = viewer.imageDim.h * (viewer.zoomValue / 100)
        const imgLeft = imgWidth < containerDim.w ? (containerDim.w - imgWidth) / 2 : -imgWidth * xPerc / 100
        const imgTop = imgHeight < containerDim.h ? (containerDim.h - imgHeight) / 2 : -imgHeight * yPerc / 100

        snapHandle.style.top = yPerc + '%'
        snapHandle.style.left = xPerc + '%'

        viewer.image.style.left = imgLeft + 'px'
        viewer.image.style.top = imgTop + 'px'
      }
    }).init()
  }

  private initImageSlider () {
    const { imageWrap, viewerId, eventCenter } = this
    const viewer = this
    this.imageSlider = new Slider(imageWrap, {
      sliderId: viewerId,
      eventCenter,
      onStart(e, position) {
        if (!viewer.loaded) {
          return false
        }
        if (viewer.zooming) {
          return
        }
        viewer.snapSlider.onStart()
        this.imgWidth = viewer.imageDim.w * viewer.zoomValue / 100
        this.imgHeight = viewer.imageDim.h * viewer.zoomValue / 100
        this.positions = [position, position]
        this.startPosition = position

        // clear all animation frame and interval
        viewer.clearFrames()

        viewer.imageSlider.slideMomentumCheck = setInterval(() => {
          if (!this.currentPos) {
            return
          }
          this.positions.shift()
          this.positions.push({
            x: this.currentPos.mx,
            y: this.currentPos.my
          })
        }, 50)
      },
      onMove(e, position) {
        if (viewer.zooming) {
          return
        }
        this.currentPos = position

        viewer.snapSlider.onMove(e, {
          dx: -position.dx * viewer.snapSlider.width / this.imgWidth,
          dy: -position.dy * viewer.snapSlider.height / this.imgHeight
        })
      },
      onEnd() {
        if (viewer.zooming) {
          return
        }
        let step
        let positionX
        let positionY

        const xDiff = this.positions[1].x - this.positions[0].x
        const yDiff = this.positions[1].y - this.positions[0].y

        const momentum = () => {
          if (step <= 60) {
            viewer.imageSlider.sliderMomentumFrame = requestAnimationFrame(momentum)
          }

          positionX = positionX + easeOutQuart(step, xDiff / 3, -xDiff / 3, 60)
          positionY = positionY + easeOutQuart(step, yDiff / 3, -yDiff / 3, 60)

          viewer.snapSlider.onMove(null, {
            dx: -(positionX * viewer.snapSlider.width / this.imgWidth),
            dy: -(positionY * viewer.snapSlider.height / this.imgHeight)
          })
          step++
        }

        if (Math.abs(xDiff) > 30 || Math.abs(yDiff) > 30) {
          step = 1
          positionX = this.currentPos.dx
          positionY = this.currentPos.dy

          momentum()
        }
      }
    }).init()
  }

  private initZoomOnMouseWheel () {
    const { imageWrap, container, eventCenter } = this
    /*Add zoom interation in mouse wheel*/
    let changedDelta = 0
    const handler = e => {

      if (!this.loaded) {
        return
      }

      // clear all animation frame and interval
      this.clearFrames()

      // cross-browser wheel delta
      const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))
      const zoomValue = this.zoomValue * (100 + delta * ZOOM_CONSTANT) / 100

      if (!(zoomValue >= 100 && zoomValue <= this.options.maxZoom)) {
        changedDelta += Math.abs(delta)
      } else {
        changedDelta = 0
      }

      if (changedDelta > MOUSE_WHEEL_COUNT) {
        return
      }

      e.preventDefault()

      const contOffset = container.getBoundingClientRect()
      const x = (e.pageX || e.pageX) - (contOffset.left + document.body.scrollLeft)
      const y = (e.pageY || e.pageY) - (contOffset.top + document.body.scrollTop)

      this.zoom(zoomValue, {
        x,
        y
      })

      // show the snap viewer
      // showSnapView()
    }
    ;['mousewheel', 'DOMMouseScroll'].forEach(evt => {
      eventCenter.attachDOMEvent(imageWrap, evt, handler)
    })
  }

  private pinch () {
    const { container, imageWrap, eventCenter } = this
    // apply pinch and zoom feature
    let moveId
    let endId
    const handler = (estart) => {
      if (!this.loaded) {
        return
      }

      const touch0 = estart.touches[0]
      const touch1 = estart.touches[1]

      if (!(touch0 && touch1)) {
        return
      }

      this.zooming = true

      const contOffset = container.getBoundingClientRect()

      const startdist = Math.sqrt(Math.pow(touch1.pageX - touch0.pageX, 2) + Math.pow(touch1.pageY - touch0.pageY, 2))
      const startZoom = this.zoomValue
      const center = {
        x: (touch1.pageX + touch0.pageX) / 2 - (contOffset.left + document.body.scrollLeft),
        y: (touch1.pageY + touch0.pageY) / 2 - (contOffset.top + document.body.scrollTop)
      }

      const moveListener = (emove) => {
        emove.preventDefault()

        const touchM0 = emove.touches[0]
        const touchM1 = emove.touches[1]
        const newDist = Math.sqrt(Math.pow(touchM1.pageX - touchM0.pageX, 2) + Math.pow(touchM1.pageY - touchM0.pageY, 2))
        const zoomValue = startZoom + (newDist - startdist) / 2

        this.zoom(zoomValue, center)
      }

      const endListener = () => {
        eventCenter.detachDOMEvent(moveId)
        eventCenter.detachDOMEvent(endId)
        this.zooming = false
      }
      moveId = eventCenter.attachDOMEvent(document, 'touchmove', moveListener)
      endId = eventCenter.attachDOMEvent(document, 'touchend', endListener)
    }
    eventCenter.attachDOMEvent(imageWrap, 'touchstart', handler)
  }

  private doubleClick () {
    const { imageWrap, eventCenter } = this
    // handle double tap for zoom in and zoom out
    let touchtime = 0
    let point
    const handler = e => {
      if (touchtime === 0) {
        touchtime = Date.now()
        point = {
          x: e.pageX,
          y: e.pageY
        }
      } else {
        if (Date.now() - touchtime < 500 && Math.abs(e.pageX - point.x) < 50 && Math.abs(e.pageY - point.y) < 50) {
          if (this.zoomValue === this.options.zoomValue) {
            this.zoom(200)
          } else {
            this.resetZoom()
          }
          touchtime = 0
        } else {
          touchtime = 0
        }
      }
    }
    eventCenter.attachDOMEvent(imageWrap, 'click', handler)
  }

  private resizeHandler () {
    const { eventCenter } = this
    const handler = () => {
      this.calculateDimensions()
      this.resetZoom()
    }
    eventCenter.attachDOMEvent(window, 'resize', handler)
  }

  private preventDefaultTouch () {
    const { eventCenter, container } = this
    // prevent scrolling the backside if container if fixed positioned
    const handler = e => {
      e.preventDefault()
    }
    ;['touchmove', 'mousewheel', 'DOMMouseScroll'].forEach(evt => {
      eventCenter.attachDOMEvent(container, evt, handler)
    })
  }

  // zoom in zoom out using zoom handle
  private zoomHandler () {
    const { zoomHandleWrap, viewerId, eventCenter } = this
    const viewer = this
    this.zoomSlider = new Slider(zoomHandleWrap, {
      sliderId: viewerId,
      eventCenter,
      onStart (eStart) {
        if (!viewer.loaded) {
          return false
        }

        this.leftOffset = zoomHandleWrap.getBoundingClientRect().left + document.body.scrollLeft
        this.handleWidth = parseInt(getComputedStyle(viewer.zoomHandle)['width'], 10)
        this.onMove(eStart)
      },
      onMove (e, position) {
        let newLeft = (e.pageX || e.touches[0].pageX) - this.leftOffset - this.handleWidth / 2

        newLeft = Math.max(0, newLeft)
        newLeft = Math.min(viewer.zoomSliderLength, newLeft)

        const zoomValue = 100 + (viewer.options.maxZoom - 100) * newLeft / viewer.zoomSliderLength

        viewer.zoom(zoomValue)
      }
    }).init()
  }

  private clearFrames () {
    clearInterval(this.imageSlider.slideMomentumCheck)
    cancelAnimationFrame(this.imageSlider.sliderMomentumFrame)
    cancelAnimationFrame(this.zoomFrame)
  }

  private resetZoom () {
    this.zoom(this.options.zoomValue)
  }

  public zoom (perc, point?) {
    const { image, containerDim, imageDim, zoomValue } = this
    const maxZoom = this.options.maxZoom
    const curLeft = parseFloat(getComputedStyle(image)['left'])
    const curTop = parseFloat(getComputedStyle(image)['top'])
    let step = 0

    perc = Math.round(Math.max(100, perc))
    perc = Math.min(this.options.maxZoom, perc)

    point = point || {
      x: containerDim.w / 2,
      y: containerDim.h / 2
    }

    this.clearFrames()

    // calculate base top, left, bottom, right
    const baseLeft = (containerDim.w - imageDim.w) / 2
    const baseTop = (containerDim.h - imageDim.h) / 2
    const baseRight = containerDim.w - baseLeft
    const baseBottom = containerDim.h - baseTop

    const zoom = () => {
      step++

      if (step < 20) {
        this.zoomFrame = requestAnimationFrame(zoom)
      }

      const tickZoom = easeOutQuart(step, zoomValue, perc - zoomValue, 20)

      const ratio = tickZoom / zoomValue
      const imgWidth = imageDim.w * tickZoom / 100
      const imgHeight = imageDim.h * tickZoom / 100
      let newLeft = -((point.x - curLeft) * ratio - point.x)
      let newTop = -((point.y - curTop) * ratio - point.y)

      // fix for left and top
      newLeft = Math.min(newLeft, baseLeft)
      newTop = Math.min(newTop, baseTop)

      // fix for right and bottom
      if (newLeft + imgWidth < baseRight) {
        newLeft = baseRight - imgWidth // newLeft - (newLeft + imgWidth - baseRight)
      }

      if (newTop + imgHeight < baseBottom) {
        newTop = baseBottom - imgHeight // newTop + (newTop + imgHeight - baseBottom)
      }

      image.style.height = imgHeight + 'px'
      image.style.width = imgWidth + 'px'
      image.style.left = newLeft + 'px'
      image.style.top = newTop + 'px'
      this.zoomValue = tickZoom
      this.resizeHandle(imgWidth, imgHeight, newLeft, newTop)

      // update zoom handle position
      this.zoomHandle.style.left = (tickZoom - 100) * this.zoomSliderLength / (maxZoom - 100) + 'px'
    }

    zoom()
  }

  private resizeHandle (imgWidth, imgHeight, imgLeft, imgTop) {
    const { snapHandle, image } = this
    const imageWidth = imgWidth || this.imageDim.w * this.zoomValue / 100
    const imageHeight = imgHeight || this.imageDim.h * this.zoomValue / 100
    const left = Math.max(-(imgLeft || parseFloat(getComputedStyle(image)['left'])) * 100 / imageWidth, 0)
    const top = Math.max(-(imgTop || parseFloat(getComputedStyle(image)['top'])) * 100 / imageHeight, 0)
    const handleWidth = Math.min(this.containerDim.w * 100 / imageWidth, 100)
    const handleHeight = Math.min(this.containerDim.h * 100 / imageHeight, 100)

    snapHandle.style.top = top + '%'
    snapHandle.style.left = left + '%'
    snapHandle.style.width = handleWidth + '%'
    snapHandle.style.height = handleHeight + '%'
  }

  private calculateDimensions () {
    const { image, container, snapView } = this
    const imageWidth = parseInt(getComputedStyle(image)['width'], 10)
    const imageHeight = parseInt(getComputedStyle(image)['height'], 10)
    const contWidth = parseInt(getComputedStyle(container)['width'], 10)
    const contHeight = parseInt(getComputedStyle(container)['height'], 10)
    const snapViewWidth = snapView.clientWidth
    const snapViewHeight = snapView.clientHeight

    this.containerDim = {
      w: contWidth,
      h: contHeight
    }
    // set the image dimension
    let imgWidth
    let imgHeight
    const ratio = imageWidth / imageHeight

    imgWidth = (imageWidth > imageHeight && contHeight >= contWidth) || ratio * contHeight > contWidth
      ? contWidth
      : ratio * contHeight

    imgHeight = imgWidth / ratio

    this.imageDim = {
      w: imgWidth,
      h: imgHeight
    }

    // reset image position and zoom
    image.style.width = imgWidth + 'px'
    image.style.height = imgHeight + 'px'
    image.style.left = (contWidth - imgWidth) / 2 + 'px'
    image.style.top = (contHeight - imgHeight) / 2 + 'px'
    image.style.maxWidth = 'none'
    image.style.maxHeight = 'none'

    // set the snap Image dimension
    const snapWidth = imgWidth > imgHeight ? snapViewWidth : imgWidth * snapViewHeight / imgHeight
    const snapHeight = imgHeight > imgWidth ? snapViewHeight : imgHeight * snapViewWidth / imgWidth

    this.snapImage.style.width = snapWidth + 'px'
    this.snapImage.style.height = snapHeight + 'px'

    this.zoomSliderLength = snapViewWidth - this.zoomHandle.offsetWidth
  }

  public load (imgUrl) {
    const { snapImageWrap, imageWrap } = this
    let resolve = null
    let reject = null
    const promise = new Promise((re, rj) => {
      resolve = re
      reject = rj
    })

    const image = new Image()
    image.src = imgUrl

    image.onload = () => {
      snapImageWrap.insertAdjacentHTML('afterbegin', `<img src=${imgUrl} class="iv-snap-image">`)
      imageWrap.innerHTML = `<img src=${imgUrl} class="iv-large-image">`

      this.snapImage = snapImageWrap.querySelector('img.iv-snap-image')
      this.image = imageWrap.querySelector('img.iv-large-image')

      this.snapImage.style.display = 'inline'
      this.image.style.display = 'block'
      this.loaded = true
      resolve()
    }
    image.onerror = () => {
      reject()
    }
    return promise
  }

  public destroy() {
    this.eventCenter.detachAllDomEvents()
  }

}

export default ImageViewer