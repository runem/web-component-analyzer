import {AnalyzerResult} from "../../analyze/types/analyzer-result";
import {TransformerContext} from "../transformer-context";
import * as schema from "./schema";
import {getReferenceForNode} from "./utils";

function* getCustomElementExportsFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.CustomElementExport> {
	for (const definition of result.componentDefinitions) {
		// It's not possible right now to model a tag name where the
		//   declaration couldn't be resolved because the "declaration" is required
		if (definition.declaration == null) {
			continue;
		}

		yield {
			kind: "custom-element-definition",
			name: definition.tagName,
			declaration: getReferenceForNode(definition.declaration.node, context)
		};
	}
}

function* getExportedNamesFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.JavaScriptExport> {
	const symbol = context.checker.getSymbolAtLocation(result.sourceFile);
	if (symbol == null) {
		return;
	}

	const exports = context.checker.getExportsOfModule(symbol);

	for (const exp of exports) {
		yield {
			kind: "js",
			name: exp.name,
			declaration: getReferenceForNode(exp.valueDeclaration, context)
		};
	}
}

/**
 * Returns exports in an analyzer result
 * @param result
 * @param context
 */
export function* getExportsFromResult(
	result: AnalyzerResult,
	context: TransformerContext
): IterableIterator<schema.Export[]> {
	yield* getCustomElementExportsFromResult(result, context);
	yield* getExportedNamesFromResult(result, context);
}
