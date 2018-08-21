// ease out method
/*
    t : current time,
    b : intial value,
    c : changed value,
    d : duration
*/
export const easeOutQuart = (t, b, c, d) => {
  t /= d
  t--
  return -c * (t * t * t * t - 1) + b
}

// function to check if image is loaded
export const imageLoaded = (img) => {
  return img.complete && (typeof img.naturalWidth === 'undefined' || img.naturalWidth !== 0)
}

export const noop = () => {}
