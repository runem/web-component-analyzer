import ts from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";

const { dirname } = require("path");
const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = ["typescript", "fast-glob", "path", "fs", "ts-simple-type", "yargs"];

export default [
	// Standard module config
	{
		input: {
			api: "src/api.ts",
			cli: "src/cli.ts"
		},
		output: [
			{
				dir: dirname(pkg.module),
				format: "esm",
				chunkFileNames: "chunk-[name]-[hash].js"
			}
		],
		plugins: [
			replace({
				VERSION: pkg.version,
				delimiters: ["<@", "@>"]
			}),
			ts({
				module: "ES2020"
			}),
			resolve()
		],
		external,
		watch
	},
	// CommonJS config
	{
		input: {
			api: "src/api.ts",
			cli: "src/cli.ts"
		},
		output: [
			{
				dir: dirname(pkg.main),
				format: "cjs",
				chunkFileNames: "chunk-[name]-[hash].js"
			}
		],
		plugins: [
			replace({
				VERSION: pkg.version,
				delimiters: ["<@", "@>"]
			}),
			ts({
				outDir: "./lib/cjs"
			}),
			resolve()
		],
		external,
		watch
	}
];
