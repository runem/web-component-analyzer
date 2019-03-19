import { async } from "fast-glob";
import { existsSync, lstatSync } from "fs";
import { join } from "path";
import { Diagnostic, flattenDiagnosticMessageText, Program, SourceFile } from "typescript";
import { analyzeComponents, AnalyzeComponentsResult } from "../analyze/analyze-components";
import { CompileResult, compileTypescript } from "./compile";
import { debugJsonTransformer } from "./transformer/debug-json-transformer";
import { flatten } from "./util";
import { WcaCliConfig } from "./wca-cli-arguments";

const IGNORE_GLOBS = ["!**/node_modules/**", "!**/web_modules/**"];
//const DEFAULT_DIR_GLOB = "{,!(node_modules|web_modules)/}**/*.{js,jsx,ts,tsx}";
const DEFAULT_DIR_GLOB = "**/*.{js,jsx,ts,tsx}";
//const DEFAULT_FILE_GLOB = "**/*.{js,jsx,ts,tsx}";

const DEFAULT_GLOBS = [DEFAULT_DIR_GLOB]; //, DEFAULT_FILE_GLOB];

export interface AnalyzeGlobsContext {
	didExpandGlobs?(filePaths: string[]): void;
	willAnalyzeFiles?(filePaths: string[]): void;
	didFindTypescriptDiagnostics?(diagnostics: ReadonlyArray<Diagnostic>, options: { program: Program }): void;
	emitAnalyzedFile?(file: SourceFile, result: AnalyzeComponentsResult, options: { program: Program }): Promise<void> | void;
}

/**
 * Parses and analyses all globs and calls some callbacks while doing it.
 * @param globs
 * @param config
 * @param context
 */
export async function analyzeGlobs(globs: string[], config: WcaCliConfig, context: AnalyzeGlobsContext = {}): Promise<CompileResult & { results: AnalyzeComponentsResult[] }> {
	// Set default glob
	if (globs.length === 0) {
		globs = DEFAULT_GLOBS;
	}

	// Expand the globs
	const filePaths = await expandGlobs(globs, config);

	if (config.debug) {
		console.log(filePaths);
	}

	// Callbacks
	if (context.didExpandGlobs != null) context.didExpandGlobs(filePaths);
	if (context.willAnalyzeFiles != null) context.willAnalyzeFiles(filePaths);

	// Parse all the files with typescript
	const { program, files, diagnostics } = compileTypescript(filePaths);

	if (diagnostics.length > 0) {
		if (config.debug) {
			console.dir(diagnostics.map(d => `${(d.file && d.file.fileName) || "unknown"}: ${flattenDiagnosticMessageText(d.messageText, "\n")}`));
		}

		if (context.didFindTypescriptDiagnostics != null) context.didFindTypescriptDiagnostics(diagnostics, { program });
	}

	// Analyze each file with web component analyzer
	const results: AnalyzeComponentsResult[] = [];
	for (const file of files) {
		// Analyze
		const result = analyzeComponentsInFile(file, program, config);

		if (config.debug) {
			console.dir(debugJsonTransformer([result], program.getTypeChecker()), { depth: 10 });
		}

		// Callback
		if (context.emitAnalyzedFile != null) await context.emitAnalyzedFile(file, result, { program });

		results.push(result);
	}

	return { program, diagnostics, files, results };
}

/**
 * Analyze all components in the typescript sourcefile using web component analyzer.
 * @param file
 * @param program
 * @param config
 */
function analyzeComponentsInFile(file: SourceFile, program: Program, config: WcaCliConfig): AnalyzeComponentsResult {
	const options = {
		checker: program.getTypeChecker(),
		config: config.analyze
	};

	return analyzeComponents(file, options);
}

/**
 * Expands the globs.
 * @param globs
 * @param config
 */
async function expandGlobs(globs: string | string[], config: WcaCliConfig): Promise<string[]> {
	globs = Array.isArray(globs) ? globs : [globs];

	return flatten(
		await Promise.all(
			globs.map(g => {
				try {
					// Test if the glob points to a directory.
					// If so, return the result of a new glob that searches for files in the directory excluding node_modules..
					const dirExists = existsSync(g) && lstatSync(g).isDirectory();
					if (dirExists) {
						return async<string>([...(config.analyzeLibraries ? [] : IGNORE_GLOBS), join(g, DEFAULT_DIR_GLOB)], {
							absolute: true,
							followSymlinkedDirectories: false
						});
					}
				} catch (e) {}

				// Return the result of globbing
				return async<string>([...(config.analyzeLibraries ? [] : IGNORE_GLOBS), g], {
					absolute: true,
					followSymlinkedDirectories: false
				});
			})
		)
	);
}
