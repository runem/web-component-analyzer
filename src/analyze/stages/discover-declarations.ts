import { SourceFile } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { ComponentDeclaration } from "../types/component-declaration";
import { analyzeComponentDeclaration } from "./analyze-declaration";

/**
 * Visits the source file and finds all component definitions using flavors
 * @param sourceFile
 * @param context
 */
export function discoverDeclarations(sourceFile: SourceFile, context: AnalyzerVisitContext): ComponentDeclaration[] {
	const declarations: ComponentDeclaration[] = [];

	for (const statement of sourceFile.statements) {
		if (context.ts.isClassDeclaration(statement) /* || context.ts.isInterfaceDeclaration(node)*/) {
			const decl = analyzeComponentDeclaration([statement], context);
			if (decl != null) {
				declarations.push(decl);
			}
		}
	}

	return declarations;
}
