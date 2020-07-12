import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import * as tsModule from "typescript";
import { CompilerOptions, Program, ScriptKind, ScriptTarget, SourceFile, System, TypeChecker } from "typescript";
//import * as ts from "typescript";
import { arrayDefined } from "../util/array-util";
import { analyzeSourceFile } from "./analyze-source-file";
import { AnalyzerOptions } from "./types/analyzer-options";
import { AnalyzerResult } from "./types/analyzer-result";

export interface IVirtualSourceFile {
	fileName: string;
	text?: string;
	analyze?: boolean;
	includeLib?: boolean;
}

export type VirtualSourceFile = IVirtualSourceFile | string;

export interface AnalyzeTextResult {
	results: AnalyzerResult[];
	checker: TypeChecker;
	program: Program;
	analyzedSourceFiles: SourceFile[];
}

/**
 * Analyzes components in code
 * @param {IVirtualSourceFile[]|VirtualSourceFile} inputFiles
 * @param config
 */
export function analyzeText(inputFiles: VirtualSourceFile[] | VirtualSourceFile, config: Partial<AnalyzerOptions> = {}): AnalyzeTextResult {
	const ts = config.ts || tsModule;

	// "sys" can be undefined when running in the browser
	const system: System | undefined = ts.sys;

	// Convert arguments into virtual source files
	const files: IVirtualSourceFile[] = (Array.isArray(inputFiles) ? inputFiles : [inputFiles])
		.map(file =>
			typeof file === "string"
				? {
						text: file,
						fileName: `auto-generated-${Math.floor(Math.random() * 100000)}.ts`,
						entry: true
				  }
				: file
		)
		.map(file => ({ ...file, fileName: file.fileName }));

	const includeLib = files.some(file => file.includeLib);

	const readFile = (fileName: string): string | undefined => {
		const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
		if (matchedFile != null) {
			return matchedFile.text;
		}

		if (includeLib) {
			// TODO: find better method of finding the current typescript module path
			fileName = fileName.match(/[/\\]/) ? fileName : join(dirname(require.resolve("typescript")), fileName);
		}

		if (existsSync(fileName)) {
			return readFileSync(fileName, "utf8").toString();
		}

		return undefined;
	};

	const fileExists = (fileName: string): boolean => {
		return files.some(currentFile => currentFile.fileName === fileName);
	};

	const compilerOptions: CompilerOptions = {
		module: ts.ModuleKind.ESNext,
		target: ts.ScriptTarget.ESNext,
		allowJs: true,
		sourceMap: false,
		strictNullChecks: true
	};

	const program = ts.createProgram({
		rootNames: files.map(file => file.fileName),
		options: compilerOptions,
		host: {
			writeFile: () => {},
			readFile,
			fileExists,
			getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
				const sourceText = this.readFile(fileName);
				if (sourceText == null) return undefined;

				return ts.createSourceFile(fileName, sourceText, languageVersion, true, fileName.endsWith(".js") ? ScriptKind.JS : ScriptKind.TS);
			},

			getCurrentDirectory() {
				return ".";
			},

			getDirectories(directoryName: string) {
				return system?.getDirectories(directoryName) ?? [];
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return ts.getDefaultLibFileName(options);
			},

			getCanonicalFileName(fileName: string): string {
				return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
			},

			getNewLine(): string {
				return system?.newLine ?? "\n";
			},

			useCaseSensitiveFileNames() {
				return system?.useCaseSensitiveFileNames ?? false;
			}
		}
	});

	const checker = program.getTypeChecker();

	// Analyze source files
	const sourceFilesToAnalyze = arrayDefined(files.filter(file => file.analyze !== false).map(file => program.getSourceFile(file.fileName)));
	const results = sourceFilesToAnalyze.map(sf => analyzeSourceFile(sf, { program, ...config }));

	return { checker, program, results, analyzedSourceFiles: sourceFilesToAnalyze };
}
