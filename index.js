'use strict'

// Pollyfills.
require('isomorphic-fetch')
require('isomorphic-form-data')

var URL = require('url')
var QS = require('querystring')
var qFlat = require('q-flat')
var EventEmitter = require('events').EventEmitter
var keepalive = require('agentkeepalive')()

module.exports = function fetcherMiddleware (config) {
  // Middleware defaults.
  config = config || {}
  config.name = config.name || 'fetch'
  config.base = config.base || '/'
  config.agent = config.agent || keepalive

  return function (ctx, next) {
    // Attach fetch utility to context.
    ctx[config.name] = request

    // Ensure base path starts with http(s) for node-fetch.
    var base = URL.resolve(ctx.req.origin, config.base)

    // Create an event emitter for the request.
    var emitter = new EventEmitter()
    for (var field in EventEmitter.prototype) {
      if (typeof EventEmitter.prototype[field] === 'function') {
        request[field] = EventEmitter.prototype[field].bind(emitter)
      }
    }

    // Run middleware then cleanup emitter.
    return next().then(request.removeAllListeners)

    function request (path, opts) {
      var form = null
      var key

      // Fetch defaults
      path = path || '/'
      opts = opts || {}
      opts.headers = opts.headers || {}

      // Allow event handlers to modify request options.
      request.emit('request', path, opts)

      // Set base url.
      path = URL.resolve(base, path)
      // Append query if needed.
      path = URL.resolve(path, typeof opts.query === 'object' ? '?' + QS.stringify(cast(qFlat(opts.query))) : '')

      // Append body data.
      if (typeof opts.body === 'object') {
        form = form || new FormData()
        var body = cast(qFlat(opts.body))
        for (key in body) form.append(key, body[key])
      }

      // Append file data.
      if (typeof opts.files === 'object') {
        form = form || new FormData()
        var files = qFlat(opts.files)
        for (key in files) form.append(key, files[key])
      }

      // Attach form if created.
      if (form) opts.body = form

      // Default to keepalive agent for perf.
      if (config.agent && !opts.agent) opts.agent = keepalive

      // Call native fetch.
      return fetch(path, opts).then(function (res) {
        // Allow event handlers to respond to a response.
        request.emit('response', res)
        return res
      })
    }
  }
}

/**
 * Ignores empty strings and undefined.request
 * Converts date to iso string.
 * Converts everything else to a string.
 */
function cast (data) {
  var result = {}

  for (var key in data) {
    var val = data[key]
    if (val === '' || val === undefined) continue
    else if (val instanceof Date) result[key] = val.toISOString()
    else result[key] = String(val)
  }

  return result
}
