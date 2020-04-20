import { arrayFlat } from "../../../util/array-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentFeatureCollection } from "../../flavors/analyzer-flavor";
import { mergeCssParts, mergeCssProperties, mergeEvents, mergeMethods, mergeSlots } from "./merge-feature";
import { mergeMembers } from "./merge-members";

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
			members: arrayFlat(collection.map(c => c.members)),
			methods: arrayFlat(collection.map(c => c.methods)),
			slots: arrayFlat(collection.map(c => c.slots))
		};

		return mergeFeatures(collection, context);
	}

	return {
		cssParts: mergeCssParts(collection.cssParts),
		cssProperties: mergeCssProperties(collection.cssProperties),
		events: mergeEvents(collection.events),
		members: mergeMembers(collection.members, context),
		methods: mergeMethods(collection.methods),
		slots: mergeSlots(collection.slots)
	};
}
