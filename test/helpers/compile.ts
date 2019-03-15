/*import { CompilerOptions, createProgram, Diagnostic, getPreEmitDiagnostics, ModuleKind, Program, ScriptTarget, SourceFile } from "typescript";

 const defaultOptions: CompilerOptions = {
 noEmitOnError: true,
 allowJs: true,
 noImplicitAny: true,
 noResolve: false,
 target: ScriptTarget.ES5,
 module: ModuleKind.CommonJS,
 strict: true
 };

 export interface CompileResult {
 sourceFile: SourceFile;
 diagnostics: ReadonlyArray<Diagnostic>;
 program: Program;
 }

 export function compileTypescript(filePath: string, options: CompilerOptions = defaultOptions): CompileResult {
 const program = createProgram([filePath], options);
 const sourceFile = program.getSourceFile(filePath);
 if (sourceFile == null) throw new Error(`Couldn't find source file: ${filePath}`);

 const diagnostics = getPreEmitDiagnostics(program);

 return { sourceFile, diagnostics, program };
 }
 */
