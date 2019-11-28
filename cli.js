#!/usr/bin/env node

require("./lib/cjs/cli.js")
	.cli()
	.catch(console.log);
