import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { ComponentFeatures } from "../types/component-declaration";
import { prepareRefineEmitMap } from "../util/get-refine-emit-map";
import { refineFeature } from "./flavor/refine-feature";
import { visitGlobalFeatures } from "./flavor/visit-global-features";
import { mergeFeatures } from "./merge/merge-features";

/**
 * Discover all global features using flavors
 * @param node
 * @param context
 */
export function discoverGlobalFeatures(node: Node, context: AnalyzerVisitContext): ComponentFeatures {
	const { collection, refineEmitMap } = prepareRefineEmitMap();

	// Discovers global features using flavors
	visitGlobalFeatures(node, context, {
		event: event => refineFeature("event", event, context, refineEmitMap),
		member: memberResult => refineFeature("member", memberResult, context, refineEmitMap),
		csspart: cssPart => refineFeature("csspart", cssPart, context, refineEmitMap),
		cssproperty: cssProperty => refineFeature("cssproperty", cssProperty, context, refineEmitMap),
		method: method => refineFeature("method", method, context, refineEmitMap),
		slot: slot => refineFeature("slot", slot, context, refineEmitMap)
	});

	// Merge features in the collection
	return mergeFeatures(collection, context);
}
