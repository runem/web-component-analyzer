import { CompilerOptions, createProgram, Diagnostic, getPreEmitDiagnostics, ModuleResolutionKind, Program, ScriptTarget, SourceFile } from "typescript";

/**
 * The most general version of compiler options.
 */
const defaultOptions: CompilerOptions = {
	noEmitOnError: false,
	allowJs: true,
	experimentalDecorators: true,
	target: ScriptTarget.Latest,
	downlevelIteration: true,
	//module: ModuleKind.ESNext,
	//module: ModuleKind.CommonJS,
	//lib: ["esnext", "dom"],
	//strictNullChecks: true,
	moduleResolution: ModuleResolutionKind.NodeJs,
	esModuleInterop: true,
	noEmit: true,
	allowSyntheticDefaultImports: true,
	allowUnreachableCode: true,
	allowUnusedLabels: true,
	skipLibCheck: true,
	isolatedModules: true
};

export interface CompileResult {
	diagnostics: ReadonlyArray<Diagnostic>;
	program: Program;
	files: SourceFile[];
}

/**
 * Compiles an array of file paths using typescript.
 * @param filePaths
 * @param options
 */
export function compileTypescript(filePaths: string | string[], options: CompilerOptions = defaultOptions): CompileResult {
	filePaths = Array.isArray(filePaths) ? filePaths : [filePaths];
	const program = createProgram(filePaths, options);
	const diagnostics = getPreEmitDiagnostics(program);
	const files = program.getSourceFiles().filter(sf => filePaths.includes(sf.fileName));
	return { diagnostics, program, files };
}
