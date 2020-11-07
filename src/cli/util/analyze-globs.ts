import fastGlob from "fast-glob";
import { existsSync, lstatSync } from "fs";
import { Program, SourceFile } from "typescript";
import { analyzeSourceFile } from "../../analyze/analyze-source-file";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { arrayFlat } from "../../util/array-util";
import { stripTypescriptValues } from "../../util/strip-typescript-values";
import { AnalyzerCliConfig } from "../analyzer-cli-config";
import { CompileResult, compileTypescript } from "./compile";
import { logVerbose } from "./log";

const IGNORE_GLOBS = ["**/node_modules/**", "**/web_modules/**"];
const DEFAULT_DIR_GLOB = "**/*.{js,jsx,ts,tsx}";
const DEFAULT_GLOBS = [DEFAULT_DIR_GLOB];

export interface AnalyzeGlobsContext {
	didExpandGlobs?(filePaths: string[]): void;
	willAnalyzeFiles?(filePaths: string[]): void;
	emitAnalyzedFile?(file: SourceFile, result: AnalyzerResult, options: { program: Program }): Promise<void> | void;
}

/**
 * Parses and analyses all globs and calls some callbacks while doing it.
 * @param globs
 * @param config
 * @param context
 */
export async function analyzeGlobs(
	globs: string[],
	config: AnalyzerCliConfig,
	context: AnalyzeGlobsContext = {}
): Promise<CompileResult & { results: AnalyzerResult[] }> {
	// Set default glob
	if (globs.length === 0) {
		globs = DEFAULT_GLOBS;
	}

	// Expand the globs
	const filePaths = await expandGlobs(globs, config);

	logVerbose(() => filePaths, config);

	// Callbacks
	context.didExpandGlobs?.(filePaths);
	context.willAnalyzeFiles?.(filePaths);

	// Parse all the files with typescript
	const { program, files } = compileTypescript(filePaths);

	// Analyze each file with web component analyzer
	const results: AnalyzerResult[] = [];
	for (const file of files) {
		// Analyze
		const result = analyzeSourceFile(file, {
			program,
			verbose: config.verbose || false,
			ts: config.ts,
			config: {
				features: config.features,
				analyzeDependencies: config.analyzeDependencies,
				analyzeDefaultLib: config.analyzeDefaultLibrary,
				analyzeGlobalFeatures: config.analyzeGlobalFeatures,
				analyzeAllDeclarations: config.format == "json2" // TODO: find a better way to construct the config
			}
		});

		logVerbose(() => stripTypescriptValues(result, program.getTypeChecker()), config);

		// Callback
		await context.emitAnalyzedFile?.(file, result, { program });

		results.push(result);
	}

	return { program, files, results };
}

/**
 * Expands the globs.
 * @param globs
 * @param config
 */
async function expandGlobs(globs: string | string[], config: AnalyzerCliConfig): Promise<string[]> {
	globs = Array.isArray(globs) ? globs : [globs];

	const ignoreGlobs = config?.discoverNodeModules ? [] : IGNORE_GLOBS;

	return arrayFlat(
		await Promise.all(
			globs.map(g => {
				try {
					// Test if the glob points to a directory.
					// If so, return the result of a new glob that searches for files in the directory excluding node_modules..
					const dirExists = existsSync(g) && lstatSync(g).isDirectory();

					if (dirExists) {
						return fastGlob([fastGlobNormalize(`${g}/${DEFAULT_DIR_GLOB}`)], {
							ignore: ignoreGlobs,
							absolute: true,
							followSymbolicLinks: false
						});
					}
				} catch (e) {
					// the glob wasn't a directory
				}

				// Return the result of globbing
				return fastGlob([fastGlobNormalize(g)], {
					ignore: ignoreGlobs,
					absolute: true,
					followSymbolicLinks: false
				});
			})
		)
	);
}

/**
 * Fast glob recommends normalizing paths for windows, because fast glob expects a Unix-style path.
 * Read more here: https://github.com/mrmlnc/fast-glob#how-to-write-patterns-on-windows
 * @param glob
 */
function fastGlobNormalize(glob: string): string {
	return glob.replace(/\\/g, "/");
}
