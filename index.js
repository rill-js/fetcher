'use strict'

// Pollyfills.
require('isomorphic-fetch')
require('isomorphic-form-data')

var URL = require('mini-url')
var QS = require('mini-querystring')
var qFlat = require('q-flat')
var EventEmitter = require('events-light')
var HttpAgent = require('agentkeepalive')
var HttpsAgent = HttpAgent.HttpsAgent
var keepalive = { http: new HttpAgent(), https: new HttpsAgent() }

module.exports = function fetcherMiddleware (config) {
  // Middleware defaults.
  config = config || {}
  config.name = config.name || 'fetch'
  config.base = config.base || '/'
  config.agent = 'agent' in config ? config.agent : keepalive
  config.forwardIP = 'forwardIP' in config ? config.forwardIP : true
  config.forwardHost = 'forwardHost' in config ? config.forwardHost : true
  config.withCredentials = 'withCredentials' in config ? config.withCredentials : true

  return function (ctx, next) {
    // Attach fetch utility to context.
    ctx[config.name] = request

    // Ensure base path starts with http(s) for node-fetch.
    var base = URL.parse(config.base, ctx.req.origin).href

    // Create an event emitter for the request.
    var emitter = new EventEmitter()
    for (var field in EventEmitter.prototype) {
      if (typeof EventEmitter.prototype[field] === 'function') {
        request[field] = EventEmitter.prototype[field].bind(emitter)
      }
    }

    // Run middleware then cleanup emitter.
    return next().then(cleanup, cleanup)

    // Removes any registered event listeners and throws a provided error.
    function cleanup (err) {
      request.removeAllListeners()
      if (err) throw err
    }

    // Wrapper arround native fetch.
    function request (path, opts) {
      var form = null
      var key

      // Fetch defaults
      path = path || '/'
      opts = opts || {}
      opts.headers = toHeaders(opts.headers)

      // Forward some proxy headers if we are server side.
      if (!process.browser) {
        // Forward current ip address.
        if (config.forwardIP && !opts.headers.get('X-Forwarded-For')) {
          opts.headers.set('X-Forwarded-For', ctx.req.ip)
        }

        // Forward current host with request.
        if (config.forwardHost && !opts.headers.get('X-Forwarded-Host')) {
          opts.headers.set('X-Forwarded-Host', ctx.req.host)
        }
      }

      // Automatically send credentials if `withCredentials` is enabled.
      if (config.withCredentials && !opts.credentials) {
        opts.credentials = 'same-origin'
        if (!process.browser) {
          var cookie = ctx.req.get('Cookie')
          if (cookie) opts.headers.set('Cookie', cookie)
        }
      }

      // Allow event handlers to modify request options.
      request.emit('request', path, opts)

      // Set base url and parse path.
      var parsed = URL.parse(path, base)

      // Append query string.
      if (typeof opts.query === 'object') {
        parsed = {
          protocol: parsed.protocol,
          host: parsed.host,
          pathname: parsed.pathname,
          search: '?' + QS.stringify(cast(qFlat(opts.query)), false),
          hash: parsed.hash
        }
        parsed.href = URL.stringify(parsed)
      }

      // Append body data.
      if (typeof opts.body === 'object') {
        form = form || new FormData()
        var body = cast(qFlat(opts.body))
        for (key in body) {
          if (body[key] === undefined) continue
          form.append(key, body[key])
        }
      }

      // Append file data.
      if (typeof opts.files === 'object') {
        form = form || new FormData()
        var files = qFlat(opts.files)
        for (key in files) {
          if (files[key] === undefined) continue
          form.append(key, files[key])
        }
      }

      // Attach form if created.
      if (form) opts.body = form

      // Setup default agent for node-fetch.
      // Default to config agent / keepalive with the ability to set a custom
      // agent for http and https.
      if (!opts.agent && config.agent) opts.agent = config.agent[parsed.protocol.slice(0, -1)]

      // Call native fetch.
      return fetch(parsed.href, opts).then(function (res) {
        // Allow event handlers to respond to a response.
        request.emit('response', parsed.href, res)
        return res
      })
    }
  }
}

/**
 * Turns an object into request headers.
 */
function toHeaders (obj) {
  var headers = new Headers()
  if (typeof obj !== 'object') return headers
  for (var key in obj) headers.set(key, obj[key])
  return headers
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
    else if (val instanceof Date && isFinite(val)) result[key] = val.toISOString()
    else result[key] = String(val)
  }

  return result
}
