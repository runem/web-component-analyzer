import { ComponentFeatureCollection } from "../flavors/analyzer-flavor";
import { RefineFeatureEmitMap } from "../stages/flavor/refine-feature";

export function prepareRefineEmitMap(): { collection: ComponentFeatureCollection; refineEmitMap: RefineFeatureEmitMap } {
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

	return {
		collection,
		refineEmitMap
	};
}
