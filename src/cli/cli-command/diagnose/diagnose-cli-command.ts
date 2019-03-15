import { SourceFile } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { analyzeGlobs } from "../../analyze-globs";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { CliCommand, CommandError } from "../cli-command";
import { printResultDiagnostics } from "./print-diagnostics";

/**
 * A CLI command for emitting diagnostics for components.
 */
export class DiagnoseCliCommand implements CliCommand {
	id = "diagnose";

	/**
	 * Prints the help text for this command.
	 */
	printHelp(): void {
		console.log(`Usage:
  \$ wca diagnose [<input-glob>] [options]
  
Examples:
  $ wca diagnose
  $ wca diagnose src
  $ wca diagnose "./src/**/*.{js,ts}"
  $ wca diagnose my-element.js

Options:
  --help\t\tPrint this message.
`);
	}

	/**
	 * Runs this command
	 * @param config
	 * @param inputGlobs
	 */
	async run(config: WcaCliConfig, ...inputGlobs: string[]): Promise<number> {
		let passed = true;

		// Set "diagnostics" to true in the analyze configuration.
		config.analyze = { ...(config.analyze || {}), diagnostics: true };

		// Analyze the globs and emit diagnostics.
		await analyzeGlobs(inputGlobs, config, {
			didExpandGlobs(filePaths: string[]): void {
				if (filePaths.length === 0) {
					throw new CommandError(`Didn't find any files to analyze.`);
				}
			},
			willAnalyzeFiles(filePaths: string[]): void {
				console.log(`Analyzing ${filePaths.length} file${filePaths.length === 1 ? "" : "s"}...`);
			},
			emitAnalyzedFile: (file: SourceFile, result: AnalyzeComponentsResult, { program }): Promise<void> | void => {
				// Print diagnostics of the result.
				printResultDiagnostics(result);

				if (result.diagnostics.length > 0) {
					passed = false;
				}
			}
		});

		return passed ? 0 : 1;
	}
}
