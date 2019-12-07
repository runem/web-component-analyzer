import { Node } from "typescript";
import { AnalyzerDeclarationVisitContext, ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { prepareRefineEmitMap } from "../util/get-refine-emit-map";
import { refineFeature } from "./flavor/refine-feature";
import { visitFeatures } from "./flavor/visit-features";
import { mergeFeatures } from "./merge/merge-features";

/**
 * Discovers features for a given node using flavors
 * @param node
 * @param context
 */
export function discoverFeatures(node: Node, context: AnalyzerDeclarationVisitContext): ComponentFeatureCollection {
	// Return the result if we already found this node
	if (context.cache.featureCollection.has(node)) {
		return context.cache.featureCollection.get(node)!;
	}

	const { collection, refineEmitMap } = prepareRefineEmitMap();

	// Discovers features for "node" using flavors
	visitFeatures(node, context, {
		event: event => refineFeature("event", event, context, refineEmitMap),
		member: memberResult => refineFeature("member", memberResult, context, refineEmitMap),
		csspart: cssPart => refineFeature("csspart", cssPart, context, refineEmitMap),
		cssproperty: cssProperty => refineFeature("cssproperty", cssProperty, context, refineEmitMap),
		method: method => refineFeature("method", method, context, refineEmitMap),
		slot: slot => refineFeature("slot", slot, context, refineEmitMap)
	});

	// Merge features that were found
	const mergedCollection = mergeFeatures(collection, context);

	// Cache the features for this node
	context.cache.featureCollection.set(node, mergedCollection);

	return mergedCollection;
}
