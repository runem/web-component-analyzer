import { writeFileSync } from "fs";
import { basename, dirname, extname, relative, resolve } from "path";
import { Program } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { transformAnalyzerResult } from "../../transformers/transform-analyzer-result";
import { TransformerConfig } from "../../transformers/transformer-config";
import { TransformerKind } from "../../transformers/transformer-kind";
import { arrayFlat } from "../../util/array-util";
import { AnalyzerCliConfig } from "../analyzer-cli-config";
import { CliCommand } from "../cli-command";
import { analyzeGlobs, AnalyzeGlobsContext } from "../util/analyze-globs";
import { makeCliError } from "../util/cli-error";
import { ensureDirSync } from "../util/file-util";
import { log } from "../util/log";

/**
 * Runs the analyze cli command.
 * @param config
 */
export const analyzeCliCommand: CliCommand = async (config: AnalyzerCliConfig): Promise<void> => {
	const inputGlobs = config.glob || [];

	// Log warning for experimental json format
	if (config.format === "json" || config.outFile?.endsWith(".json")) {
		log(
			`
!!!!!!!!!!!!!  WARNING !!!!!!!!!!!!!
The custom-elements.json format is for experimental purposes. You can expect changes to this format.
Please follow and contribute to the discussion at:		
  - https://github.com/webcomponents/custom-elements-json
  - https://github.com/w3c/webcomponents/issues/776
!!!!!!!!!!!!!  WARNING !!!!!!!!!!!!!
`,
			config
		);
	}

	// If no "out" is specified, output to console
	const outConsole = config.outDir == null && config.outFile == null && config.outFiles == null;

	// Give this context to the analyzer
	const context: AnalyzeGlobsContext = {
		didExpandGlobs(filePaths: string[]): void {
			if (filePaths.length === 0) {
				throw makeCliError(`Couldn't find any files to analyze.`);
			}
		},
		willAnalyzeFiles(filePaths: string[]): void {
			log(`Web Component Analyzer analyzing ${filePaths.length} file${filePaths.length === 1 ? "" : "s"}...`, config);
		},
		emitAnalyzedFile(file, result, { program }): Promise<void> | void {
			// Emit the transformed results as soon as possible if "outConsole" is on
			if (outConsole) {
				if (result.componentDefinitions.length > 0) {
					// Always use "console.log" when outputting the results
					/* eslint-disable-next-line no-console */
					console.log(transformResults(result, program, { ...config, cwd: config.cwd || process.cwd() }));
				}
			}
		}
	};

	// Analyze, - all the magic happens in here
	const { results, program } = await analyzeGlobs(inputGlobs, config, context);

	// Write files to the file system
	if (!outConsole) {
		const filteredResults = results.filter(result => result.componentDefinitions.length > 0 || result.globalFeatures != null);

		// Build up a map of "filePath => result[]"
		const outputResultMap = await distributeResultsIntoFiles(filteredResults, config);

		// Write all results to corresponding paths
		for (const [outputPath, results] of outputResultMap) {
			if (outputPath != null) {
				if (config.dry) {
					const tagNames = arrayFlat(results.map(result => result.componentDefinitions.map(d => d.tagName)));
					log(`[dry] Intending to write ${tagNames} to ./${relative(process.cwd(), outputPath)}`, config);
				} else {
					const content = transformResults(results, program, { ...config, cwd: config.cwd || dirname(outputPath) });
					ensureDirSync(dirname(outputPath));
					writeFileSync(outputPath, content);
				}
			}
		}
	}
};

/**
 * Transforms analyze results based on the wca cli config.
 * @param results
 * @param program
 * @param config
 */
function transformResults(results: AnalyzerResult[] | AnalyzerResult, program: Program, config: AnalyzerCliConfig): string {
	results = Array.isArray(results) ? results : [results];

	// Default format is "markdown"
	const format = config.format || "markdown";

	const transformerConfig: TransformerConfig = {
		inlineTypes: config.inlineTypes ?? false,
		visibility: config.visibility ?? "public",
		markdown: config.markdown,
		cwd: config.cwd
	};

	return transformAnalyzerResult(format, results, program, transformerConfig);
}

/**
 * Analyzes input globs and returns the transformed result.
 * @param inputGlobs
 * @param config
 */
export async function analyzeAndTransformGlobs(inputGlobs: string | string[], config: AnalyzerCliConfig): Promise<string> {
	const { results, program } = await analyzeGlobs(Array.isArray(inputGlobs) ? inputGlobs : [inputGlobs], config);
	return transformResults(results, program, config);
}

/**
 * Distribute results into files and return a map of "path => results"
 * @param results
 * @param config
 */
async function distributeResultsIntoFiles(results: AnalyzerResult[], config: AnalyzerCliConfig): Promise<Map<string | null, AnalyzerResult[]>> {
	const outputPathToResultMap = new Map<string | null, AnalyzerResult[]>();

	// Helper function to add a result to a path. It will merge into existing results.
	const addToOutputPath = (path: string, result: AnalyzerResult) => {
		const existing = outputPathToResultMap.get(path) || [];
		existing.push(result);
		outputPathToResultMap.set(path, existing);
	};

	// Output files into directory
	if (config.outDir != null) {
		// Get extension name based on the specified format.
		const extName = formatToExtension(config.format || "markdown");

		for (const result of results) {
			// Write file to disc for each analyzed file
			const definition = result.componentDefinitions[0];
			if (definition == null) continue;

			// The name of the file becomes the tagName of the first component definition in the file.
			const path = resolve(process.cwd(), config.outDir!, `${definition.tagName}${extName}`);
			addToOutputPath(path, result);
		}
	}

	// Output all results into a single file
	else if (config.outFile != null) {
		// Guess format based on outFile extension
		// eslint-disable-next-line require-atomic-updates
		config.format = config.format || extensionToFormat(config.outFile);

		const path = resolve(process.cwd(), config.outFile);

		for (const result of results) {
			addToOutputPath(path, result);
		}
	}

	// Output all results into multiple files
	else if (config.outFiles != null) {
		// Guess format based on outFile extension
		// eslint-disable-next-line require-atomic-updates
		config.format = config.format || extensionToFormat(config.outFiles);

		for (const result of results) {
			const dir = relative(process.cwd(), dirname(result.sourceFile.fileName));
			const filename = relative(process.cwd(), basename(result.sourceFile.fileName, extname(result.sourceFile.fileName)));

			for (const definition of result.componentDefinitions) {
				// The name of the file becomes the tagName of the first component definition in the file.
				const path = resolve(
					process.cwd(),
					config
						.outFiles!.replace(/{dir}/g, dir)
						.replace(/{filename}/g, filename)
						.replace(/{tagname}/g, definition.tagName)
				);

				//const path = resolve(process.cwd(), config.outFiles!, definition.tagName);
				addToOutputPath(path, {
					sourceFile: result.sourceFile,
					componentDefinitions: [definition]
				});
			}
		}
	}

	// Not "out" was specified. Add results to the special key "null"
	else {
		outputPathToResultMap.set(null, results);
	}

	return outputPathToResultMap;
}

/**
 * Returns an extension based on a format
 * @param kind
 */
function formatToExtension(kind: TransformerKind): string {
	switch (kind) {
		case "json":
		case "vscode":
			return ".json";
		case "md":
		case "markdown":
			return ".md";
		default:
			return ".txt";
	}
}

/**
 * Returns a format based on an extension
 * @param path
 */
function extensionToFormat(path: string): TransformerKind {
	const extName = extname(path);

	switch (extName) {
		case ".json":
			return "json";
		case ".md":
			return "markdown";
		default:
			return "markdown";
	}
}
