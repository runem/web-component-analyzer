import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentFeature } from "../../types/features/component-feature";
import { FeatureVisitReturnTypeMap } from "../../flavors/analyzer-flavor";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

export type VisitFeatureEmitMap = { [K in ComponentFeature]: (result: FeatureVisitReturnTypeMap[K][]) => void };

export function visitFeatures<ReturnType>(node: Node, context: AnalyzerVisitContext, emitMap: Partial<VisitFeatureEmitMap>) {
	// TODO: optimize
	const visitMaps = context.flavors
		.map(flavor => flavor.discoverFeatures)
		.filter((visitMap): visitMap is NonNullable<typeof visitMap> => visitMap != null);

	for (const feature of context.config.features || []) {
		const result = executeFunctionsUntilMatch(visitMaps, feature, node, context);

		if (result != null) {
			emitMap[feature]?.(result.value as any);

			if (!result.shouldContinue) return;
		}
	}

	// Visit child nodes
	node.forEachChild(child => {
		visitFeatures(child, context, emitMap);
	});
}
