import {
	CompilerOptions,
	createProgram,
	createSourceFile,
	getDefaultLibFileName,
	ModuleKind,
	ScriptKind,
	ScriptTarget,
	SourceFile,
	sys,
	TypeChecker
} from "typescript";
import { analyzeSourceFile } from "./analyze-source-file";
import { AnalyzerResult } from "./types/analyzer-result";

export interface IVirtualSourceFile {
	fileName: string;
	text?: string;
	entry?: boolean;
}

export type VirtualSourceFile = IVirtualSourceFile | string;

/**
 * Analyzes components in code
 * @param {IVirtualSourceFile[]|VirtualSourceFile} inputFiles
 */
export function analyzeText(inputFiles: VirtualSourceFile[] | VirtualSourceFile): { result: AnalyzerResult; checker: TypeChecker } {
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

	const entryFile = files.find(file => file.entry === true) || files[0];
	if (entryFile == null) {
		throw new ReferenceError(`No entry could be found`);
	}

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
				return sys.getDirectories(directoryName);
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return getDefaultLibFileName(options);
			},

			getCanonicalFileName(fileName: string): string {
				return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
			},

			getNewLine(): string {
				return sys.newLine;
			},

			useCaseSensitiveFileNames() {
				return sys.useCaseSensitiveFileNames;
			}
		}
	});

	const checker = program.getTypeChecker();

	// Analyze the entry file
	const entrySourceFile = program.getSourceFile(entryFile.fileName)!;

	return {
		checker,
		result: analyzeSourceFile(entrySourceFile, { checker })
	};
}
