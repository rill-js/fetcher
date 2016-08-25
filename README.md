<h1 align="center">
  <!-- Logo -->
  <img src="https://raw.githubusercontent.com/rill-js/rill/master/Rill-Icon.jpg" alt="Rill"/>
  <br/>
  @rill/fetcher
	<br/>

  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-stable-brightgreen.svg?style=flat-square" alt="API stability"/>
  </a>
  <!-- Standard -->
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="Standard"/>
  </a>
  <!-- NPM version -->
  <a href="https://npmjs.org/package/@rill/fetcher">
    <img src="https://img.shields.io/npm/v/@rill/fetcher.svg?style=flat-square" alt="NPM version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@rill/fetcher">
    <img src="https://img.shields.io/npm/dm/@rill/fetcher.svg?style=flat-square" alt="Downloads"/>
  </a>
  <!-- Gitter Chat -->
  <a href="https://gitter.im/rill-js/rill">
    <img src="https://img.shields.io/gitter/room/rill-js/rill.svg?style=flat-square" alt="Gitter Chat"/>
  </a>
</h1>

<div align="center">
  Fetch wrapper for Rill that allows intercepting requests and automatic FormData casting.
</div>

# Installation

```console
npm install @rill/fetcher
```

# Example

```js
const rill = require('rill')
const app = rill()
const fetcher = require('@rill/fetcher')

app.use(fetcher({
	name: 'api',
	base: '/api/'
}))

app.use(async ({ api }, next)=> {
	// Fetcher is an event emitter so you can intercept requests and responses.
	// Listeners are cleaned up on every request.

	// Example request intercept.
	api.on('request', (url, req)=> {
		// req is the options provided to the fetch request.
		req.headers.auth = '...'
	})

	// Example response intercept.
	api.on('response', (url, res)=> {
		// res is the response from a fetch request.
		console.log(res.headers.get('x-error-message'))
	})

	// Example fetch. (Options similar to natvie fetch).
	const response = await api('user', {
		method: 'GET', // Set method (GET is default).
		query: { a: 1 }, // Append a query string.
		body: { b: 2 }, // Set the request body.
		files: { c: ... }, // Set a FormData file (gets added to the formdata body).
		headers: { 'x-custom-header': 1 } // Set some headers.
	})

	// Parse api response as json (same as native fetch).
	const data = await response.json()
})

// Using https://github.com/DylanPiercey/isbrowser.
if (!process.browser) {
  // Handle the `user` api only in the server.
  app.get('/api/user', ({ req, res })=> {
    // Check out https://github.com/rill-js/forwarded-from to ensure consistent `ctx.req.ip` across api calls.
    res.body = { user: 'data' }
  })
}
```

# Options

```js
{
	name: 'api', // Optional path to set the fetcher on the context (default 'fetch').
	base: '/api/', // Sets the base path for the fetcher.
	forwardIP: true, // Set this to false to disable setting 'X-Forwarded-For' header automatically.
	agent: {
		// Optionally specify a custom http(s) agent (nodejs only).
		// Both default to 'agentkeepalive' for optimum performance for local requests.
		// Set `agent: false` to disable the keepalive agent.
		http: ...,
		https: ...
	}
}
```

### Contributions

* Use `npm test` to run tests.

Please feel free to create a PR!
