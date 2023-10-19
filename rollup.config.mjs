import ts from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import copy from "rollup-plugin-copy";
// create a require
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { dirname } = require("path");
const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = ["typescript", "fast-glob", "path", "fs", "ts-simple-type", "yargs"];
const replaceVersionConfig = {
	VERSION: pkg.version,
	delimiters: ["<@", "@>"],
	preventAssignment: true
};

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
			replace(replaceVersionConfig),
			ts({
				module: "es2020"
			}),
			resolve(),
			copy({
				targets: [{ src: "package-esm.json", dest: "lib/esm", rename: "package.json" }]
			})
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
			replace(replaceVersionConfig),
			ts({
				module: "es2020",
				outDir: "./lib/cjs"
			}),
			resolve()
		],
		external,
		watch
	}
];
