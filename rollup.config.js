import ts from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const { dirname } = require("path");
const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = ["typescript", "fast-glob", "path", "fs", "ts-simple-type", "yargs"];
const plugins = [
	replace({
		VERSION: pkg.version,
		delimiters: ["<@", "@>"]
	}),
	ts({
		module: "esnext"
	}),
	resolve()
];

export default [
	{
		input: {
			api: "src/api.ts",
			cli: "src/cli.ts"
		},
		output: [
			{
				dir: "lib/",
				format: "cjs",
				chunkFileNames: "cjs/chunk-[name]-[hash].js"
			},
			{
				dir: "lib/",
				format: "esm",
				chunkFileNames: "esm/chunk-[name]-[hash].js"
			}
		],
		plugins,
		external,
		watch
	}
];
