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
  maxZoom: 500,
  refreshOnResize: true,
  zoomOnMouseWheel: true 
}

  // constants
export const ZOOM_CONSTANT = 15 // increase or decrease value for zoom on mouse wheel
export const MOUSE_WHEEL_COUNT = 5 // A mouse delta after which it should stop preventing default behaviour of mouse wheel