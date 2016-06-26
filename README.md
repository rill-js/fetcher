[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Chat about Rill at https://gitter.im/rill-js/rill](https://badges.gitter.im/rill-js/rill.svg)](https://gitter.im/rill-js/rill?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Rill Fetcher
Fetch wrapper for Rill that allows intercepting requests and automatic FormData casting.

# Installation

#### Npm
```console
npm install @rill/fetcher
```

# Example

```js
const rill    = require("rill");
const app     = rill();
const fetcher = require("@rill/fetcher");

app.use(fetcher({
	name: "api",
	base: "/api/"
}));

app.use(async ({ api }, next)=> {
	// Fetcher is an event emitter so you can intercept requests and responses.
	// Listeners are cleaned up on every request.

	// Example request intercept.
	api.on("request", (url, req)=> {
		// req is the options provided to the fetch request.
		req.headers.auth = "...";
	});

	// Example response intercept.
	api.on("response", (url, res)=> {
		// res is the response from a fetch request.
		console.log(res.headers.get("x-error-message"));
	})

	// Example fetch. (Options similar to natvie fetch).
	const response = await api("user", {
		method: "GET", // Set method (GET is default).
		query: { a: 1 }, // Append a query string.
		body: { b: 2 }, // Set the request body.
		files: { c: ... }, // Set a FormData file (gets added to the formdata body).
		headers: { "x-custom-header": 1 } // Set some headers.
	});

	// Parse api response as json (same as native fetch).
	const data = await response.json();
});
```

# Options

```js
{
	name: "api", // Optional path to set the fetcher on the context (default "fetch").
	base: "/api/", // Sets the base path for the fetcher.
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
