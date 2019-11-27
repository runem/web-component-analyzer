import { ComponentDeclaration } from "../../types/features/component-declaration";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function refineDeclaration(declaration: ComponentDeclaration, context: AnalyzerVisitContext): ComponentDeclaration {
	for (const flavor of context.flavors) {
		declaration = flavor.refineDeclaration?.(declaration, context) ?? declaration;
	}

	return declaration;
}
