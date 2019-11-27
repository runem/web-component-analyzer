import { AnalyzerFlavor } from "../analyzer-flavor";
import { discoverDefinitions } from "./discover-definitions";
import { discoverEvents } from "./discover-events";
import { discoverInheritance } from "./discover-inheritance";
import { discoverMembers } from "./discover-members";
import { discoverMethods } from "./discover-methods";

export class CustomElementFlavor implements AnalyzerFlavor {
	discoverDefinitions = discoverDefinitions;

	discoverFeatures = {
		member: discoverMembers,
		event: discoverEvents,
		method: discoverMethods
	};

	discoverInheritance = discoverInheritance;
}
