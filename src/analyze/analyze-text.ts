import {
	CompilerOptions,
	createProgram,
	createSourceFile,
	getDefaultLibFileName,
	ModuleKind,
	Program,
	ScriptKind,
	ScriptTarget,
	SourceFile,
	sys,
	TypeChecker
} from "typescript";
import { arrayDefined } from "../util/array-util";
import { analyzeSourceFile } from "./analyze-source-file";
import { AnalyzerOptions } from "./types/analyzer-options";
import { AnalyzerResult } from "./types/analyzer-result";

export interface IVirtualSourceFile {
	fileName: string;
	text?: string;
	analyze?: boolean;
}

export type VirtualSourceFile = IVirtualSourceFile | string;

export interface AnalyzeTextResult {
	results: AnalyzerResult[];
	checker: TypeChecker;
	program: Program;
	analyzedSourceFiles: SourceFile[];
}

// "sys" can be undefined when running in the browser
const system: typeof sys | undefined = sys;

/**
 * Analyzes components in code
 * @param {IVirtualSourceFile[]|VirtualSourceFile} inputFiles
 * @param config
 */
export function analyzeText(inputFiles: VirtualSourceFile[] | VirtualSourceFile, config: Partial<AnalyzerOptions> = {}): AnalyzeTextResult {
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

	const readFile = (fileName: string): string | undefined => {
		const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
		return matchedFile == null ? undefined : matchedFile.text;
	};

	const fileExists = (fileName: string): boolean => {
		return files.some(currentFile => currentFile.fileName === fileName);
	};

	const compilerOptions: CompilerOptions = {
		module: ModuleKind.ESNext,
		target: ScriptTarget.ESNext,
		allowJs: true,
		sourceMap: false
	};

	const program = createProgram({
		rootNames: files.map(file => file.fileName),
		options: compilerOptions,
		host: {
			writeFile: () => {},
			readFile,
			fileExists,
			getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
				const sourceText = this.readFile(fileName);
				if (sourceText == null) return undefined;

				return createSourceFile(fileName, sourceText, languageVersion, true, fileName.endsWith(".js") ? ScriptKind.JS : ScriptKind.TS);
			},

			getCurrentDirectory() {
				return ".";
			},

			getDirectories(directoryName: string) {
				return system?.getDirectories(directoryName) ?? [];
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return getDefaultLibFileName(options);
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
