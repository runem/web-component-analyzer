import { SourceFile } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function isLibSourceFile(sourceFile: SourceFile, context: AnalyzerVisitContext): boolean | undefined {
	return sourceFile.fileName.endsWith("lib.dom.d.ts");
}
