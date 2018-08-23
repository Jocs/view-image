import { getUniqueId } from './utils'

class EventCenter {
  private events = []
  /**
   * [attachDOMEvent] bind event listener to target, and return a unique ID,
   * this ID
   */
  public attachDOMEvent(target, event, listener, capture) {
    if (this.checkHasBind(target, event, listener, capture)) {
      return false
    }
    const eventId = getUniqueId()
    target.addEventListener(event, listener, capture)
    this.events.push({
      eventId,
      target,
      event,
      listener,
      capture
    })
    return eventId
  }
  /**
   * [detachDOMEvent removeEventListener]
   * @param  {[type]} eventId [unique eventId]
   */
  public detachDOMEvent(eventId) {
    if (!eventId) {
      return false
    }
    const removeEvent = this.events.filter(e => e.eventId === eventId)[0]
    if (removeEvent) {
      const { target, event, listener, capture } = removeEvent
      target.removeEventListener(event, listener, capture)
    }
  }
  /**
   * [detachAllDomEvents remove all the DOM events handler]
   */
  public detachAllDomEvents() {
    this.events.forEach(event => this.detachDOMEvent(event.eventId))
  }

  // Determine whether the event has been bind
  public checkHasBind(cTarget, cEvent, cListener, cCapture) {
    for (const { target, event, listener, capture } of this.events) {
      if (
        target === cTarget &&
        event === cEvent &&
        listener === cListener &&
        capture === cCapture
      ) {
        return true
      }
    }
    return false
  }
}

export default EventCenter
