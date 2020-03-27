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

	const symbol = context.checker.getSymbolAtLocation(sourceFile);
	if (symbol != null) {
		// Get all exports in the source file
		const exports = context.checker.getExportsOfModule(symbol);

		// Find all class declarations in the source file
		for (const exp of exports) {
			const node = exp.valueDeclaration;

			if (node != null) {
				if (context.ts.isClassDeclaration(node) /* || context.ts.isInterfaceDeclaration(node)*/) {
					const decl = analyzeComponentDeclaration([node], context, { expandInheritance: false });
					declarations.push(decl);
				}
			}
		}
	}

	return declarations;
}
