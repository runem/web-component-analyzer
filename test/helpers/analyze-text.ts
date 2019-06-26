import { join } from "path";
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
import { analyzeComponents, AnalyzeComponentsResult } from "../../src/analyze/analyze-components";

// tslint:disable:no-any

export interface ITestFile {
	fileName: string;
	text?: string;
	entry?: boolean;
}

export type TestFile = ITestFile | string;

/**
 * Analyzes components in code
 * @param {ITestFile[]|TestFile} inputFiles
 * @returns {Promise<{fileName: string, result: AnalyzeComponentsResult}[]>}
 */
export function analyzeComponentsInCode(
	inputFiles: TestFile[] | TestFile
): { fileName: string; result: AnalyzeComponentsResult; checker: TypeChecker }[] {
	const cwd = process.cwd();

	const files: ITestFile[] = (Array.isArray(inputFiles) ? inputFiles : [inputFiles])
		.map(file =>
			typeof file === "string"
				? {
						text: file,
						fileName: `auto-generated-${Math.floor(Math.random() * 100000)}.ts`,
						entry: true
				  }
				: file
		)
		.map(file => ({ ...file, fileName: join(cwd, file.fileName) }));

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

				return createSourceFile(fileName, sourceText, languageVersion, true, ScriptKind.TS);
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

	return files
		.map(testFile => program.getSourceFile(testFile.fileName)!)
		.map(sf => ({
			fileName: sf.fileName,
			result: analyzeComponents(sf, { checker }),
			checker
		}));
}
