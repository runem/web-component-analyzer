import { arrayFlat } from "../../../util/array-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentFeatureCollection } from "../../flavors/analyzer-flavor";
import { mergeCssParts, mergeCssProperties, mergeEvents, mergeMethods, mergeSlots } from "./merge-feature";
import { mergeMemberResults } from "./merge-member-results";

/**
 * Merges all features in collections of features
 * @param collection
 * @param context
 */
export function mergeFeatures(
	collection: ComponentFeatureCollection | ComponentFeatureCollection[],
	context: AnalyzerVisitContext
): ComponentFeatureCollection {
	if (Array.isArray(collection)) {
		if (collection.length === 1) {
			return collection[0];
		}

		collection = {
			cssParts: arrayFlat(collection.map(c => c.cssParts)),
			cssProperties: arrayFlat(collection.map(c => c.cssProperties)),
			events: arrayFlat(collection.map(c => c.events)),
			memberResults: arrayFlat(collection.map(c => c.memberResults)),
			methods: arrayFlat(collection.map(c => c.methods)),
			slots: arrayFlat(collection.map(c => c.slots))
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
