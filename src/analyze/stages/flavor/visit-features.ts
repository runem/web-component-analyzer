import { Node } from "typescript";
import { arrayDefined } from "../../../util/array-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { AnalyzerDeclarationVisitContext, AnalyzerFlavor, FeatureVisitReturnTypeMap } from "../../flavors/analyzer-flavor";
import { ComponentFeature } from "../../types/features/component-feature";

export type VisitFeatureEmitMap = { [K in ComponentFeature]: (result: FeatureVisitReturnTypeMap[K][]) => void };

/**
 * Uses flavors to find features for a node
 * @param node
 * @param context
 * @param emitMap
 */
export function visitFeatures<ReturnType>(node: Node, context: AnalyzerDeclarationVisitContext, emitMap: Partial<VisitFeatureEmitMap>): void {
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
): void {
	for (const feature of context.config.features || []) {
		// Visit all features: always "continue"
		for (const functionMap of visitMaps) {
			const func = functionMap?.[feature];
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const value = func?.(node, context as any);

			if (value != null) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				emitMap[feature]?.(value as any);
			}
		}
	}

	// Visit child nodes
	node.forEachChild(child => {
		visitFeaturesWithVisitMaps(child, context, visitMaps, emitMap);
	});
}
