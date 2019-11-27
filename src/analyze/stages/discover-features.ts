import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { visitFeatures } from "./flavor/visit-features";
import { refineFeature, RefineFeatureEmitMap } from "./flavor/refine-feature";
import { mergeFeatures } from "./merge/merge-features";

export function discoverFeatures(node: Node, context: AnalyzerVisitContext): ComponentFeatureCollection {
	if (context.cache.featureCollection.has(node)) {
		return context.cache.featureCollection.get(node)!;
	}

	const collection: ComponentFeatureCollection = {
		memberResults: [],
		methods: [],
		events: [],
		slots: [],
		cssProperties: [],
		cssParts: []
	};

	const refineEmitMap: RefineFeatureEmitMap = {
		event: event => collection.events.push(event),
		member: memberResult => collection.memberResults.push(memberResult),
		csspart: cssPart => collection.cssParts.push(cssPart),
		cssproperty: cssProperty => collection.cssProperties.push(cssProperty),
		method: method => collection.methods.push(method),
		slot: slot => collection.slots.push(slot)
	};

	visitFeatures(node, context, {
		event: event => refineFeature("event", event, context, refineEmitMap),
		member: memberResult => refineFeature("member", memberResult, context, refineEmitMap),
		csspart: cssPart => refineFeature("csspart", cssPart, context, refineEmitMap),
		cssproperty: cssProperty => refineFeature("cssproperty", cssProperty, context, refineEmitMap),
		method: method => refineFeature("method", method, context, refineEmitMap),
		slot: slot => refineFeature("slot", slot, context, refineEmitMap)
	});

	return mergeFeatures(collection, context);
}
