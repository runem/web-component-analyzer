import { flatten } from "../../../cli/util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentFeatureCollection } from "../../flavors/analyzer-flavor";
import { mergeCssParts, mergeCssProperties, mergeEvents, mergeMethods, mergeSlots } from "./merge-feature";
import { mergeMemberResults } from "./merge-member-results";

export function mergeFeatures(
	collection: ComponentFeatureCollection | ComponentFeatureCollection[],
	context: AnalyzerVisitContext
): ComponentFeatureCollection {
	if (Array.isArray(collection)) {
		collection = {
			cssParts: flatten(collection.map(c => c.cssParts)),
			cssProperties: flatten(collection.map(c => c.cssProperties)),
			events: flatten(collection.map(c => c.events)),
			memberResults: flatten(collection.map(c => c.memberResults)),
			methods: flatten(collection.map(c => c.methods)),
			slots: flatten(collection.map(c => c.slots))
		};

		return mergeFeatures(collection, context);
	}

	return {
		cssParts: mergeCssParts(collection.cssParts),
		cssProperties: mergeCssProperties(collection.cssProperties),
		events: mergeEvents(collection.events),
		memberResults: mergeMemberResults(collection.memberResults, context),
		methods: mergeMethods(collection.methods),
		slots: mergeSlots(collection.slots)
	};
}
