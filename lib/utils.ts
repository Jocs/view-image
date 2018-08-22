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

export const noop = () => {}

let id = 0
export const getUniqueId = ():number => id++