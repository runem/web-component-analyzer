#!/usr/bin/env node

require("./lib/cjs/cli.js")
	.cli()
	// eslint-disable-next-line no-console
	.catch(console.log);
