import * as yargs from "yargs";
import { analyzeCliCommand } from "./analyze/analyze-cli-command";
import { AnalyzerCliConfig } from "./analyzer-cli-config";
import { isCliError } from "./util/cli-error";
import { log } from "./util/log";

/**
 * The main function of the cli.
 */
export async function cli() {
	const argv = yargs
		.usage("Usage: $0 <command> [glob..] [options]")
		.command<AnalyzerCliConfig>({
			command: ["analyze [glob..]", "$0"],
			describe: "Analyses components and emits results in a specified format.",
			handler: async config => {
				try {
					await analyzeCliCommand(config);
				} catch (e) {
					if (isCliError(e)) {
						log(e.message, config);
					} else {
						throw e;
					}
				}
			}
		})
		.example(`$ $0 analyze`, "")
		.example(`$ $0 analyze src --format markdown`, "")
		.example(`$ $0 analyze "src/**/*.{js,ts}" --outDir output`, "")
		.example(`$ $0 analyze my-element.js --outFile custom-elements.json`, "")
		.example(`$ $0 analyze --outFiles {dir}/custom-element.json`, "")
		.option("outDir", {
			describe: `Output to a directory where each file corresponds to a web component`,
			nargs: 1,
			string: true
		})
		.option("outFile", {
			describe: `Concatenate and emit output to a single file`,
			nargs: 1,
			string: true
		})
		.option("outFiles", {
			describe: `Emit output to multiple files using a pattern. Available substitutions:
o {dir}: The directory of the component
o {filename}: The filename (without ext) of the component
o {tagname}: The element's tag name`,
			nargs: 1,
			string: true
		})
		.option("format", {
			describe: `Specify output format`,
			choices: ["md", "markdown", "json", "vscode"],
			nargs: 1,
			alias: "f"
		})
		.option("features", {
			describe: `Features to enable`,
			array: true,
			choices: ["member", "method", "cssproperty", "csspart", "event", "slot"]
		})
		.option("discoverLibraryFiles", {
			boolean: true,
			hidden: true
		})
		.option("visibility", {
			describe: `Minimum visibility`,
			choices: ["private", "protected", "public"]
		})
		.option("inlineTypes", {
			describe: `Inline type aliases`,
			boolean: true
		})
		.option("dry", {
			describe: `Don't write files`,
			boolean: true,
			alias: "d"
		})
		.option("verbose", {
			boolean: true,
			hidden: true
		})
		.option("silent", {
			boolean: true,
			hidden: true
		})

		// This options makes it possible to use "markdown.<sub-option>" in "strict mode"
		.option("markdown", {
			hidden: true
		})

		// This option makes it possible to specify a base cwd to use when emitting paths
		.option("cwd", {
			string: true,
			hidden: true
		})

		.alias("v", "version")
		.help("h")
		.wrap(110)
		.strict()
		.alias("h", "help").argv;

	if (argv.verbose) {
		/* eslint-disable-next-line no-console */
		console.log("CLI options:", argv);
	}
}
