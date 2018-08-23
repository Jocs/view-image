import { noop } from './utils'

export const imageViewHtml = `
<div class="iv-snap-view">
  <div class="iv-snap-image-wrap">
    <div class="iv-snap-handle"></div>
  </div>
  <div class="iv-zoom-slider">
    <div class="iv-zoom-handle"></div>
  </div>
</div>
<div class="iv-image-view">
  <div class="iv-image-wrap"></div>
</div>
`

export const defaultOptions = {
  zoomValue: 100,
  snapView: true,
  maxZoom: 1000,
  minZoom: 50,
  refreshOnResize: true,
  zoomOnMouseWheel: true,
  beforeload: noop,
  loaded: noop,
  failed: noop
}

// constants
export const ZOOM_CONSTANT = 15 // increase or decrease value for zoom on mouse wheel
export const MOUSE_WHEEL_COUNT = 5 // A mouse delta after which it should stop preventing default behaviour of mouse wheel
export const ZOOM_DELTA = 1.2
