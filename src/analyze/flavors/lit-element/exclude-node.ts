import { SourceFile } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function isLibSourceFile(sourceFile: SourceFile, context: AnalyzerVisitContext): boolean | undefined {
	console.log(`source file`, sourceFile.fileName);
	return sourceFile.fileName.endsWith("lib.dom.d.ts");
}
