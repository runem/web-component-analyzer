import { existsSync, mkdirSync, writeFileSync } from "fs";
import { extname, join } from "path";
import { Program, SourceFile } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { analyzeGlobs, AnalyzeGlobsContext } from "../../analyze-globs";
import { jsonTransformer } from "../../transformer/json-transformer";
import { markdownTransformer } from "../../transformer/markdown-transformer";
import { vscodeTransformer } from "../../transformer/vscode-transformer";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { CliCommand, CommandError } from "../cli-command";

/**
 * A CLI command for analyzing components.
 */
export class AnalyzeCliCommand implements CliCommand {
	id = "analyze";

	/**
	 * Prints help for this command.
	 */
	printHelp(): void {
		console.log(`Usage:
  \$ wca analyze [<input-glob>] [options]
  
Examples:
  $ wca analyze
  $ wca analyze src --format markdown
  $ wca analyze "src/**/*.{js,ts}" --outDir output
  $ wca analyze my-element.js --outFile output.json

Options:
  --help\t\tPrint this message.
  --format FORMAT\tSpecify output format. The possible options are:
\t\t\t  o md | markdown\tMarkdown format (default)
\t\t\t  o json\t\tJSON format
\t\t\t  o vscode\t\tVscode JSON format
  --outFile FILE\tConcatenate and emit output to a single file.
  --outDir DIRECTORY\tDirect output to a directory where each file corresponds to a web component.
`);
	}

	/**
	 * Runs the analyze cli command.
	 * @param config
	 * @param inputGlobs
	 */
	async run(config: WcaCliConfig, ...inputGlobs: string[]): Promise<void> {
		const context: AnalyzeGlobsContext = {
			didExpandGlobs(filePaths: string[]): void {
				if (filePaths.length === 0) {
					throw new CommandError(`Didn't find any files to analyze.`);
				}
			},
			willAnalyzeFiles(filePaths: string[]): void {
				console.log(`Analyzing ${filePaths.length} file${filePaths.length === 1 ? "" : "s"}...`);
			}
		};

		// The user wants to emit to a directory
		if (config.outDir != null) {
			// Create the directory if it doesn't exist.
			if (!existsSync(config.outDir)) {
				mkdirSync(config.outDir);
			}

			const dirPath = config.outDir;

			// Get extension name based on the specified format.
			const extName = (() => {
				switch (config.format) {
					case "json":
					case "vscode":
						return ".json";
					case "md":
					case "markdown":
						return ".md";
					default:
						return ".txt";
				}
			})();

			// Analyze all globs
			await analyzeGlobs(inputGlobs, config, {
				...context,
				emitAnalyzedFile: (file: SourceFile, result: AnalyzeComponentsResult, { program }): Promise<void> | void => {
					// Write file to disc for each analyzed file
					const definition = result.componentDefinitions[0];
					if (definition == null) return;

					// The name of the file becomes the tagName of the first component definition in the file.
					const path = join(process.cwd(), dirPath, definition.tagName) + extName;
					const transformed = this.transformResults(result, program, config);
					writeFileSync(path, transformed);
				}
			});
		}

		// The user wants to emit output to a single file
		else if (config.outFile != null) {
			// Guess format based on outFile extension
			config.format =
				config.format ||
				(() => {
					if (config.outFile == null) return undefined;
					const extName = extname(config.outFile);
					switch (extName) {
						case ".json":
							return "json";
						case ".md":
							return "markdown";
					}
				})() ||
				"markdown";

			// Analyze all globs and transform the results
			const { results, program } = await analyzeGlobs(inputGlobs, config, context);
			const transformed = this.transformResults(results, program, config);

			// Write the transformed the results to the file
			const path = join(process.cwd(), config.outFile);
			writeFileSync(path, transformed);
		}

		// No output has been specified. Emit everything to the console.
		else {
			await analyzeGlobs(inputGlobs, config, {
				...context,
				emitAnalyzedFile: (file: SourceFile, result: AnalyzeComponentsResult, { program }): Promise<void> | void => {
					// Only emit the result if there is in fact components in the file.
					if (result.componentDefinitions.length > 0 || result.globalEvents.length > 0) {
						const transformed = this.transformResults(result, program, config);
						console.log(transformed);
					}
				}
			});
		}
	}

	/**
	 * Analyzes input globs and returns the transformed result.
	 * @param inputGlobs
	 * @param config
	 */
	async analyze(inputGlobs: string | string[], config: WcaCliConfig): Promise<string> {
		const { results, program } = await analyzeGlobs(Array.isArray(inputGlobs) ? inputGlobs : [inputGlobs], config);
		return this.transformResults(results, program, config);
	}

	/**
	 * Transforms analyze results based on the wca cli config.
	 * @param results
	 * @param program
	 * @param config
	 */
	private transformResults(results: AnalyzeComponentsResult[] | AnalyzeComponentsResult, program: Program, config: WcaCliConfig): string {
		results = Array.isArray(results) ? results : [results];

		// Default format is "md"
		const format = config.format || "md";

		switch (format) {
			case "md":
			case "markdown":
				return markdownTransformer(results, program, config);
			case "vscode":
				return vscodeTransformer(results, program, config);
			case "json":
				console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
				console.log(`WARNING: The json transformer hasn't been finished yet. You can expect large changes in this output.`);
				console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
				return jsonTransformer(results, program, config);
			default:
				throw new CommandError(`Invalid output format '${config.format}'`);
		}
	}
}
