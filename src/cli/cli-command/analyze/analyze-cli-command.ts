import { existsSync, mkdirSync, writeFileSync } from "fs";
import { extname, resolve } from "path";
import { Program, SourceFile } from "typescript";
import { AnalyzerResult } from "../../../analyze/types/analyzer-result";
import { transformAnalyzerResult } from "../../../transformers/transform-analyzer-result";
import { TransformerConfig } from "../../../transformers/transformer-config";
import { analyzeGlobs, AnalyzeGlobsContext } from "../../analyze-globs";
import { AnalyzerCliConfig } from "../../analyzer-cli-config";
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
	async run(config: AnalyzerCliConfig, ...inputGlobs: string[]): Promise<void> {
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
				emitAnalyzedFile: (file: SourceFile, result: AnalyzerResult, { program }): Promise<void> | void => {
					// Write file to disc for each analyzed file
					const definition = result.componentDefinitions[0];
					if (definition == null) return;

					// The name of the file becomes the tagName of the first component definition in the file.
					const path = resolve(process.cwd(), dirPath, definition.tagName) + extName;
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
			const path = resolve(process.cwd(), config.outFile);
			console.log(`Writing result to "${config.outFile}"`);
			writeFileSync(path, transformed);
		}

		// No output has been specified. Emit everything to the console.
		else {
			await analyzeGlobs(inputGlobs, config, {
				...context,
				emitAnalyzedFile: (file: SourceFile, result: AnalyzerResult, { program }): Promise<void> | void => {
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
	async analyze(inputGlobs: string | string[], config: AnalyzerCliConfig): Promise<string> {
		const { results, program } = await analyzeGlobs(Array.isArray(inputGlobs) ? inputGlobs : [inputGlobs], config);
		return this.transformResults(results, program, config);
	}

	/**
	 * Transforms analyze results based on the wca cli config.
	 * @param results
	 * @param program
	 * @param config
	 */
	private transformResults(results: AnalyzerResult[] | AnalyzerResult, program: Program, config: AnalyzerCliConfig): string {
		results = Array.isArray(results) ? results : [results];

		// Default format is "markdown"
		const format = config.format || "markdown";

		const transformerConfig: TransformerConfig = {
			visibility: config.visibility || "public",
			markdown: config.markdown
		};

		if (format === "json") {
			console.log(`\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
			console.log(`  WARNING: This json format is for experimental and demo purposes. You can expect changes to this format.`);
			console.log(`  Please follow and contribute to the discussion at:`);
			console.log(`  - https://github.com/webcomponents/custom-elements-json`);
			console.log(`  - https://github.com/w3c/webcomponents/issues/776`);
			console.log(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
		}

		return transformAnalyzerResult(format, results, program, transformerConfig);
	}
}
