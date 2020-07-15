import { CompilerOptions, createProgram, ModuleKind, ModuleResolutionKind, Program, ScriptTarget, SourceFile } from "typescript";

/**
 * The most general version of compiler options.
 */
const defaultOptions: CompilerOptions = {
	noEmitOnError: false,
	allowJs: true,
	maxNodeModuleJsDepth: 3,
	experimentalDecorators: true,
	target: ScriptTarget.Latest,
	downlevelIteration: true,
	module: ModuleKind.ESNext,
	//module: ModuleKind.CommonJS,
	//lib: ["ESNext", "DOM", "DOM.Iterable"],
	strictNullChecks: true,
	moduleResolution: ModuleResolutionKind.NodeJs,
	esModuleInterop: true,
	noEmit: true,
	allowSyntheticDefaultImports: true,
	allowUnreachableCode: true,
	allowUnusedLabels: true,
	skipLibCheck: true
};

export interface CompileResult {
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
	const files = program
		.getSourceFiles()
		.filter(sf => filePaths.includes(sf.fileName))
		.sort((sfA, sfB) => (sfA.fileName > sfB.fileName ? 1 : -1));
	return { program, files };
}
