import { ComponentDeclaration } from "../../types/component-declaration";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function refineDeclaration(declaration: ComponentDeclaration, context: AnalyzerVisitContext) {
	if (declaration.jsDoc == null || declaration.jsDoc.tags == null) {
		return undefined;
	}

	const deprecatedTag = declaration.jsDoc.tags.find(t => t.tag === "deprecated");
	if (deprecatedTag != null) {
		return {
			...declaration,
			deprecated: deprecatedTag.comment || true
		};
	}

	return undefined;
}
