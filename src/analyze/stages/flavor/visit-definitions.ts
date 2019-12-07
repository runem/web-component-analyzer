import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { DefinitionNodeResult } from "../../flavors/analyzer-flavor";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

/**
 * Uses flavors to visit definitions
 * @param node
 * @param context
 * @param emit
 */
export function visitDefinitions(node: Node, context: AnalyzerVisitContext, emit: (results: DefinitionNodeResult[]) => void): void {
	const result = executeFunctionsUntilMatch(context.flavors, "discoverDefinitions", node, context);

	if (result != null) {
		emit(result.value);

		if (!result.shouldContinue) return;
	}

	// Visit child nodes
	node.forEachChild(child => {
		visitDefinitions(child, context, emit);
	});
}
