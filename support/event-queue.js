define("event-queue", [], function(require, exports, module, undefined) { 'use strict'

// In IE 8 (at least) `postMessage` is synchronous so we
// assume that `postMessage` is async only if `addEventListener` is defined.
var isPostMessageAsync = 'addEventListener' in window
// Array of pending tasks
var tasks = []
// Special data we post using `postMessage` to identify our calls.
var KEY = 'commonjs:event-queque:run'

// If asynchronous `postMessage` is supported we use that for enqueuing
// messages instead of `setTimeout(f, 0)`, since it will be called in the next
// turn of event loop without extra delay.
if (isPostMessageAsync) window.addEventListener('message', function onTurn(e) {
  if (window == e.source && KEY == e.data) {
    run()
    e.stopPropagation()
  }
}, true)

// Function processes all the tasks that are in the queue.
function run() {
  // We copy all the pending tasks before processing them,
  // since we want to bu sure that tasks added in this run
  // won't be processed.
  var task, pending = tasks.splice(0, tasks.length)
  while (task = pending.shift())
    // We catch `exceptions` that `task`'s may throw, since we don't want
    // to break the loop.
    try { task() } catch (exceptions) { console.error(exceptions) }
}

exports.setTimeout = window.setTimeout
exports.setInterval = window.setInterval
exports.clearTimeout = window.clearTimeout
exports.clearInterval = window.clearTimeout
// Runs task in the next turn of event-loop. This
// On the next loop around the event loop call this task. This is not a simple
// alias to `setTimeout(task, 0)`, it's much more efficient, but should not be
// over used (for animations for example).
exports.enqueue = function enqueue(task) {
  // Adding a task to process in next turn of event loop.
  tasks.push(task)
  // Using `postMessage` to run enqueued tasks in next turn of event-loop.
  if (isPostMessageAsync) window.postMessage(KEY, '*')
  // If async `postMessage` is not available falling back to `setTimeout(f, 0)`
  else exports.setTimeout(run, 0)
}
 
/**/});