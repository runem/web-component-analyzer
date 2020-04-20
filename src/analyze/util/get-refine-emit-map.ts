import { ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { RefineFeatureEmitMap } from "../stages/flavor/refine-feature";

/**
 * Prepares a map of component features and a callback map that adds to the component feature map.
 */
export function prepareRefineEmitMap(): { collection: ComponentFeatureCollection; refineEmitMap: RefineFeatureEmitMap } {
	const collection: ComponentFeatureCollection = {
		members: [],
		methods: [],
		events: [],
		slots: [],
		cssProperties: [],
		cssParts: []
	};

	const refineEmitMap: RefineFeatureEmitMap = {
		event: event => collection.events.push(event),
		member: member => collection.members.push(member),
		csspart: cssPart => collection.cssParts.push(cssPart),
		cssproperty: cssProperty => collection.cssProperties.push(cssProperty),
		method: method => collection.methods.push(method),
		slot: slot => collection.slots.push(slot)
	};

	return {
		collection,
		refineEmitMap
	};
}
