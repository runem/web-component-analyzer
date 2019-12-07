import { Node } from "typescript";
import { arrayDefined } from "../../../util/array-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { AnalyzerFlavor, FeatureVisitReturnTypeMap } from "../../flavors/analyzer-flavor";
import { ComponentFeature } from "../../types/features/component-feature";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

export type VisitFeatureEmitMap = { [K in ComponentFeature]: (result: FeatureVisitReturnTypeMap[K][]) => void };

/**
 * Uses flavors to find features for a node
 * @param node
 * @param context
 * @param emitMap
 */
export function visitFeatures<ReturnType>(node: Node, context: AnalyzerVisitContext, emitMap: Partial<VisitFeatureEmitMap>) {
	const visitMaps = arrayDefined(context.flavors.map(flavor => flavor.discoverFeatures));

	visitFeaturesWithVisitMaps(node, context, visitMaps, emitMap);
}

/**
 * Uses flavors to find features for a node, using a visit map
 * @param node
 * @param context
 * @param visitMaps
 * @param emitMap
 */
export function visitFeaturesWithVisitMaps<ReturnType>(
	node: Node,
	context: AnalyzerVisitContext,
	visitMaps: NonNullable<AnalyzerFlavor["discoverFeatures"]>[],
	emitMap: Partial<VisitFeatureEmitMap>
) {
	for (const feature of context.config.features || []) {
		const result = executeFunctionsUntilMatch(visitMaps, feature, node, context);

		if (result != null) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			emitMap[feature]?.(result.value as any);

			if (!result.shouldContinue) return;
		}
	}

	// Visit child nodes
	node.forEachChild(child => {
		visitFeaturesWithVisitMaps(child, context, visitMaps, emitMap);
	});
}
