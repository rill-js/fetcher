'use strict'

var assert = require('assert')
var agent = require('supertest').agent
var Rill = require('rill')
var fetcher = require('../')

describe('Rill/Fetcher', function () {
  it('should work', function (done) {
    var request = agent(Rill()
      .use(fetcher({
        name: 'api',
        base: '/api/'
      }))
      .get('/api/test', respond(200, function (ctx) {
        ctx.res.body = { success: true }
      }))
      .get('/', respond(200, function (ctx) {
        // Call api from root.
        return ctx.api('test')
          .then(function (res) { return res.json() })
          .then(function (data) { ctx.res.body = data })
      }))
      .listen())

    request.get('/')
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        assert.deepEqual(res.body, {
          success: true
        })
        done()
      })
  })
})

function respond (status, test) {
  return function (ctx) {
    ctx.res.status = status
    if (typeof test === 'function') return test(ctx)
  }
}
