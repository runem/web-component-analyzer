import ts from "@wessberg/rollup-plugin-ts";
import replace from "rollup-plugin-replace";

const pkg = require("./package.json");
const watch = { include: "src/**" };
const external = ["typescript", "fast-glob", "path", "fs", "ts-simple-type"];
const plugins = [
	replace({
		VERSION: pkg.version,
		delimiters: ["<@", "@>"]
	}),
	ts({
		tsconfig: "tsconfig.json"
	})
];

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: pkg.main,
				format: "cjs"
			}
		],
		plugins,
		external,
		watch
	}
];
