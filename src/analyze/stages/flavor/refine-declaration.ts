import { AnalyzerDeclarationVisitContext } from "../../flavors/analyzer-flavor";
import { ComponentDeclaration } from "../../types/component-declaration";

/**
 * Uses flavors to refine a declaration
 * @param declaration
 * @param context
 */
export function refineDeclaration(declaration: ComponentDeclaration, context: AnalyzerDeclarationVisitContext): ComponentDeclaration {
	for (const flavor of context.flavors) {
		declaration = flavor.refineDeclaration?.(declaration, context) ?? declaration;
	}

	return declaration;
}
