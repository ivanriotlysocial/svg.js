import { globals } from '../utils/window.js'
import Queue from './Queue.js'

const Animator = {
  nextDraw: null,
  frames: new Queue(),
  timeouts: new Queue(),
  timer: () => globals.window.performance || globals.window.Date,
  transforms: [],

  frame (fn) {
    // Store the node
    var node = Animator.frames.push({ run: fn })

    // Request an animation frame if we don't have one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw)
    }

    // Return the node so we can remove it easily
    return node
  },

  transform_frame (fn, id) {
    Animator.transforms[id] = fn
  },

  timeout (fn, delay) {
    delay = delay || 0

    // Work out when the event should fire
    var time = Animator.timer().now() + delay

    // Add the timeout to the end of the queue
    var node = Animator.timeouts.push({ run: fn, time: time })

    // Request another animation frame if we need one
    if (Animator.nextDraw === null) {
      Animator.nextDraw = globals.window.requestAnimationFrame(Animator._draw)
    }

    return node
  },

  cancelFrame (node) {
    Animator.frames.remove(node)
  },

  clearTimeout (node) {
    Animator.timeouts.remove(node)
  },

  _draw (now) {
    // Run all the timeouts we can run, if they are not ready yet, add them
    // to the end of the queue immediately! (bad timeouts!!! [sarcasm])
    var nextTimeout = null
    var lastTimeout = Animator.timeouts.last()
    while ((nextTimeout = Animator.timeouts.shift())) {
      // Run the timeout if its time, or push it to the end
      if (now >= nextTimeout.time) {
        nextTimeout.run()
      } else {
        Animator.timeouts.push(nextTimeout)
      }

      // If we hit the last item, we should stop shifting out more items
      if (nextTimeout === lastTimeout) break
    }

    // Run all of the animation frames
    var nextFrame = null
    var lastFrame = Animator.frames.last()
    while ((nextFrame !== lastFrame) && (nextFrame = Animator.frames.shift())) {
      nextFrame.run()
    }

    Animator.transforms.forEach(function (el) { el() })

    // If we have remaining timeouts or frames, draw until we don't anymore
    Animator.nextDraw = Animator.timeouts.first() || Animator.frames.first()
      ? globals.window.requestAnimationFrame(Animator._draw)
      : null
  }
}

export default Animator
